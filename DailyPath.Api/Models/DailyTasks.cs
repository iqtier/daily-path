namespace DailyPath.Api.Models;

/// <summary>
/// A single AI-generated step within a daily plan.
/// Linked to exactly one goal or one future task, never both.
/// </summary>
public class DailyTask
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid DailyPlanId { get; set; }
    public DailyPlan DailyPlan { get; set; } = null!;

    /// <summary>Position in the day's sequence. Only the first incomplete task is unlocked.</summary>
    public int Order { get; set; }

    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Reason { get; set; } = "";

    /// <summary>AI estimate. Withheld from the client until the task is completed.</summary>
    public int EstimatedMinutes { get; set; }

    public DateTime? StartedAt { get; set; }
    public int? TimeSpentSeconds { get; set; }

    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool IsBonus { get; set; }

    public Guid? GoalId { get; set; }
    public Goal? Goal { get; set; }

    public Guid? FutureTaskId { get; set; }
    public FutureTask? FutureTask { get; set; }
}
