using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YesChef.Core.DTOs;
using YesChef.Infrastructure.Data;

namespace YesChef.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReportsController(AppDbContext context)
    {
        _context = context;
    }

    private static DateTime UtcDay(DateTime? value, DateTime fallback)
    {
        return DateTime.SpecifyKind((value ?? fallback).Date, DateTimeKind.Utc);
    }

    [HttpGet("daily-sales")]
    public async Task<IActionResult> GetDailySales([FromQuery] DateTime? date)
    {
        var day = UtcDay(date, DateTime.UtcNow);
        var nextDay = day.AddDays(1);

        var orders = await _context.Orders
            .Where(o => o.CreatedAt >= day && o.CreatedAt < nextDay
                     && o.Status != "cancelled")
            .ToListAsync();

        var hourly = Enumerable.Range(8, 14)
            .Select(h => new HourlySales(
                h,
                orders.Count(o => o.CreatedAt.Hour == h),
                orders.Where(o => o.CreatedAt.Hour == h)
                      .Sum(o => o.Total)
            )).Where(h => h.Orders > 0 || h.Revenue > 0)
            .ToList();

        return Ok(new DailySalesResponse(
            day.ToString("yyyy-MM-dd"),
            orders.Count,
            orders.Sum(o => o.Total),
            orders.Sum(o => o.DeliveryFee),
            orders.Count(o => o.OrderType == "dine-in"),
            orders.Count(o => o.OrderType == "takeaway"),
            orders.Count(o => o.OrderType == "delivery"),
            hourly
        ));
    }

    [HttpGet("top-products")]
    public async Task<IActionResult> GetTopProducts([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var fromDate = UtcDay(from, DateTime.UtcNow.AddDays(-30));
        var toDate = UtcDay(to, DateTime.UtcNow.AddDays(1));

        var items = await _context.OrderItems
            .Include(i => i.Order)
            .Where(i => i.Order.CreatedAt >= fromDate
                     && i.Order.CreatedAt < toDate
                     && i.Order.Status != "cancelled")
            .GroupBy(i => new { i.ProductId, i.Product.Name })
            .Select(g => new
            {
                g.Key.ProductId,
                g.Key.Name,
                TotalQuantity = g.Sum(i => i.Quantity),
                Revenue = g.Sum(i => i.UnitPrice * i.Quantity)
            })
            .OrderByDescending(x => x.TotalQuantity)
            .Take(10)
            .ToListAsync();

        return Ok(items.Select(i => new TopProductResponse(i.ProductId, i.Name, i.TotalQuantity, i.Revenue)));
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var fromDate = UtcDay(from, DateTime.UtcNow.AddDays(-30));
        var toDate = UtcDay(to, DateTime.UtcNow.AddDays(1));

        var orders = await _context.Orders
            .Where(o => o.CreatedAt >= fromDate
                     && o.CreatedAt < toDate
                     && o.Status != "cancelled")
            .ToListAsync();

        var topProduct = await _context.OrderItems
            .Include(i => i.Order)
            .Where(i => i.Order.CreatedAt >= fromDate
                     && i.Order.CreatedAt < toDate
                     && i.Order.Status != "cancelled")
            .GroupBy(i => i.Product.Name)
            .Select(g => new { Name = g.Key, Qty = g.Sum(i => i.Quantity) })
            .OrderByDescending(x => x.Qty)
            .FirstOrDefaultAsync();

        return Ok(new SummaryResponse(
            fromDate, toDate,
            orders.Count,
            orders.Sum(o => o.Total),
            orders.Count > 0 ? orders.Average(o => o.Total) : 0,
            topProduct?.Name ?? "-",
            topProduct?.Qty ?? 0
        ));
    }
}
