using DailyPath.Api.Models;

namespace DailyPath.Api.Services;

public record PrioritizedTask(
    FutureTask Task,
    decimal HoursLeft,
    int DaysLeft,
    decimal Pressure,
    int Rank
);

/// <summary>
/// Ranks pending future tasks by the daily workload needed to finish on time.
/// Pure logic with no database access, so it can be unit tested in isolation.
/// </summary>
public static class TaskPrioritizer
{
    // Keeps unfinished work scheduled even when time spent reaches the estimate.
    private const decimal MinHoursLeft = 0.5m;

    // Placeholder until AI-based estimation is implemented.
    private const decimal DefaultEstimateHours = 5m;

    public static List<PrioritizedTask> Rank(
        IEnumerable<FutureTask> tasks,
        IReadOnlyDictionary<Guid, int> secondsSpentByTaskId,
        DateOnly today
    )
    {
        return tasks
            .Where(t => t.Status == FutureTaskStatus.Pending)
            .Select(t =>
            {
                var estimate = t.EstimatedHours ?? DefaultEstimateHours;
                var spentHours = secondsSpentByTaskId.GetValueOrDefault(t.Id) / 3600m;
                var hoursLeft = Math.Max(MinHoursLeft, estimate - spentHours);

                // Excludes the due date itself so work finishes with a day of buffer.
                var daysLeft = Math.Max(1, t.DueDate.DayNumber - today.DayNumber);

                return (
                    Item: t,
                    HoursLeft: hoursLeft,
                    DaysLeft: daysLeft,
                    Pressure: Math.Round(hoursLeft / daysLeft, 2)
                );
            })
            .OrderByDescending(x => x.Pressure)
            .ThenBy(x => x.Item.DueDate)
            .ThenByDescending(x => x.Item.Weight ?? 0)
            .Select(
                (x, index) =>
                    new PrioritizedTask(
                        x.Item,
                        Math.Round(x.HoursLeft, 2),
                        x.DaysLeft,
                        x.Pressure,
                        index + 1
                    )
            )
            .ToList();
    }

    /// <summary>True when the combined daily workload exceeds the user's available time.</summary>
    public static bool IsOverloaded(IEnumerable<PrioritizedTask> ranked, decimal hoursAvailable) =>
        ranked.Sum(r => r.Pressure) > hoursAvailable;
}
