namespace YesChef.Core.DTOs;

public record DailySalesResponse(
    string Date,
    int TotalOrders,
    decimal TotalRevenue,
    decimal TotalDeliveryFee,
    int DineInCount,
    int TakeawayCount,
    int DeliveryCount,
    List<HourlySales> HourlyBreakdown
);

public record HourlySales(int Hour, int Orders, decimal Revenue);

public record TopProductResponse(
    Guid ProductId,
    string ProductName,
    int TotalQuantity,
    decimal TotalRevenue
);

public record SummaryResponse(
    DateTime From,
    DateTime To,
    int TotalOrders,
    decimal TotalRevenue,
    decimal AverageOrderValue,
    string TopProduct,
    int TopProductQuantity
);
