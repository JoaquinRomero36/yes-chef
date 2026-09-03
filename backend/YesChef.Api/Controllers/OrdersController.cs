using Microsoft.AspNetCore.Authorization;
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
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest request)
    {
        if (request.Items is null || request.Items.Count == 0)
            return BadRequest(new { message = "El pedido debe tener al menos un item" });

        var validTypes = new[] { "dine-in", "takeaway", "delivery" };
        if (!validTypes.Contains(request.OrderType))
            return BadRequest(new { message = "Tipo de pedido inválido. Use: dine-in, takeaway, delivery" });

        var validPayments = new[] { "cash", "debit", "credit", "mercado_pago", "voucher" };
        if (request.PaymentMethod is not null && !validPayments.Contains(request.PaymentMethod.ToLowerInvariant()))
            return BadRequest(new { message = "Método de pago inválido. Use: cash, debit, credit, mercado_pago, voucher" });

        if (request.OrderType == "delivery" && string.IsNullOrWhiteSpace(request.PaymentMethod))
            return BadRequest(new { message = "Para delivery el pago debe registrarse al hacer el pedido" });

        if (request.OrderType == "delivery" && request.PaymentMethod?.ToLowerInvariant() == "cash")
            return BadRequest(new { message = "El delivery no se puede pagar en efectivo en el local" });

        foreach (var item in request.Items)
        {
            if (item.Quantity < 1 || item.Quantity > 99)
                return BadRequest(new { message = "La cantidad de cada item debe estar entre 1 y 99" });
        }

        var duplicate = request.Items
            .GroupBy(i => i.ProductId)
            .FirstOrDefault(g => g.Count() > 1);
        if (duplicate is not null)
            return BadRequest(new { message = "No repitas el mismo producto en el pedido. Ajustá la cantidad." });

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

            var mesaOcupada = await _context.Orders
                .AnyAsync(o => o.TableId == tableId
                    && o.Status != "delivered"
                    && o.Status != "cancelled");

            if (mesaOcupada)
                return Conflict(new { message = $"La mesa {request.TableNumber.Value} ya tiene un pedido en curso" });
        }

        var productIds = request.Items.Select(i => i.ProductId).ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        if (products.Count != productIds.Count)
            return BadRequest(new { message = "Algún producto no existe" });

        foreach (var item in request.Items)
        {
            if (!products.TryGetValue(item.ProductId, out var product))
                return BadRequest(new { message = $"Producto {item.ProductId} no encontrado" });

            if (!product.IsActive || !product.IsAvailable)
                return BadRequest(new { message = $"'{product.Name}' no está disponible en este momento" });

            if (request.OrderType != "dine-in" && !product.IsAvailableForAway)
                return BadRequest(new { message = $"'{product.Name}' solo se puede consumir en el local" });
        }

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
            PaymentMethod = request.PaymentMethod?.ToLowerInvariant(),
            PaidAt = request.PaymentMethod is null ? null : DateTime.UtcNow
        };

        foreach (var item in request.Items)
        {
            var product = products[item.ProductId];

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
    [Authorize(Roles = "admin,waiter,kitchen")]
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

    [HttpGet("cashable")]
    [Authorize(Roles = "admin,waiter,kitchen")]
    public async Task<IActionResult> GetCashable()
    {
        var orders = await _context.Orders
            .Include(o => o.Table)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Where(o => o.Status == "delivered" && o.Status != "cancelled")
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(orders.Select(o => BuildResponse(o)));
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "admin,waiter,kitchen")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusRequest request)
    {
        var validStatuses = new[] { "pending", "preparing", "ready", "delivered", "cancelled" };
        if (!validStatuses.Contains(request.Status))
            return BadRequest(new { message = "Estado inválido. Use: pending, preparing, ready, delivered, cancelled" });

        var order = await _context.Orders
            .Include(o => o.Table)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order is null) return NotFound();

        var allowedTransitions = new Dictionary<string, string[]>
        {
            ["pending"] = new[] { "preparing", "cancelled" },
            ["preparing"] = new[] { "ready", "cancelled" },
            ["ready"] = new[] { "delivered", "cancelled" },
            ["delivered"] = Array.Empty<string>(),
            ["cancelled"] = Array.Empty<string>()
        };

        if (order.Status != request.Status
            && !allowedTransitions[order.Status].Contains(request.Status))
            return BadRequest(new { message = $"No se puede pasar de '{order.Status}' a '{request.Status}'" });

        if (request.Status == "cancelled" && order.PaidAt is not null)
            return BadRequest(new { message = "Un pedido ya cobrado no se puede cancelar. Revisá el cobro en caja." });

        order.Status = request.Status;
        order.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var response = BuildResponse(order);

        await _hub.Clients.Group("kitchen").SendAsync("OrderUpdated", response);

        return Ok(response);
    }

    [HttpPatch("{id:guid}/pay")]
    [Authorize(Roles = "admin,waiter,kitchen")]
    public async Task<IActionResult> Pay(Guid id, [FromBody] PayOrderRequest request)
    {
        var validPayments = new[] { "cash", "debit", "credit", "mercado_pago", "voucher" };
        if (request.PaymentMethod is null || !validPayments.Contains(request.PaymentMethod.ToLowerInvariant()))
            return BadRequest(new { message = "Método de pago inválido. Use: cash, debit, credit, mercado_pago, voucher" });

        var order = await _context.Orders
            .Include(o => o.Table)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order is null) return NotFound();

        if (order.Status != "delivered")
            return BadRequest(new { message = "Solo se puede cobrar un pedido entregado" });

        if (order.PaidAt is not null)
            return Conflict(new { message = "Este pedido ya está pagado" });

        if (order.OrderType == "delivery" && request.PaymentMethod.ToLowerInvariant() == "cash")
            return BadRequest(new { message = "El delivery no se puede cobrar en efectivo en el local" });

        order.PaymentMethod = request.PaymentMethod.ToLowerInvariant();
        order.PaidAt = DateTime.UtcNow;
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
            order.PaymentMethod,
            order.PaidAt,
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
public record PayOrderRequest(string? PaymentMethod);
