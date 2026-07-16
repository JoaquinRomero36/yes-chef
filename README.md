# YesChef 🍽️

Sistema de gestión integral para restaurantes.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 18 (standalone) + TailwindCSS + PWA |
| Backend | ASP.NET Core 10 Web API + EF Core |
| Base de datos | PostgreSQL 16 |
| Tiempo real | SignalR |
| Autenticación | JWT + BCrypt |
| Contenedores | Docker + Docker Compose |

## Desarrollo

```bash
# Iniciar base de datos
docker compose up -d

# Backend
cd backend
dotnet run --project YesChef.Api

# Frontend
cd frontend
npm start
```

## Producción

```bash
docker compose -f docker-compose.prod.yml up -d
```
