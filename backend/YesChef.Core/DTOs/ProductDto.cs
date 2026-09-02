using System.ComponentModel.DataAnnotations;

namespace YesChef.Core.DTOs;

public record ProductDto(
    Guid Id, string Name, string? Description, decimal Price,
    Guid CategoryId, string CategoryName, string? ImageUrl,
    bool IsAvailable, bool IsAvailableForAway, bool IsActive
);

public record CreateProductRequest(
    [Required, StringLength(120)] string Name,
    [StringLength(400)] string? Description,
    [Range(0, 10_000_000)] decimal Price,
    Guid CategoryId,
    [Url] string? ImageUrl,
    bool IsAvailableForAway = true
);

public record UpdateProductRequest(
    [Required, StringLength(120)] string Name,
    [StringLength(400)] string? Description,
    [Range(0, 10_000_000)] decimal Price,
    Guid CategoryId,
    [Url] string? ImageUrl,
    bool IsAvailable,
    bool IsAvailableForAway,
    bool IsActive
);
