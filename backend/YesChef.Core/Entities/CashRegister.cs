namespace YesChef.Core.Entities;

public class CashRegister : BaseEntity
{
    public DateTime OpenedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public decimal OpeningBalance { get; set; }
    public decimal? ClosingBalance { get; set; }
    public decimal? CashSales { get; set; }
    public decimal? CardSales { get; set; }
    public decimal? TransferSales { get; set; }
    public string? Notes { get; set; }
    public string Status { get; set; } = "open";
    public Guid? OpenedByUserId { get; set; }
    public User? OpenedBy { get; set; }
}
