namespace YesChef.Core.DTOs;

public record ProductDto(
    Guid Id, string Name, string? Description, decimal Price,
    Guid CategoryId, string CategoryName, string? ImageUrl,
    bool IsAvailable, bool IsAvailableForAway, bool IsActive
);

public record CreateProductRequest(
    string Name, string? Description, decimal Price,
    Guid CategoryId, string? ImageUrl, bool IsAvailableForAway = true
);

public record UpdateProductRequest(
    string Name, string? Description, decimal Price,
    Guid CategoryId, string? ImageUrl, bool IsAvailable, bool IsAvailableForAway, bool IsActive
);
