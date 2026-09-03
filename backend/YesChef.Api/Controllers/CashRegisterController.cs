using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YesChef.Core;
using YesChef.Core.DTOs;
using YesChef.Core.Entities;
using YesChef.Infrastructure.Data;

namespace YesChef.Api.Controllers;

[ApiController]
[Route("api/cash-register")]
[Authorize(Roles = "admin,waiter,kitchen")]
public class CashRegisterController : ControllerBase
{
    private readonly AppDbContext _context;

    public CashRegisterController(AppDbContext context)
    {
        _context = context;
    }

    private static List<PaymentMethodSales> BuildBreakdown(IEnumerable<IGrouping<string?, Order>> groups)
    {
        return PaymentMethods.AllLabels
            .Where(kvp => groups.Any(g => g.Key == kvp.Key))
            .Select(kvp => new PaymentMethodSales(
                kvp.Key,
                kvp.Value,
                groups.First(g => g.Key == kvp.Key).Sum(o => o.Total)))
            .ToList();
    }

    private static decimal MethodTotal(List<IGrouping<string?, Order>> groups, string method)
    {
        return groups.FirstOrDefault(g => g.Key == method)?.Sum(o => o.Total) ?? 0m;
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var active = await _context.Set<CashRegister>()
            .AsNoTracking()
            .Where(c => c.Status == "open")
            .OrderByDescending(c => c.OpenedAt)
            .FirstOrDefaultAsync();

        if (active is null)
            return Ok(new { status = "closed", message = "Caja cerrada" });

        var todayOrders = await _context.Orders
            .AsNoTracking()
            .Where(o => o.CreatedAt >= active.OpenedAt
                     && o.Status != "cancelled"
                     && o.PaidAt != null)
            .ToListAsync();

        var breakdown = todayOrders
            .Where(o => o.PaymentMethod != null)
            .GroupBy(o => o.PaymentMethod)
            .ToList();

        var cashSales = MethodTotal(breakdown, "cash");
        var cardSales = MethodTotal(breakdown, "debit") + MethodTotal(breakdown, "credit");
        var transferSales = MethodTotal(breakdown, "mercado_pago") + MethodTotal(breakdown, "voucher");
        var totalSales = todayOrders.Where(o => o.PaymentMethod != null).Sum(o => o.Total);
        var orderTotal = todayOrders.Sum(o => o.Total);

        return Ok(new
        {
            status = "open",
            active.Id,
            active.OpenedAt,
            active.OpeningBalance,
            active.Notes,
            todayOrders = orderTotal,
            cashSales,
            cardSales,
            transferSales,
            totalSales,
            paymentBreakdown = BuildBreakdown(breakdown)
        });
    }

    [HttpPost("open")]
    public async Task<IActionResult> Open([FromBody] OpenCashRegisterRequest request)
    {
        var existing = await _context.Set<CashRegister>()
            .AnyAsync(c => c.Status == "open");

        if (existing)
            return BadRequest(new { message = "Ya hay una caja abierta" });

        var register = new CashRegister
        {
            OpenedAt = DateTime.UtcNow,
            OpeningBalance = request.OpeningBalance,
            Notes = request.Notes,
            Status = "open"
        };

        _context.Set<CashRegister>().Add(register);
        await _context.SaveChangesAsync();

        return Ok(new CashRegisterResponse(
            register.Id, register.OpenedAt, null,
            register.OpeningBalance, null, null, null, null, null,
            register.Status, register.Notes, null
        ));
    }

    [HttpPost("close")]
    public async Task<IActionResult> Close([FromBody] CloseCashRegisterRequest request)
    {
        var register = await _context.Set<CashRegister>()
            .FirstOrDefaultAsync(c => c.Status == "open");

        if (register is null)
            return BadRequest(new { message = "No hay caja abierta" });

        if (request.ClosingBalance < 0)
            return BadRequest(new { message = "El total en caja no puede ser negativo" });

        // Ventas del turno derivadas de los pedidos, agrupadas por método de pago.
        var breakdown = await _context.Orders
            .Where(o => o.CreatedAt >= register.OpenedAt
                     && o.Status != "cancelled"
                     && o.PaidAt != null)
            .GroupBy(o => o.PaymentMethod)
            .ToListAsync();

        decimal cashSales = MethodTotal(breakdown, "cash");
        decimal cardSales = MethodTotal(breakdown, "debit") + MethodTotal(breakdown, "credit");
        decimal transferSales = MethodTotal(breakdown, "mercado_pago") + MethodTotal(breakdown, "voucher");
        var totalSales = breakdown.Sum(g => g.Sum(o => o.Total));

        register.ClosedAt = DateTime.UtcNow;
        register.ClosingBalance = request.ClosingBalance;
        register.CashSales = cashSales;
        register.CardSales = cardSales;
        register.TransferSales = transferSales;
        register.PaymentBreakdown = System.Text.Json.JsonSerializer.Serialize(BuildBreakdown(breakdown));
        register.Notes = request.Notes;
        register.Status = "closed";
        register.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new CashRegisterResponse(
            register.Id, register.OpenedAt, register.ClosedAt,
            register.OpeningBalance, register.ClosingBalance,
            register.CashSales, register.CardSales, register.TransferSales,
            totalSales, register.Status, register.Notes,
            BuildBreakdown(breakdown)
        ));
    }
}
