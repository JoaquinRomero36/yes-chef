namespace YesChef.Core.DTOs;

public record CreateOrderRequest(int TableNumber, List<CreateOrderItemRequest> Items, string? Notes);

public record CreateOrderItemRequest(Guid ProductId, int Quantity, string? Notes);

public record OrderResponse(
    Guid Id, int TableNumber, string Status, decimal Total,
    string? Notes, DateTime CreatedAt, List<OrderItemResponse> Items
);

public record OrderItemResponse(
    Guid Id, Guid ProductId, string ProductName, int Quantity,
    decimal UnitPrice, string Status, string? Notes
);
