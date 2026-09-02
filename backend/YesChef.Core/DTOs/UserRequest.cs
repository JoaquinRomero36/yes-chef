using System.ComponentModel.DataAnnotations;

namespace YesChef.Core.DTOs;

public record RegisterRequest(
    [Required, StringLength(50, MinimumLength = 3)] string Username,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [StringLength(120)] string? FullName
);

public record CreateStaffRequest(
    [Required, StringLength(50, MinimumLength = 3)] string Username,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [StringLength(120)] string? FullName,
    Guid RoleId
);