using System.ComponentModel.DataAnnotations;

namespace DailyPath.Api.Configuration;

/// <summary>Gemini API settings, bound from the "Gemini" configuration section.</summary>
public class GeminiOptions
{
    public const string SectionName = "Gemini";

    [Required]
    public string ApiKey { get; set; } = "";

    [Required]
    public string PrimaryModel { get; set; } = "";

    public string PrimaryThinkingLevel { get; set; } = "low";

    [Required]
    public string FallbackModel { get; set; } = "";

    public string FallbackThinkingLevel { get; set; } = "high";

    [Range(5, 300)]
    public int TimeoutSeconds { get; set; } = 45;

    [Range(0, 5)]
    public int MaxRetries { get; set; } = 2;
}
