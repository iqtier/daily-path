using System.Text.Json;

namespace DailyPath.Api.Services.Gemini;

public interface IGeminiClient
{
    /// <summary>
    /// Sends a prompt and returns the model's JSON text. Retries transient failures
    /// and falls back to the secondary model when the primary is unavailable.
    /// </summary>
    Task<GeminiResult> GenerateJsonAsync(
        string systemPrompt,
        string userInput,
        JsonElement responseSchema,
        CancellationToken cancellationToken = default
    );
}

public record GeminiResult(string Text, string Model, GeminiUsage? Usage);

/// <summary>Non-recoverable Gemini failure, such as a bad request or blocked output.</summary>
public class GeminiException(string message, Exception? inner = null) : Exception(message, inner);

/// <summary>Temporary failure (timeout, rate limit, 5xx) that may succeed on retry.</summary>
public class GeminiUnavailableException(string message, Exception? inner = null)
    : GeminiException(message, inner);
