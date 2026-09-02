using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YesChef.Core.DTOs;
using YesChef.Core.Entities;
using YesChef.Core.Interfaces;
using YesChef.Infrastructure.Data;

namespace YesChef.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IRepository<Role> _roleRepo;
    private readonly AppDbContext _context;

    public AuthController(IAuthService authService, IRepository<Role> roleRepo, AppDbContext context)
    {
        _authService = authService;
        _roleRepo = roleRepo;
        _context = context;
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
            var userCount = await _context.Users.CountAsync();
            if (userCount > 0)
                return BadRequest(new { message = "El registro está deshabilitado. Solo el administrador puede crear usuarios." });

            // Primer usuario del sistema = administrador (el dueño del restaurante)
            var adminRole = (await _roleRepo.GetAllAsync())
                .FirstOrDefault(r => r.Name == "admin");

            if (adminRole is null)
                return BadRequest(new { message = "El rol admin no está configurado" });

            var user = await _authService.RegisterAsync(
                request.Username, request.Email, request.Password,
                request.FullName, adminRole.Id);

            return Ok(new { id = user.Id, message = "Usuario administrador creado exitosamente" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("users")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> CreateStaff([FromBody] CreateStaffRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Usuario, email y contraseña son obligatorios" });

        var roles = await _roleRepo.GetAllAsync();
        var role = roles.FirstOrDefault(r => r.Id == request.RoleId);

        if (role is null)
            return BadRequest(new { message = "El rol seleccionado no existe" });

        var staffRoles = new[] { "admin", "waiter", "kitchen" };
        if (!staffRoles.Contains(role.Name.ToLowerInvariant()))
            return BadRequest(new { message = "No se puede asignar el rol de cliente al personal" });

        try
        {
            var user = await _authService.RegisterAsync(
                request.Username, request.Email, request.Password,
                request.FullName, role.Id);

            return Ok(new { id = user.Id, message = "Usuario creado exitosamente" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("setup-status")]
    public async Task<IActionResult> GetSetupStatus()
    {
        var userCount = await _context.Users.CountAsync();
        return Ok(new { needsSetup = userCount == 0 });
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _roleRepo.GetAllAsync();
        return Ok(roles.Select(r => new { r.Id, r.Name, r.Description }));
    }
}
