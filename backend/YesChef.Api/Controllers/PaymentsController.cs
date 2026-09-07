using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using YesChef.Api.Hubs;
using YesChef.Core.Entities;
using YesChef.Core.Interfaces;
using YesChef.Infrastructure.Data;

namespace YesChef.Api.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IPaymentGatewayService _gateway;
    private readonly IHubContext<OrderHub> _hub;

    public PaymentsController(
        AppDbContext context,
        IPaymentGatewayService gateway,
        IHubContext<OrderHub> hub)
    {
        _context = context;
        _gateway = gateway;
        _hub = hub;
    }

    /// <summary>Crea un pago online para un pedido delivery pendiente de pago.</summary>
    [HttpPost("{orderId:guid}/checkout")]
    [AllowAnonymous]
    public async Task<IActionResult> Checkout(Guid orderId)
    {
        var transaction = await _context.PaymentTransactions
            .AsNoTracking()
            .Include(t => t.Order)
            .FirstOrDefaultAsync(t => t.OrderId == orderId);

        // Si el pedido aún no tiene transacción, se crea acá (fallback).
        if (transaction is null)
        {
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
            if (order is null) return NotFound();

            if (order.Status != "pending_payment")
                return BadRequest(new { message = "Este pedido no está pendiente de pago" });

            var result = await _gateway.CreatePreferenceAsync(orderId, order.Total);
            transaction = new PaymentTransaction
            {
                OrderId = orderId,
                ExternalId = result.ExternalId,
                Status = "pending",
                Amount = order.Total,
                Method = "mercado_pago"
            };
            _context.PaymentTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return Ok(new { checkoutUrl = result.PaymentUrl, transactionId = transaction.Id });
        }

        if (transaction.Status == "approved")
            return Ok(new { checkoutUrl = "aprobado", transactionId = transaction.Id });

        var pref = await _gateway.CreatePreferenceAsync(orderId, transaction.Amount);
        transaction.ExternalId = pref.ExternalId;
        await _context.SaveChangesAsync();

        return Ok(new { checkoutUrl = pref.PaymentUrl, transactionId = transaction.Id });
    }

    /// <summary>Confirma el pago (modo simulado / confirmación del cliente).</summary>
    [HttpPost("{orderId:guid}/confirm")]
    [AllowAnonymous]
    public async Task<IActionResult> Confirm(Guid orderId)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order is null) return NotFound();

        if (order.Status == "pending")
            return Ok(new { message = "El pedido ya fue confirmado", order.Id, order.Status });

        if (order.Status != "pending_payment")
            return BadRequest(new { message = "Este pedido no está pendiente de pago" });

        order.Status = "pending";
        order.PaymentMethod = "mercado_pago";
        order.PaidAt = DateTime.UtcNow;
        order.UpdatedAt = DateTime.UtcNow;

        var transaction = await _context.PaymentTransactions
            .FirstOrDefaultAsync(t => t.OrderId == orderId);
        if (transaction is not null)
        {
            transaction.Status = "approved";
            transaction.ConfirmedAt = DateTime.UtcNow;
            transaction.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        await _hub.Clients.Group("kitchen").SendAsync("NewOrder", new { order.Id, order.Status, order.PaymentMethod });

        return Ok(new { message = "¡Pago confirmado!", order.Id, order.Status, order.PaymentMethod, order.PaidAt });
    }

    /// <summary>Webhook de Mercado Pago (confirmación real de la pasarela).</summary>
    [HttpPost("webhook/mercado-pago")]
    [AllowAnonymous]
    public async Task<IActionResult> MercadoPagoWebhook()
    {
        // En este proyecto no aplicamos validación de firma de MP; los pagos se confirman
        // mediante el flujo simulado o el back_url del Checkout Pro. Se deja el endpoint
        // como punto de entrada para una integración en producción con la API de MP.
        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync();

        return Ok(new { received = true });
    }
}
