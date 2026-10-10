using System.Text.Json;

namespace DailyPath.Api.Services.Planning;

public record ValidatedTask(
    int Order,
    string Title,
    string Description,
    string Reason,
    int EstimatedMinutes,
    LinkTarget Link
);

public record PlanValidationResult(List<ValidatedTask> Tasks, List<string> Warnings);

public class PlanValidationException(string message) : Exception(message);

/// <summary>
/// Validates and sanitizes a model-generated plan. Invalid tasks are dropped rather than
/// failing the whole plan; the plan fails only if nothing usable remains.
/// </summary>
public static class PlanValidator
{
    private const int MaxTasks = 7;
    private const int MinTaskMinutes = 5;
    private const int MaxTaskMinutes = 180;
    private const int TitleMaxLength = 200;
    private const int DescriptionMaxLength = 1000;
    private const int ReasonMaxLength = 500;

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static PlanValidationResult Validate(
        string json,
        IReadOnlyDictionary<string, LinkTarget> idMap,
        int availableMinutes
    )
    {
        AiPlan? plan;
        try
        {
            plan = JsonSerializer.Deserialize<AiPlan>(json, JsonOptions);
        }
        catch (JsonException ex)
        {
            throw new PlanValidationException($"Model returned invalid JSON: {ex.Message}");
        }

        if (plan?.Tasks is not { Count: > 0 })
            throw new PlanValidationException("Model returned no tasks.");

        var warnings = new List<string>();
        var valid = new List<ValidatedTask>();

        foreach (var task in plan.Tasks.OrderBy(t => t.Order))
        {
            if (
                string.IsNullOrWhiteSpace(task.Title)
                || string.IsNullOrWhiteSpace(task.Description)
                || string.IsNullOrWhiteSpace(task.Reason)
            )
            {
                warnings.Add($"Dropped task {task.Order}: missing text.");
                continue;
            }

            if (
                task.LinkedId is null
                || !idMap.TryGetValue(task.LinkedId, out var link)
                || link.Type != task.LinkedType
            )
            {
                warnings.Add(
                    $"Dropped task {task.Order}: unknown link '{Truncate(task.LinkedId ?? "", 20)}'."
                );
                continue;
            }

            var minutes = Math.Clamp(task.EstimatedMinutes, MinTaskMinutes, MaxTaskMinutes);
            if (minutes != task.EstimatedMinutes)
                warnings.Add(
                    $"Task {task.Order}: estimate {task.EstimatedMinutes} clamped to {minutes}."
                );

            valid.Add(
                new ValidatedTask(
                    Order: 0,
                    Truncate(task.Title, TitleMaxLength),
                    Truncate(task.Description, DescriptionMaxLength),
                    Truncate(task.Reason, ReasonMaxLength),
                    minutes,
                    link
                )
            );
        }

        // Drop from the end (lowest priority) until within the task cap and time budget.
        while (valid.Count > MaxTasks)
        {
            valid.RemoveAt(valid.Count - 1);
            warnings.Add("Dropped a task: over the task limit.");
        }

        while (valid.Count > 1 && valid.Sum(t => t.EstimatedMinutes) > availableMinutes)
        {
            valid.RemoveAt(valid.Count - 1);
            warnings.Add("Dropped a task: over the available time.");
        }

        if (valid.Count == 0)
            throw new PlanValidationException("No valid tasks after validation.");

        var renumbered = valid.Select((t, i) => t with { Order = i + 1 }).ToList();
        return new PlanValidationResult(renumbered, warnings);
    }

    private static string Truncate(string value, int maxLength)
    {
        var trimmed = value.Trim();
        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
    }
}
