using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using YesChef.Api.Hubs;
using YesChef.Core.DTOs;
using YesChef.Core.Entities;
using YesChef.Infrastructure.Data;

namespace YesChef.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHubContext<OrderHub> _hub;

    public OrdersController(AppDbContext context, IHubContext<OrderHub> hub)
    {
        _context = context;
        _hub = hub;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest request)
    {
        if (request.Items is null || request.Items.Count == 0)
            return BadRequest(new { message = "El pedido debe tener al menos un item" });

        var table = await _context.Tables
            .FirstOrDefaultAsync(t => t.Number == request.TableNumber);

        if (table is null)
        {
            table = new Table { Number = request.TableNumber, Capacity = 4 };
            _context.Tables.Add(table);
            await _context.SaveChangesAsync();
        }

        var productIds = request.Items.Select(i => i.ProductId).ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        if (products.Count != productIds.Count)
            return BadRequest(new { message = "Algún producto no existe" });

        var order = new Order
        {
            TableId = table.Id,
            Notes = request.Notes,
            Status = "pending",
        };

        foreach (var item in request.Items)
        {
            if (!products.TryGetValue(item.ProductId, out var product))
                return BadRequest(new { message = $"Producto {item.ProductId} no encontrado" });

            order.OrderItems.Add(new OrderItem
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = product.Price,
                Notes = item.Notes,
                Status = "pending"
            });
        }

        order.Total = order.OrderItems.Sum(i => i.UnitPrice * i.Quantity);

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var response = new OrderResponse(
            order.Id, request.TableNumber, order.Status, order.Total,
            order.Notes, order.CreatedAt,
            order.OrderItems.Select(i => new OrderItemResponse(
                i.Id, i.ProductId, products[i.ProductId].Name,
                i.Quantity, i.UnitPrice, i.Status, i.Notes
            )).ToList()
        );

        await _hub.Clients.Group("kitchen").SendAsync("NewOrder", response);

        return Ok(response);
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActive()
    {
        var orders = await _context.Orders
            .Include(o => o.Table)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Where(o => o.Status != "delivered" && o.Status != "cancelled")
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderResponse(
                o.Id, o.Table!.Number, o.Status, o.Total,
                o.Notes, o.CreatedAt,
                o.OrderItems.Select(i => new OrderItemResponse(
                    i.Id, i.ProductId, i.Product.Name,
                    i.Quantity, i.UnitPrice, i.Status, i.Notes
                )).ToList()
            ))
            .ToListAsync();

        return Ok(orders);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusRequest request)
    {
        var order = await _context.Orders
            .Include(o => o.Table)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order is null) return NotFound();

        order.Status = request.Status;
        order.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var response = new OrderResponse(
            order.Id, order.Table!.Number, order.Status, order.Total,
            order.Notes, order.CreatedAt,
            order.OrderItems.Select(i => new OrderItemResponse(
                i.Id, i.ProductId, i.Product.Name,
                i.Quantity, i.UnitPrice, i.Status, i.Notes
            )).ToList()
        );

        await _hub.Clients.Group("kitchen").SendAsync("OrderUpdated", response);

        return Ok(response);
    }
}

public record UpdateOrderStatusRequest(string Status);
