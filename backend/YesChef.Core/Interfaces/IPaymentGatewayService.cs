namespace YesChef.Core.Interfaces;

/// <summary>Piezas mínimas que un configurador de pago online debe resolver.</summary>
public interface IPaymentGatewayService
{
    /// <summary>Genera una preferencia de pago para el pedido y devuelve la URL de checkout.</summary>
    Task<PaymentPreferenceResult> CreatePreferenceAsync(Guid orderId, decimal amount);

    /// <summary>Marca el pago como aprobado (flujo de confirmación de la pasarela).</summary>
    Task ApproveAsync(Guid orderId, string externalId);
}

public record PaymentPreferenceResult(string PaymentUrl, string ExternalId);
