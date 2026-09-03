using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var active = await _context.Set<CashRegister>()
            .Where(c => c.Status == "open")
            .OrderByDescending(c => c.OpenedAt)
            .FirstOrDefaultAsync();

        if (active is null)
            return Ok(new { status = "closed", message = "Caja cerrada" });

        var todayOrders = await _context.Orders
            .Where(o => o.CreatedAt >= active.OpenedAt
                     && o.Status != "cancelled")
            .ToListAsync();

        var cashSales = todayOrders.Where(o => o.PaymentMethod == "cash").Sum(o => o.Total);
        var cardSales = todayOrders.Where(o => o.PaymentMethod == "card").Sum(o => o.Total);
        var transferSales = todayOrders.Where(o => o.PaymentMethod == "transfer").Sum(o => o.Total);
        var totalSales = cashSales + cardSales + transferSales;

        return Ok(new
        {
            status = "open",
            active.Id,
            active.OpenedAt,
            active.OpeningBalance,
            active.Notes,
            todayOrders = todayOrders.Sum(o => o.Total),
            cashSales,
            cardSales,
            transferSales,
            totalSales
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
            register.Status, register.Notes
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
        var sales = await _context.Orders
            .Where(o => o.CreatedAt >= register.OpenedAt
                     && o.Status != "cancelled")
            .GroupBy(o => o.PaymentMethod)
            .Select(g => new { Method = g.Key, Total = g.Sum(o => o.Total) })
            .ToListAsync();

        decimal MethodTotal(string? method) => sales.FirstOrDefault(s => s.Method == method)?.Total ?? 0m;

        var cashSales = MethodTotal("cash");
        var cardSales = MethodTotal("card");
        var transferSales = MethodTotal("transfer");
        var totalSales = cashSales + cardSales + transferSales;

        register.ClosedAt = DateTime.UtcNow;
        register.ClosingBalance = request.ClosingBalance;
        register.CashSales = cashSales;
        register.CardSales = cardSales;
        register.TransferSales = transferSales;
        register.Notes = request.Notes;
        register.Status = "closed";
        register.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new CashRegisterResponse(
            register.Id, register.OpenedAt, register.ClosedAt,
            register.OpeningBalance, register.ClosingBalance,
            register.CashSales, register.CardSales, register.TransferSales,
            totalSales, register.Status, register.Notes
        ));
    }
}
