using YesChef.Core.DTOs;
using YesChef.Core.Entities;

namespace YesChef.Core.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<User> RegisterAsync(string username, string email, string password, string? fullName, Guid roleId);
}
