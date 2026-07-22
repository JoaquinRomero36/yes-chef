namespace YesChef.Core.DTOs;

public record CreateOrderRequest(
    string OrderType,
    int? TableNumber,
    string? ContactName,
    string? ContactPhone,
    string? DeliveryAddress,
    string? Notes,
    List<CreateOrderItemRequest> Items
);

public record CreateOrderItemRequest(Guid ProductId, int Quantity, string? Notes);

public record OrderResponse(
    Guid Id, string OrderType, int? TableNumber, string Status, decimal Total,
    decimal DeliveryFee, string? ContactName, string? ContactPhone,
    string? DeliveryAddress, string? Notes, DateTime CreatedAt,
    List<OrderItemResponse> Items
);

public record OrderItemResponse(
    Guid Id, Guid ProductId, string ProductName, int Quantity,
    decimal UnitPrice, string Status, string? Notes
);
