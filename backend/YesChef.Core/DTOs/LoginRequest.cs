using System.ComponentModel.DataAnnotations;

namespace YesChef.Core.DTOs;

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(1)] string Password
);
