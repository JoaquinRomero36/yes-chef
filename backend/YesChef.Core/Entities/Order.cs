namespace YesChef.Core.Entities;

public class Order : BaseEntity
{
    public Guid? TableId { get; set; }
    public Table? Table { get; set; }
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public string OrderType { get; set; } = "dine-in";
    public string Status { get; set; } = "pending";
    public decimal Total { get; set; }
    public decimal DeliveryFee { get; set; }
    public string? ContactName { get; set; }
    public string? ContactPhone { get; set; }
    public string? DeliveryAddress { get; set; }
    public string? Notes { get; set; }
    public ICollection<OrderItem> OrderItems { get; set; } = [];
}
