using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace YesChef.Api;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is UnauthorizedAccessException)
        {
            httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await WriteProblemAsync(httpContext, "No autorizado");
            return true;
        }

        if (exception is InvalidOperationException)
        {
            httpContext.Response.StatusCode = StatusCodes.Status409Conflict;
            await WriteProblemAsync(httpContext, exception.Message);
            return true;
        }

        var message = exception switch
        {
            BadHttpRequestException => "Solicitud inválida",
            _ => "Ocurrió un error inesperado. Intente nuevamente."
        };

        var statusCode = exception switch
        {
            BadHttpRequestException => StatusCodes.Status400BadRequest,
            _ => StatusCodes.Status500InternalServerError
        };

        _logger.LogError(exception, "Error no controlado: {Message}", exception.Message);
        httpContext.Response.StatusCode = statusCode;
        await WriteProblemAsync(httpContext, message);
        return true;
    }

    private static async Task WriteProblemAsync(HttpContext httpContext, string message)
    {
        var problem = new ProblemDetails
        {
            Status = httpContext.Response.StatusCode,
            Detail = message,
            Instance = $"/{httpContext.Request.Method} {httpContext.Request.Path}"
        };
        await httpContext.Response.WriteAsJsonAsync(problem, httpContext.RequestAborted);
    }
}