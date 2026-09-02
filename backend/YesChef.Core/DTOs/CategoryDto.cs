using System.ComponentModel.DataAnnotations;

namespace YesChef.Core.DTOs;

public record CategoryDto(Guid Id, string Name, string? Description, int DisplayOrder, bool IsActive);

public record CreateCategoryRequest(
    [Required, StringLength(60)] string Name,
    [StringLength(200)] string? Description,
    [Range(0, 1000)] int DisplayOrder
);

public record UpdateCategoryRequest(
    [Required, StringLength(60)] string Name,
    [StringLength(200)] string? Description,
    [Range(0, 1000)] int DisplayOrder,
    bool IsActive
);
