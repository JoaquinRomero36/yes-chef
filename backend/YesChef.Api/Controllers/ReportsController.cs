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

    [HttpGet("daily-sales")]
    public async Task<IActionResult> GetDailySales([FromQuery] DateTime? date)
    {
        var day = (date ?? DateTime.Today).Date;
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
        var fromDate = (from ?? DateTime.Today.AddDays(-30)).Date;
        var toDate = (to ?? DateTime.Today.AddDays(1)).Date;

        var items = await _context.OrderItems
            .Include(i => i.Product)
            .Include(i => i.Order)
            .Where(i => i.Order!.CreatedAt >= fromDate
                     && i.Order.CreatedAt < toDate
                     && i.Order.Status != "cancelled")
            .GroupBy(i => new { i.ProductId, i.Product.Name })
            .Select(g => new TopProductResponse(
                g.Key.ProductId,
                g.Key.Name,
                g.Sum(i => i.Quantity),
                g.Sum(i => i.UnitPrice * i.Quantity)
            ))
            .OrderByDescending(r => r.TotalQuantity)
            .Take(10)
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var fromDate = (from ?? DateTime.Today.AddDays(-30)).Date;
        var toDate = (to ?? DateTime.Today.AddDays(1)).Date;

        var orders = await _context.Orders
            .Where(o => o.CreatedAt >= fromDate
                     && o.CreatedAt < toDate
                     && o.Status != "cancelled")
            .ToListAsync();

        var topProduct = await _context.OrderItems
            .Include(i => i.Product)
            .Include(i => i.Order)
            .Where(i => i.Order!.CreatedAt >= fromDate
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
