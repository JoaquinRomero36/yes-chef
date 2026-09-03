namespace YesChef.Core;

/// <summary>
/// Fuente única de verdad de los métodos de pago del sistema.
/// </summary>
public static class PaymentMethods
{
    public static readonly string[] Valid =
    {
        "cash", "debit", "credit", "mercado_pago", "voucher"
    };

    private static readonly Dictionary<string, string> Labels = new()
    {
        ["cash"] = "Efectivo",
        ["debit"] = "Débito",
        ["credit"] = "Crédito",
        ["mercado_pago"] = "Mercado Pago",
        ["voucher"] = "Vale / Cuenta"
    };

    /// <summary>Normaliza el método a minúsculas o devuelve null si es vacío.</summary>
    public static string? Normalize(string? method)
    {
        if (string.IsNullOrWhiteSpace(method))
            return null;
        return method.Trim().ToLowerInvariant();
    }

    public static bool IsValid(string? method) => Normalize(method) is not null && Valid.Contains(Normalize(method));

    public static string GetLabel(string method)
    {
        var key = Normalize(method) ?? method;
        return Labels.TryGetValue(key, out var label) ? label : key;
    }

    public static IDictionary<string, string> AllLabels => Labels;
}