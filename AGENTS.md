# AGENTS.md

YesChef: restaurant management system (menu ordering, kitchen dashboard, cash register). Full-stack monorepo.

## Layout
- `frontend/` — Angular 18 standalone SPA + Tailwind + PWA (`@angular/service-worker`)
- `backend/` — ASP.NET Core 10 solution; 3 projects: `YesChef.Api` (controllers/hubs), `YesChef.Infrastructure` (EF Core, `AppDbContext`, repos, `AuthService`), `YesChef.Core` (entities/DTOs/interfaces). Solution file is `YesChef.slnx` (XML format), not `.sln`
- `database/init.sql` — prod-only schema + seed (mounted in `docker-compose.prod.yml`)
- `docker-compose.yml` (dev DB), `docker-compose.prod.yml` (full prod stack)
- `menu-items.txt`, `menu-snapshot.txt`, `.playwright-mcp/` — Playwright/MCP browser artifacts. Not source; ignore.

## Dev commands
Order matters — DB first, then API, then frontend:
```
docker compose up -d                    # postgres + pgAdmin
cd backend && dotnet run --project YesChef.Api   # http://localhost:5230
cd frontend && npm start                # http://localhost:4200
```
- Postgres is exposed on host port **5433** (not 5432); `appsettings.json` points there. Prod uses internal port 5432.
- pgAdmin: http://localhost:5050 (`admin@yeschef.com` / `admin_2024`).
- Backend needs .NET 10 SDK. API listens on 5230 in dev (`launchSettings.json`) but on **8080** inside the prod container.
- The dev proxy forwards `/api/` and `/hubs/` (SignalR). The prod nginx (`frontend/nginx.conf`) also proxies `/hubs/` with websocket upgrade headers. Restart `ng serve` after editing the proxy config.

## DB / schema gotchas
- **No EF migrations.** `Program.cs` calls `Db.Database.EnsureCreated()` on startup and seeds roles, categories, and the full menu (44 products) inline.
- `database/init.sql` duplicates that same seed for prod. Keep both in sync when changing menu/seed data.
- `EnsureCreated` never alters an existing DB. After changing an entity, recreate it: `docker compose down -v` and remove the dev DB.
- Seed/menu changes in `Program.cs` only apply to fresh DBs (guarded by `if (!db.Roles.Any())` and `if (!db.Categories.Any())`).

## Verification
- No backend test project. Build check: `dotnet build YesChef.slnx` in `backend/`.
- Frontend: `npm test` runs Karma/Jasmine (only `app.component.spec.ts` exists; needs Chrome). No lint or typecheck script configured — use `ng build` (`tsconfig` is strict) as the main check.
- Frontend prod build: `npm run build` (service worker + budget checks are production-only config).

## Conventions & quirks
- **All UI copy, API error messages, seed data, and git commits are in Spanish.** Follow suit.
- **Money is `decimal`**; prices in the seed are whole COL-peso amounts (e.g. `8500m`). Use `decimal`, never float.
- Auth: JWT from `Jwt:Key/Issuer/Audience`. Dev values (incl. DB connection string) live in `backend/YesChef.Api/appsettings.Development.json`; prod overrides them via env (`DB_PASSWORD`, `JWT_KEY` — no defaults in `docker-compose.prod.yml`). Frontend stores the token in `localStorage` key `yeschef_token` and attaches it via `auth.interceptor`. Note: no endpoint currently has `[Authorize]`; JWT auth is wired but not enforced server-side. Public registration always assigns the `client` role.
- SignalR: hub at `/hubs/orders`; clients join group via `JoinKitchen`/`LeaveKitchen`; server emits `NewOrder`/`OrderUpdated` to group `"kitchen"`.
- Controllers mix patterns: some inject `IRepository<>`/`IAuthService`, others (orders, products, cash-register) use `AppDbContext` directly. Match the file you're editing.
- Entities inherit `BaseEntity` (`Id`, `CreatedAt`, `UpdatedAt`) and use `Guid` PKs via `Guid.NewGuid()`.
- Frontend is lazy-loaded/standalone, no NgModules.

## Prod
`docker compose -f docker-compose.prod.yml up -d --build`. Secrets pass through env: `DB_PASSWORD`, `JWT_KEY` (see `.env.example`). Frontend (nginx) serves SPA and proxies `/api/` → `backend:8080`.