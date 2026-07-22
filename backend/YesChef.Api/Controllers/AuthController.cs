using Microsoft.AspNetCore.Mvc;
using YesChef.Core.DTOs;
using YesChef.Core.Entities;
using YesChef.Core.Interfaces;

namespace YesChef.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IRepository<Role> _roleRepo;

    public AuthController(IAuthService authService, IRepository<Role> roleRepo)
    {
        _authService = authService;
        _roleRepo = roleRepo;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var user = await _authService.RegisterAsync(
                request.Username, request.Email, request.Password,
                request.FullName, request.RoleId);

            return Ok(new { id = user.Id, message = "Usuario creado exitosamente" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _roleRepo.GetAllAsync();
        return Ok(roles.Select(r => new { r.Id, r.Name, r.Description }));
    }
}

public record RegisterRequest(string Username, string Email, string Password, string? FullName, Guid RoleId);
