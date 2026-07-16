using Microsoft.AspNetCore.Mvc;
using YesChef.Core.Entities;
using YesChef.Core.Interfaces;

namespace YesChef.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IRepository<User> _userRepo;
    private readonly IRepository<Role> _roleRepo;

    public AuthController(IRepository<User> userRepo, IRepository<Role> roleRepo)
    {
        _userRepo = userRepo;
        _roleRepo = roleRepo;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var existingUser = (await _userRepo.GetAllAsync())
            .FirstOrDefault(u => u.Email == request.Email || u.Username == request.Username);

        if (existingUser != null)
            return BadRequest("El usuario ya existe");

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = HashPassword(request.Password),
            FullName = request.FullName,
            RoleId = request.RoleId
        };

        await _userRepo.AddAsync(user);
        return Ok(new { message = "Usuario creado exitosamente" });
    }

    private static string HashPassword(string password) =>
        BCrypt.Net.BCrypt.HashPassword(password);
}

public record RegisterRequest(string Username, string Email, string Password, string? FullName, Guid RoleId);
