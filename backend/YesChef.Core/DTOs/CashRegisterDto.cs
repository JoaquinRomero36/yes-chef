namespace YesChef.Core.DTOs;

public record CashRegisterResponse(
    Guid Id, DateTime OpenedAt, DateTime? ClosedAt,
    decimal OpeningBalance, decimal? ClosingBalance,
    decimal? CashSales, decimal? CardSales, decimal? TransferSales,
    decimal? TotalSales, string Status, string? Notes,
    List<PaymentMethodSales>? PaymentBreakdown
);

public record PaymentMethodSales(string Method, string Label, decimal Total);

public record OpenCashRegisterRequest(decimal OpeningBalance, string? Notes);

public record CloseCashRegisterRequest(decimal ClosingBalance, string? Notes);
