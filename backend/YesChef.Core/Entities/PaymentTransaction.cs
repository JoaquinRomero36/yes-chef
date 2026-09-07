namespace YesChef.Core.Entities;

public class PaymentTransaction : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order? Order { get; set; }
    public string Gateway { get; set; } = "mercado_pago";
    public string? ExternalId { get; set; }
    public string Status { get; set; } = "pending";
    public decimal Amount { get; set; }
    public string? Method { get; set; }
    public string? Raw { get; set; }
    public DateTime? ConfirmedAt { get; set; }
}
