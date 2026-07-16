namespace YesChef.Core.Entities;

public class Table : BaseEntity
{
    public int Number { get; set; }
    public int Capacity { get; set; } = 4;
    public string? QrCode { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<Order> Orders { get; set; } = [];
}
