namespace DailyPath.Api.Models;

/// <summary>
/// A dated piece of work the user must finish, such as an assignment or exam.
/// Kept separate from goals; daily tasks link to one or the other.
/// </summary>
public class FutureTask
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Title { get; set; } = "";
    public FutureTaskType Type { get; set; } = FutureTaskType.Other;
    public DateOnly DueDate { get; set; }

    /// <summary>Percent of final grade (0 to 100). Null when not graded.</summary>
    public decimal? Weight { get; set; }

    public TaskSize? Size { get; set; }

    /// <summary>
    /// Total effort in hours. Set from user input, mapped from Size, or estimated by the AI.
    /// Used by the prioritization logic to calculate pressure.
    /// </summary>
    public decimal? EstimatedHours { get; set; }

    public EstimateSource? EstimateSource { get; set; }
    public string? Materials { get; set; }
    public FutureTaskStatus Status { get; set; } = FutureTaskStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}

public enum FutureTaskType { Assignment, Exam, Project, Other }
public enum FutureTaskStatus { Pending, Done }
public enum TaskSize { Small, Medium, Large, Huge }
public enum EstimateSource { User, Size, Ai }