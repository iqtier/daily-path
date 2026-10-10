using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using DailyPath.Api.Configuration;
using Microsoft.Extensions.Options;

namespace DailyPath.Api.Services.Gemini;

public class GeminiClient(
    HttpClient http,
    IOptions<GeminiOptions> options,
    ILogger<GeminiClient> logger
) : IGeminiClient
{
    private const double Temperature = 0.3;

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly GeminiOptions _options = options.Value;

    public async Task<GeminiResult> GenerateJsonAsync(
        string systemPrompt,
        string userInput,
        JsonElement responseSchema,
        CancellationToken cancellationToken = default
    )
    {
        var request = BuildRequest(
            systemPrompt,
            userInput,
            responseSchema,
            _options.PrimaryThinkingLevel
        );

        try
        {
            return await SendWithRetryAsync(_options.PrimaryModel, request, cancellationToken);
        }
        catch (GeminiUnavailableException ex)
        {
            logger.LogWarning(
                ex,
                "Primary model {Model} unavailable, falling back to {FallbackModel}",
                _options.PrimaryModel,
                _options.FallbackModel
            );

            var fallbackRequest = request with
            {
                GenerationConfig = request.GenerationConfig with
                {
                    ThinkingConfig = new GeminiThinkingConfig(_options.FallbackThinkingLevel),
                },
            };

            return await SendWithRetryAsync(
                _options.FallbackModel,
                fallbackRequest,
                cancellationToken
            );
        }
    }

    private async Task<GeminiResult> SendWithRetryAsync(
        string model,
        GeminiRequest request,
        CancellationToken ct
    )
    {
        for (var attempt = 0; ; attempt++)
        {
            try
            {
                return await SendAsync(model, request, ct);
            }
            catch (GeminiUnavailableException ex) when (attempt < _options.MaxRetries)
            {
                // Exponential backoff: 2s, 4s, 8s.
                var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt + 1));
                logger.LogInformation(
                    "{Model} attempt {Attempt} failed ({Reason}), retrying in {DelaySeconds}s",
                    model,
                    attempt + 1,
                    ex.Message,
                    delay.TotalSeconds
                );

                await Task.Delay(delay, ct);
            }
        }
    }

    private async Task<GeminiResult> SendAsync(
        string model,
        GeminiRequest request,
        CancellationToken ct
    )
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(TimeSpan.FromSeconds(_options.TimeoutSeconds));

        using var message = new HttpRequestMessage(
            HttpMethod.Post,
            $"v1beta/models/{model}:generateContent"
        )
        {
            Content = JsonContent.Create(request, options: JsonOptions),
        };
        message.Headers.Add("x-goog-api-key", _options.ApiKey);

        try
        {
            using var response = await http.SendAsync(message, timeout.Token);

            if (IsTransient(response.StatusCode))
                throw new GeminiUnavailableException(
                    $"{model} returned {(int)response.StatusCode}"
                );

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync(timeout.Token);
                throw new GeminiException($"{model} returned {(int)response.StatusCode}: {error}");
            }

            var body = await response.Content.ReadFromJsonAsync<GeminiResponse>(
                JsonOptions,
                timeout.Token
            );
            return ExtractResult(model, body);
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            throw new GeminiUnavailableException(
                $"{model} timed out after {_options.TimeoutSeconds}s"
            );
        }
        catch (HttpRequestException ex)
        {
            throw new GeminiUnavailableException($"{model} request failed", ex);
        }
    }

    private static GeminiResult ExtractResult(string model, GeminiResponse? body)
    {
        var candidate =
            body?.Candidates?.FirstOrDefault()
            ?? throw new GeminiException($"{model} returned no candidates");

        // Any reason other than STOP (e.g. MAX_TOKENS, SAFETY) means the JSON may be incomplete.
        if (candidate.FinishReason != "STOP")
            throw new GeminiException($"{model} stopped early: {candidate.FinishReason}");

        var text =
            candidate.Content?.Parts.FirstOrDefault(p => !string.IsNullOrWhiteSpace(p.Text))?.Text
            ?? throw new GeminiException($"{model} returned no text");

        return new GeminiResult(text, model, body!.UsageMetadata);
    }

    private static GeminiRequest BuildRequest(
        string systemPrompt,
        string userInput,
        JsonElement schema,
        string thinkingLevel
    ) =>
        new(
            SystemInstruction: new GeminiContent([new GeminiPart(systemPrompt)]),
            Contents: [new GeminiContent([new GeminiPart(userInput)], Role: "user")],
            GenerationConfig: new GeminiGenerationConfig(
                Temperature,
                new GeminiThinkingConfig(thinkingLevel),
                "application/json",
                schema
            )
        );

    private static bool IsTransient(HttpStatusCode status) =>
        status
            is HttpStatusCode.TooManyRequests
                or HttpStatusCode.InternalServerError
                or HttpStatusCode.BadGateway
                or HttpStatusCode.ServiceUnavailable
                or HttpStatusCode.GatewayTimeout;
}
