using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YesChef.Core.DTOs;
using YesChef.Infrastructure.Data;

namespace YesChef.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin,waiter,kitchen")]
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

        var baseQuery = _context.Orders
            .AsNoTracking()
            .Where(o => o.CreatedAt >= day && o.CreatedAt < nextDay
                     && o.Status != "cancelled");

        var totalOrders = await baseQuery.CountAsync();
        var totalRevenue = await baseQuery.SumAsync(o => o.Total);
        var totalDeliveryFee = await baseQuery.SumAsync(o => o.DeliveryFee);
        var dineInCount = await baseQuery.CountAsync(o => o.OrderType == "dine-in");
        var takeawayCount = await baseQuery.CountAsync(o => o.OrderType == "takeaway");
        var deliveryCount = await baseQuery.CountAsync(o => o.OrderType == "delivery");

        var byHour = await _context.Orders
            .AsNoTracking()
            .Where(o => o.CreatedAt >= day && o.CreatedAt < nextDay
                     && o.Status != "cancelled")
            .GroupBy(o => o.CreatedAt.Hour)
            .Select(g => new HourlySales(
                g.Key,
                g.Count(),
                g.Sum(o => o.Total)))
            .ToListAsync();

        var hourly = Enumerable.Range(8, 14)
            .Select(h => byHour.FirstOrDefault(x => x.Hour == h)
                ?? new HourlySales(h, 0, 0))
            .Where(h => h.Orders > 0 || h.Revenue > 0)
            .ToList();

        return Ok(new DailySalesResponse(
            day.ToString("yyyy-MM-dd"),
            totalOrders,
            totalRevenue,
            totalDeliveryFee,
            dineInCount,
            takeawayCount,
            deliveryCount,
            hourly
        ));
    }

    [HttpGet("top-products")]
    public async Task<IActionResult> GetTopProducts([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var fromDate = UtcDay(from, DateTime.UtcNow.AddDays(-30));
        var toDate = UtcDay(to, DateTime.UtcNow.AddDays(1));

        var items = await _context.OrderItems
            .AsNoTracking()
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

        var baseQuery = _context.Orders
            .AsNoTracking()
            .Where(o => o.CreatedAt >= fromDate
                     && o.CreatedAt < toDate
                     && o.Status != "cancelled");

        var totalOrders = await baseQuery.CountAsync();
        var totalRevenue = await baseQuery.SumAsync(o => o.Total);
        var average = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        var topProduct = await _context.OrderItems
            .AsNoTracking()
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
            totalOrders,
            totalRevenue,
            average,
            topProduct?.Name ?? "-",
            topProduct?.Qty ?? 0
        ));
    }
}
