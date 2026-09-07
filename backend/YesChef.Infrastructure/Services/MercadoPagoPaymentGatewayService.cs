using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using YesChef.Core.Interfaces;

namespace YesChef.Infrastructure.Services;

public class MercadoPagoPaymentGatewayService : IPaymentGatewayService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<MercadoPagoPaymentGatewayService> _logger;

    public MercadoPagoPaymentGatewayService(
        IHttpClientFactory httpClientFactory,
        IConfiguration config,
        ILogger<MercadoPagoPaymentGatewayService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        _logger = logger;
    }

    private string? AccessToken => _config["Payment:MercadoPago:AccessToken"];

    public async Task<PaymentPreferenceResult> CreatePreferenceAsync(Guid orderId, decimal amount)
    {
        var token = AccessToken;

        // Sin token configurado: modo simulado. Se aprueba internamente sin pasarela real.
        if (string.IsNullOrWhiteSpace(token))
            return new PaymentPreferenceResult(
                PaymentUrl: "simulado",
                ExternalId: $"SIM-{orderId:N}");

        var client = _httpClientFactory.CreateClient("MercadoPago");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new
        {
            items = new[]
            {
                new
                {
                    id = orderId.ToString(),
                    title = "Pedido YesChef",
                    quantity = 1,
                    unit_price = decimal.Round(amount, 2),
                    currency_id = "ARS"
                }
            },
            external_reference = orderId.ToString(),
            back_urls = new
            {
                success = "http://localhost:4200/pago/confirmacion?estado=success",
                pending = "http://localhost:4200/pago/confirmacion?estado=pending",
                failure = "http://localhost:4200/pago/confirmacion?estado=failure"
            },
            auto_return = "approved"
        };

        var httpContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/checkout/preferences", httpContent);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("MercadoPago falló al crear la preferencia: {Status} {Body}", response.StatusCode, body);
            throw new InvalidOperationException("No se pudo generar la preferencia de pago en Mercado Pago");
        }

        using var json = JsonDocument.Parse(body);
        var root = json.RootElement;
        var initPoint = root.TryGetProperty("init_point", out var ip) ? ip.GetString() : null;
        var id = root.TryGetProperty("id", out var pid) ? pid.GetString() : null;

        return new PaymentPreferenceResult(initPoint ?? "simulado", id ?? $"MP-{orderId:N}");
    }

    public Task ApproveAsync(Guid orderId, string externalId)
    {
        // La aprobación la resuelve el controlador de pagos ya que requiere DB + SignalR.
        return Task.CompletedTask;
    }
}
