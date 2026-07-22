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

        var validTypes = new[] { "dine-in", "takeaway", "delivery" };
        if (!validTypes.Contains(request.OrderType))
            return BadRequest(new { message = "Tipo de pedido inválido. Use: dine-in, takeaway, delivery" });

        if (request.OrderType == "dine-in" && !request.TableNumber.HasValue)
            return BadRequest(new { message = "Para comer en el local necesitás un número de mesa" });

        if (request.OrderType == "delivery" && string.IsNullOrWhiteSpace(request.DeliveryAddress))
            return BadRequest(new { message = "Para delivery necesitás una dirección" });

        Guid? tableId = null;
        if (request.OrderType == "dine-in" && request.TableNumber.HasValue)
        {
            var table = await _context.Tables
                .FirstOrDefaultAsync(t => t.Number == request.TableNumber.Value);

            if (table is null)
            {
                table = new Table { Number = request.TableNumber.Value, Capacity = 4 };
                _context.Tables.Add(table);
                await _context.SaveChangesAsync();
            }
            tableId = table.Id;
        }

        var productIds = request.Items.Select(i => i.ProductId).ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        if (products.Count != productIds.Count)
            return BadRequest(new { message = "Algún producto no existe" });

        var deliveryFee = request.OrderType == "delivery" ? 1500m : 0m;

        var order = new Order
        {
            TableId = tableId,
            OrderType = request.OrderType,
            ContactName = request.ContactName,
            ContactPhone = request.ContactPhone,
            DeliveryAddress = request.DeliveryAddress,
            DeliveryFee = deliveryFee,
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

        order.Total = order.OrderItems.Sum(i => i.UnitPrice * i.Quantity) + deliveryFee;

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var response = BuildResponse(order, products);

        await _hub.Clients.Group("kitchen").SendAsync("NewOrder", response);

        return Ok(response);
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActive([FromQuery] string? type)
    {
        var query = _context.Orders
            .Include(o => o.Table)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Where(o => o.Status != "delivered" && o.Status != "cancelled")
            .AsQueryable();

        if (!string.IsNullOrEmpty(type))
            query = query.Where(o => o.OrderType == type);

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(orders.Select(o => BuildResponse(o)));
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

        var response = BuildResponse(order);

        await _hub.Clients.Group("kitchen").SendAsync("OrderUpdated", response);

        return Ok(response);
    }

    private static OrderResponse BuildResponse(Order order, Dictionary<Guid, Product>? products = null)
    {
        return new OrderResponse(
            order.Id,
            order.OrderType,
            order.Table?.Number,
            order.Status,
            order.Total,
            order.DeliveryFee,
            order.ContactName,
            order.ContactPhone,
            order.DeliveryAddress,
            order.Notes,
            order.CreatedAt,
            order.OrderItems.Select(i => new OrderItemResponse(
                i.Id, i.ProductId,
                products?[i.ProductId].Name ?? i.Product.Name,
                i.Quantity, i.UnitPrice, i.Status, i.Notes
            )).ToList()
        );
    }
}

public record UpdateOrderStatusRequest(string Status);
