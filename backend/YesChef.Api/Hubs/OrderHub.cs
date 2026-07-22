using Microsoft.AspNetCore.SignalR;

namespace YesChef.Api.Hubs;

public class OrderHub : Hub
{
    public async Task JoinKitchen() =>
        await Groups.AddToGroupAsync(Context.ConnectionId, "kitchen");

    public async Task LeaveKitchen() =>
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "kitchen");
}
