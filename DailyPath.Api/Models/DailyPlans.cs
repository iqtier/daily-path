namespace DailyPath.Api.Models;

/// <summary>
/// One user's generated to-do list for a single calendar day.
/// At most one plan exists per user per date.
/// </summary>
public class DailyPlan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public DateOnly Date { get; set; }
    public decimal HoursAvailable { get; set; }

    /// <summary>Number of bonus generations used today. Capped to limit AI cost.</summary>
    public int BonusRequestCount { get; set; }

    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    public List<DailyTask> Tasks { get; set; } = [];
}
