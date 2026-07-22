using Microsoft.EntityFrameworkCore;
using YesChef.Core.Entities;

namespace YesChef.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Table> Tables => Set<Table>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Username).IsUnique();
            e.HasIndex(u => u.Email).IsUnique();
            e.HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId);
        });

        modelBuilder.Entity<Role>(e =>
        {
            e.HasIndex(r => r.Name).IsUnique();
        });

        modelBuilder.Entity<Category>(e =>
        {
            e.HasIndex(c => c.Name);
        });

        modelBuilder.Entity<Product>(e =>
        {
            e.HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId);
            e.HasIndex(p => p.Name);
        });

        modelBuilder.Entity<Table>(e =>
        {
            e.HasIndex(t => t.Number).IsUnique();
        });

        modelBuilder.Entity<Order>(e =>
        {
            e.HasOne(o => o.Table)
                .WithMany(t => t.Orders)
                .HasForeignKey(o => o.TableId);
            e.HasOne(o => o.User)
                .WithMany(u => u.Orders)
                .HasForeignKey(o => o.UserId);
            e.HasIndex(o => o.OrderType);
            e.HasIndex(o => o.Status);
            e.HasIndex(o => o.CreatedAt);
        });

        modelBuilder.Entity<OrderItem>(e =>
        {
            e.HasOne(oi => oi.Order)
                .WithMany(o => o.OrderItems)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(oi => oi.Product)
                .WithMany(p => p.OrderItems)
                .HasForeignKey(oi => oi.ProductId);
            e.HasIndex(oi => oi.OrderId);
        });
    }
}
