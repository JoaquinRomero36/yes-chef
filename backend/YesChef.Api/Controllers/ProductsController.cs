using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YesChef.Core.DTOs;
using YesChef.Core.Entities;
using YesChef.Infrastructure.Data;

namespace YesChef.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProductsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] Guid? categoryId)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Where(p => p.IsActive)
            .AsQueryable();

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);

        var products = await query
            .OrderBy(p => p.Category!.DisplayOrder)
            .ThenBy(p => p.Name)
            .Select(p => new ProductDto(
                p.Id, p.Name, p.Description, p.Price,
                p.CategoryId, p.Category!.Name, p.ImageUrl,
                p.IsAvailable, p.IsAvailableForAway, p.IsActive))
            .ToListAsync();

        return Ok(products);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product is null) return NotFound();

        return Ok(new ProductDto(
            product.Id, product.Name, product.Description, product.Price,
            product.CategoryId, product.Category!.Name, product.ImageUrl,
            product.IsAvailable, product.IsAvailableForAway, product.IsActive));
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "El nombre del producto es obligatorio" });

        var category = await _context.Categories.FindAsync(request.CategoryId);
        if (category is null)
            return BadRequest(new { message = "La categoría no existe" });

        var duplicado = await _context.Products
            .AnyAsync(p => p.Name.ToLower() == request.Name.ToLower() && p.IsActive);
        if (duplicado)
            return BadRequest(new { message = $"Ya existe un producto llamado '{request.Name}'" });

        if (request.Price < 0)
            return BadRequest(new { message = "El precio no puede ser negativo" });

        var product = new Product
        {
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            CategoryId = request.CategoryId,
            ImageUrl = request.ImageUrl,
            IsAvailableForAway = request.IsAvailableForAway
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = product.Id },
            new ProductDto(
                product.Id, product.Name, product.Description, product.Price,
                product.CategoryId, category.Name, product.ImageUrl,
                product.IsAvailable, product.IsAvailableForAway, product.IsActive));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "El nombre del producto es obligatorio" });

        var product = await _context.Products.FindAsync(id);
        if (product is null) return NotFound();

        var category = await _context.Categories.FindAsync(request.CategoryId);
        if (category is null)
            return BadRequest(new { message = "La categoría no existe" });

        if (request.Price < 0)
            return BadRequest(new { message = "El precio no puede ser negativo" });

        var duplicado = await _context.Products
            .AnyAsync(p => p.Name.ToLower() == request.Name.ToLower() && p.IsActive && p.Id != id);
        if (duplicado)
            return BadRequest(new { message = $"Ya existe un producto llamado '{request.Name}'" });

        if (request.IsActive == false)
        {
            var activos = await _context.Products.CountAsync(p => p.IsActive && p.Id != id);
            if (activos == 0)
                return BadRequest(new { message = "No se puede desactivar el último producto activo del menú" });
        }

        product.Name = request.Name;
        product.Description = request.Description;
        product.Price = request.Price;
        product.CategoryId = request.CategoryId;
        product.ImageUrl = request.ImageUrl;
        product.IsAvailable = request.IsAvailable;
        product.IsAvailableForAway = request.IsAvailableForAway;
        product.IsActive = request.IsActive;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product is null) return NotFound();

        var activos = await _context.Products.CountAsync(p => p.IsActive && p.Id != id);
        if (activos == 0)
            return BadRequest(new { message = "No se puede desactivar el último producto activo del menú" });

        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
