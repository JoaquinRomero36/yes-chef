# Hallazgos de revisión integral — YesChef

Revisión completa: pruebas unitarias (karma), integración API por roles (admin, kitchen, waiter), flujo de pedidos (dine-in, takeaway, delivery), validaciones de negocio, seguridad y código.

---

## CRÍTICOS (1)

### H1 — Bypass de autorización en `AuthController.CreateStaff` (escalada de privilegios)
- **Endpoint:** `POST /api/auth/users`
- **Causa:** `[AllowAnonymous]` a nivel de clase anula el `[Authorize(Roles = "admin")]` del método.
- **Evidencia:** Un usuario kitchen llamó el endpoint con body válido y recibió HTTP 200, creando un usuario waiter. Con el mismo bypass podría crear un usuario admin.
- **Contraste:** `ProductsController` y `CategoriesController` (sin `[AllowAnonymous]` de clase) sí devuelven 403 correctamente.
- **Interacción:** Relacionado con el `FallbackPolicy` de la Fase 2.
- **Impacto:** Un mozo o cocinero puede crearse una cuenta admin y tomar control total del sistema.
- **Archivo:** `backend/YesChef.Api/Controllers/AuthController.cs:14` (`[AllowAnonymous]`)

---

## MEDIOS (4)

### M1 — `reports.service.ts`: variable `sort` en lugar de `summary`
- `reports.component.ts:122` declara `sort: Summary | null = null` y `loadRange()` asigna a `this.sort`. Es confuso aunque funcional.
- **Fix:** Renombrar a `summary`.
- **Archivo:** `frontend/src/app/pages/dashboard/reports/reports.component.ts:122,137`

### M2 — `KitchenComponent` no actualiza pedidos después de transición manual
- `updateStatus()` llama `orderService.updateStatus()` pero no actualiza el array local `this.orders` tras el éxito. Depende de SignalR para la actualización.
- Si SignalR falla o se reconecta lento, el botón "En preparación" se mostraría de nuevo.
- **Archivo:** `frontend/src/app/pages/dashboard/kitchen/kitchen.component.ts:150-152`

### M3 — `MenuComponent`: carrito no se resetea completamente tras pedido exitoso
- Al enviar el pedido, se limpia `cart`, `notes`, `paymentMethod`, pero `step` queda en `'menu'` y `view` en `'cart'`.
- El usuario ve "¡Pedido enviado!" con carrito vacío y tiene que volver al menú manualmente.
- **Fix:** Resetear `step = 'type'` y `view = 'menu'` al enviar.
- **Archivo:** `frontend/src/app/pages/menu/menu.component.ts:523-530`

### M4 — `DashboardLayoutComponent`: routerLink a `/dashboard/orders` usa icono incorrecto
- El sidebar muestra icono `banknote` para "Pedidos" (que es la vista de cobro) y también icono `banknote` para "Caja".
- Ambos links comparten el mismo icono, lo cual es confuso.
- **Archivo:** `frontend/src/app/layouts/dashboard-layout/dashboard-layout.component.ts:34,41`

---

## BAJOS (5)

### B1 — `CashRegisterComponent` no refresca estado automáticamente después de abrir
- `openRegister()` cierra el forms pero `loadStatus()` recarga el estado. Sin embargo, si se abre la caja desde otra pestaña, no se actualiza.
- No es crítico, pero es un inconveniente menor.

### B2 — `SignalRService.stop()` no maneja estado `Connecting`
- Si `stop()` se llama mientras la conexión está en estado `Connecting`, puede fallar silenciosamente.
- **Archivo:** `frontend/src/app/services/signalr.service.ts:37-42`

### B3 — `AdminComponent`: no hay feedback de éxito/error al crear categoría o producto
- `addCategory()` y `addProduct()` llaman el service pero no muestran mensajes de éxito/error al usuario.
- **Archivo:** `frontend/src/app/pages/dashboard/admin/admin.component.ts:193-222`

### B4 — `KitchenComponent`: transiciones no deshabilitan el botón durante la llamada
- `updateStatus()` no tiene flag `updating` para deshabilitar botones durante la transición.
- Un usuario podría hacer clic múltiples veces rápido.
- **Archivo:** `frontend/src/app/pages/dashboard/kitchen/kitchen.component.ts:150-152`

### B5 — `ReportsComponent`: `loadRange()` dispara dos observables independientes
- `getSummary()` y `getTopProducts()` se llaman en paralelo pero no coordinan errores.
- Si uno falla, el otro puede quedar en estado inconsistente.
- **Archivo:** `frontend/src/app/pages/dashboard/reports/reports.component.ts:136-139`

---

## LO QUE FUNCIONA BIEN (verificado)

### Autorización general
- Sin token → 401 en todos los endpoints protegidos ✓
- Kitchen y waiter no pueden crear productos/categorías (403) ✓
- Admin puede todo ✓
- Kitchen ve cocina + pedidos + reportes + caja ✓
- Waiter ve pedidos + reportes + caja ✓

### Validaciones de negocio (6/6 correctas)
- Delivery sin método de pago → 400 ✓
- Delivery con efectivo → 400 ✓
- Delivery con producto solo local → 400 ✓
- Items duplicados → 400 ✓
- Cantidad fuera de rango (100) → 400 ✓
- Dine-in sin mesa → 400 ✓
- Mesa ocupada → 409 ✓

### Transiciones de estado (4/4 correctas)
- pending→preparing→ready→delivered → 200 ✓
- pending→delivered (salto inválido) → 400 ✓
- delivered→cancelled → 400 (transición inválida) ✓

### Cobro por pedido (4/4 correctas)
- Cobrar pedido entregado con débito → 200 con paidAt ✓
- Doble cobro → 409 "Este pedido ya está pagado" ✓
- Cancelar pedido pagado (delivery pending) → 400 "Un pedido ya cobrado no se puede cancelar" ✓
- Cancelar pedido sin pagar (takeaway pending) → 200 ✓

### Caja y reports
- Caja abierta, desglose por método de pago correcto ✓
- Reports daily-sales: aggregates, revenue, breakdown por tipo ✓
- Reports summary: promedio, top producto ✓

### Pruebas unitarias
- Karma/Jasmine: 3/3 SUCCESS (Chrome 152, Windows) ✓

---

## RESUMEN DE PRIORIDAD

| # | Severidad | Descripción | Esfuerzo fix |
|---|-----------|-------------|-------------|
| H1 | CRÍTICO | Bypass auth CreateStaff | 10 min (quitar [AllowAnonymous] de clase) |
| M1 | MEDIO | Variable `sort` confusa | 2 min rename |
| M2 | MEDIO | Kitchen no actualiza localmente | 15 min |
| M3 | MEDIO | Menu no resetea tras enviar | 5 min |
| M4 | MEDIO | Icono duplicado sidebar | 2 min |
| B1-B5 | BAJO | UX, robustez menores | 5-15 min c/u |

**Total:** 1 crítico, 4 medios, 5 bajos.

---

## RESULTADO — Todos corregidos (10 commits)

| # | Fix | Commit |
|---|-----|--------|
| H1 | Eliminar `[AllowAnonymous]` de clase; solo en endpoints públicos | `61a6b2a` |
| M1 | Renombrar `sort` → `summary` | `c43ab43` |
| M2 | Actualizar pedidos localmente en cocina | `07ac947` |
| M3 | Resetear flujo del menú tras enviar | `bbcdef1` |
| M4 | Diferenciar iconos pedidos/caja | `f45abfe` |
| B1 | Polling de estado de caja (30s) | `8fb8753` |
| B2 | Manejar estados en SignalR.stop | `811bd08` |
| B3 | Feedback éxito/error en panel admin | `e0429b7` |
| B4 | Bloquear doble clic en cocina | `b9ade15` |
| B5 | Manejar errores de rango en reports | `c7ddcd2` |

### Verificación post-fix
- H1: kitchen crea usuario → **403** (antes 200); anónimo → **401**; admin crea usuario → **200** ✓
- Login/roles/setup-status/categorías anónimos legítimos → **200** ✓
- `dotnet build` → 0 errores; `ng build` → sin errores (strict); karma → 3/3 SUCCESS ✓

**Nota aparte (no corregida, por diseño):** el registro público (`POST /api/auth/register`) está deshabilitado a nivel de negocio — responde 400 "El registro está deshabilitado. Solo el administrador puede crear usuarios." Solo admin crea usuarios vía panel.
