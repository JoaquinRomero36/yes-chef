using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YesChef.Core.DTOs;
using YesChef.Core.Entities;
using YesChef.Infrastructure.Data;

namespace YesChef.Api.Controllers;

[ApiController]
[Route("api/cash-register")]
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
            .SumAsync(o => o.Total);

        return Ok(new
        {
            status = "open",
            active.Id,
            active.OpenedAt,
            active.OpeningBalance,
            active.Notes,
            todayOrders
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

        register.ClosedAt = DateTime.UtcNow;
        register.ClosingBalance = request.ClosingBalance;
        register.CashSales = request.CashSales;
        register.CardSales = request.CardSales;
        register.TransferSales = request.TransferSales;
        register.Notes = request.Notes;
        register.Status = "closed";
        register.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new CashRegisterResponse(
            register.Id, register.OpenedAt, register.ClosedAt,
            register.OpeningBalance, register.ClosingBalance,
            register.CashSales, register.CardSales, register.TransferSales,
            request.CashSales + request.CardSales + request.TransferSales,
            register.Status, register.Notes
        ));
    }
}
