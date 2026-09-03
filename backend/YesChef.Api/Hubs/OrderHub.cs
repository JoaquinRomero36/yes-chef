using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace YesChef.Api.Hubs;

[Authorize]
public class OrderHub : Hub
{
    private static readonly string[] StaffRoles = { "admin", "waiter", "kitchen" };

    public async Task JoinKitchen()
    {
        var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (role is null || !StaffRoles.Contains(role))
            throw new HubException("No tenés permisos para acceder a la cocina");

        await Groups.AddToGroupAsync(Context.ConnectionId, "kitchen");
    }

    public async Task LeaveKitchen() =>
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "kitchen");
}
