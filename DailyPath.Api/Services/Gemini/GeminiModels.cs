using System.Text.Json;

namespace DailyPath.Api.Services.Gemini;

// Request and response shapes for the Gemini generateContent endpoint.
// Property names are serialized as camelCase to match the REST API.

public record GeminiRequest(
    GeminiContent SystemInstruction,
    List<GeminiContent> Contents,
    GeminiGenerationConfig GenerationConfig
);

public record GeminiContent(List<GeminiPart> Parts, string? Role = null);

public record GeminiPart(string? Text);

public record GeminiGenerationConfig(
    double Temperature,
    GeminiThinkingConfig ThinkingConfig,
    string ResponseMimeType,
    JsonElement ResponseJsonSchema
);

public record GeminiThinkingConfig(string ThinkingLevel);

// Response fields are nullable: external API data is validated before use.
public record GeminiResponse(List<GeminiCandidate>? Candidates, GeminiUsage? UsageMetadata);

public record GeminiCandidate(GeminiContent? Content, string? FinishReason);

public record GeminiUsage(
    int PromptTokenCount,
    int CandidatesTokenCount,
    int ThoughtsTokenCount,
    int TotalTokenCount
);
