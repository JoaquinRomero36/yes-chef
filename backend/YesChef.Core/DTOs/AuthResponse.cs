namespace YesChef.Core.DTOs;

public record AuthResponse(string Token, string Email, string Username, string Role);
