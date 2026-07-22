using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using YesChef.Api.Hubs;
using YesChef.Core.Entities;
using YesChef.Core.Interfaces;
using YesChef.Infrastructure.Data;
using YesChef.Infrastructure.Repositories;
using YesChef.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddSignalR();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IAuthService, AuthService>();

var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<OrderHub>("/hubs/orders");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    if (!db.Roles.Any())
    {
        db.Roles.AddRange(
            new Role { Name = "admin", Description = "Administrador del restaurante" },
            new Role { Name = "waiter", Description = "Mozo / Camarero" },
            new Role { Name = "kitchen", Description = "Cocina" },
            new Role { Name = "client", Description = "Cliente" }
        );
        db.SaveChanges();
    }

    if (!db.Categories.Any())
    {
        var entradas = new Category { Name = "Entradas", Description = "Para empezar con buen gusto", DisplayOrder = 1 };
        var ensaladas = new Category { Name = "Ensaladas", Description = "Frescas y gourmet", DisplayOrder = 2 };
        var pastas = new Category { Name = "Pastas", Description = "Hechas a mano", DisplayOrder = 3 };
        var carnes = new Category { Name = "Carnes", Description = "Cortes seleccionados", DisplayOrder = 4 };
        var pescados = new Category { Name = "Pescados y Mariscos", Description = "Del Río a la mesa", DisplayOrder = 5 };
        var especiales = new Category { Name = "Platos Especiales", Description = "Creación del chef", DisplayOrder = 6 };
        var postres = new Category { Name = "Postres", Description = "Dulce final", DisplayOrder = 7 };
        var bebidas = new Category { Name = "Bebidas", Description = "Para acompañar", DisplayOrder = 8 };

        db.Categories.AddRange(entradas, ensaladas, pastas, carnes, pescados, especiales, postres, bebidas);
        db.SaveChanges();

        db.Products.AddRange(
            new Product { Name = "Carpaccio de res", Description = "Finas láminas de res con parmesano, rúcula, alcaparras y dressing de limón", Price = 8500m, CategoryId = entradas.Id, IsAvailable = true },
            new Product { Name = "Bruschetta de tomate confit", Description = "Pan artesanal con tomates confit, albahaca fresca, burrata y reducción balsámica", Price = 6200m, CategoryId = entradas.Id, IsAvailable = true },
            new Product { Name = "Langostinos al ajillo", Description = "Langostinos salteados con ajo, perejil, vino blanco y un toque de ají molido", Price = 9800m, CategoryId = entradas.Id, IsAvailable = true },
            new Product { Name = "Sopa de cebolla gratinada", Description = "Sopa de cebolla caramelizada con crutones y queso gruyère gratinado", Price = 5600m, CategoryId = entradas.Id, IsAvailable = true },
            new Product { Name = "Tartar de salmón", Description = "Salmón fresco cortado a cuchillo con palta, mango, cebolla morada y salsa de soja", Price = 10500m, CategoryId = entradas.Id, IsAvailable = true },
            new Product { Name = "Provoleta", Description = "Provoleta a la parrilla con orégano, tomates secos y aceitunas negras", Price = 7200m, CategoryId = entradas.Id, IsAvailable = true },

            new Product { Name = "Ensalada César", Description = "Pollo braseado, lechuga romana, crutones, parmesano y aderezo césar casero", Price = 6800m, CategoryId = ensaladas.Id, IsAvailable = true },
            new Product { Name = "Ensalada de rúcula y peras", Description = "Rúcula fresca, peras caramelizadas, parmesano en lascas, nueces y vinagreta de miel", Price = 6200m, CategoryId = ensaladas.Id, IsAvailable = true },
            new Product { Name = "Ensalada Waldorf", Description = "Manzana verde, apio, nueces, uvas, pollo y mayonesa de mostaza", Price = 6500m, CategoryId = ensaladas.Id, IsAvailable = true },
            new Product { Name = "Ensalada de quinoa", Description = "Quinoa con vegetales asados, palta, garbanzos, pepino y dressing de limón", Price = 5900m, CategoryId = ensaladas.Id, IsAvailable = true },

            new Product { Name = "Espaguetis con salsa de champiñones", Description = "⭐ ESPECIALIDAD DE LA CASA — Espaguetis artesanales con salsa cremosa de champiñones portobello, hongos de temporada, ajo, perejil y un toque de trufa", Price = 11200m, CategoryId = pastas.Id, IsAvailable = true },
            new Product { Name = "Ravioles de ricotta y espinaca", Description = "Ravioles caseros rellenos de ricotta y espinaca con salsa de nueces y manteca de salvia", Price = 9800m, CategoryId = pastas.Id, IsAvailable = true },
            new Product { Name = "Fettuccine Alfredo", Description = "Fettuccine con salsa Alfredo de hongos porcini, parmesano y perejil fresco", Price = 10200m, CategoryId = pastas.Id, IsAvailable = true },
            new Product { Name = "Ñoquis de papa", Description = "Ñoquis de papa caseros con salsa de tomates cherry, albahaca y queso de cabra", Price = 8500m, CategoryId = pastas.Id, IsAvailable = true },
            new Product { Name = "Lasagna bolognesa", Description = "Capas de pasta artesanal con ragú bolognesa, bechamel y parmesano gratinado", Price = 9500m, CategoryId = pastas.Id, IsAvailable = true },
            new Product { Name = "Risotto de hongos", Description = "Risotto cremoso de hongos de temporada con parmesano, manteca y un toque de trufa", Price = 10800m, CategoryId = pastas.Id, IsAvailable = true },

            new Product { Name = "Bife de chorizo", Description = "Bife de chorizo 300g con chimichurri casero, papas fritas y pimientos asados", Price = 14500m, CategoryId = carnes.Id, IsAvailable = true },
            new Product { Name = "Ojo de bife", Description = "Ojo de bife 350g con puré de batatas, cebolla caramelizada y demi-glace", Price = 16800m, CategoryId = carnes.Id, IsAvailable = true },
            new Product { Name = "Lomo saltado", Description = "Tiras de lomo salteadas con cebolla, tomate, ají y papas fritas", Price = 12500m, CategoryId = carnes.Id, IsAvailable = true },
            new Product { Name = "Cordero braseado", Description = "Cordero braseado por horas con reducción de vino tinto, papas al romero y verduras de estación", Price = 15800m, CategoryId = carnes.Id, IsAvailable = true },
            new Product { Name = "Pollo relleno", Description = "Pechuga de pollo rellena de espinaca, queso brie y tomates secos, con salsa de mostaza y miel", Price = 11200m, CategoryId = carnes.Id, IsAvailable = true },
            new Product { Name = "Costillas BBQ", Description = "Costillas de cerdo glaseadas con BBQ casera, coleslaw y papas rústicas", Price = 13800m, CategoryId = carnes.Id, IsAvailable = true },

            new Product { Name = "Salmón glaseado", Description = "Salmón glaseado con miel y mostaza, acompañado de espárragos y puré de coliflor", Price = 14200m, CategoryId = pescados.Id, IsAvailable = true },
            new Product { Name = "Paella de mariscos", Description = "Paella valenciana con camarones, mejillones, calamares, y arroz bomba", Price = 15800m, CategoryId = pescados.Id, IsAvailable = true },
            new Product { Name = "Ceviche de corvina", Description = "Corvina fresca marinada en limón, cebolla morada, ají limo y camote", Price = 9800m, CategoryId = pescados.Id, IsAvailable = true },
            new Product { Name = "Merluza negra", Description = "Merluza negra con risotto de limón, alcaparras y manteca de eneldo", Price = 16500m, CategoryId = pescados.Id, IsAvailable = true },

            new Product { Name = "Wok de vegetales", Description = "Wok de vegetales salteados con tofu, jengibre, salsa de soja y semillas de sésamo", Price = 8200m, CategoryId = especiales.Id, IsAvailable = true },
            new Product { Name = "Ossobuco", Description = "Ossobuco braseado con polenta cremosa, gremolata y reducción de vino tinto", Price = 15500m, CategoryId = especiales.Id, IsAvailable = true },
            new Product { Name = "Curry tailandés", Description = "Curry de coco con pollo, vegetales, arroz jazmín y hierba limón", Price = 10800m, CategoryId = especiales.Id, IsAvailable = true },

            new Product { Name = "Tiramisú", Description = "Tiramisú clásico con mascarpone, café y cacao", Price = 5200m, CategoryId = postres.Id, IsAvailable = true },
            new Product { Name = "Cheesecake de maracuyá", Description = "Cheesecake cremoso con coulis de maracuyá y base de galletitas", Price = 5600m, CategoryId = postres.Id, IsAvailable = true },
            new Product { Name = "Volcán de chocolate", Description = "Volcán de chocolate con centro fundido y helado de vainilla", Price = 6200m, CategoryId = postres.Id, IsAvailable = true },
            new Product { Name = "Crème brûlée", Description = "Crème brûlée de vainilla con caramelo crocante y frutos rojos", Price = 5500m, CategoryId = postres.Id, IsAvailable = true },
            new Product { Name = "Panna cotta", Description = "Panna cotta de vainilla con coulis de frutos rojos y menta fresca", Price = 5200m, CategoryId = postres.Id, IsAvailable = true },
            new Product { Name = "Mousse de chocolate blanco", Description = "Mousse de chocolate blanco con coulis de frutos rojos y crocante de almendras", Price = 5800m, CategoryId = postres.Id, IsAvailable = true },
            new Product { Name = "Flan casero", Description = "Flan casero con dulce de leche y crema batida", Price = 4800m, CategoryId = postres.Id, IsAvailable = true },
            new Product { Name = "Helado artesanal", Description = "Dos bochas de helado artesanal (vainilla, chocolate, dulce de leche o frutilla)", Price = 4200m, CategoryId = postres.Id, IsAvailable = true },
            new Product { Name = "Brownie con helado", Description = "Brownie de chocolate con nueces, helado de vainilla y salsa de dulce de leche", Price = 5800m, CategoryId = postres.Id, IsAvailable = true },
            new Product { Name = "Tarta de limón", Description = "Tarta de limón con merengue italiano y base sablée", Price = 5200m, CategoryId = postres.Id, IsAvailable = true },

            new Product { Name = "Agua mineral", Description = "Agua mineral sin gas 500ml", Price = 1800m, CategoryId = bebidas.Id, IsAvailable = true },
            new Product { Name = "Gaseosa", Description = "Coca-Cola, Sprite o Fanta 350ml", Price = 2000m, CategoryId = bebidas.Id, IsAvailable = true },
            new Product { Name = "Jugo natural", Description = "Jugo de naranja o limonada natural", Price = 2800m, CategoryId = bebidas.Id, IsAvailable = true },
            new Product { Name = "Café", Description = "Café expreso o americano", Price = 2200m, CategoryId = bebidas.Id, IsAvailable = true },
            new Product { Name = "Té", Description = "Té negro, verde o de hierbas", Price = 1800m, CategoryId = bebidas.Id, IsAvailable = true }
        );
        db.SaveChanges();
    }
}

app.Run();
