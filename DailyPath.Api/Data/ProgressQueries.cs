using Microsoft.EntityFrameworkCore;

namespace DailyPath.Api.Data;

public static class ProgressQueries
{
    /// <summary>
    /// Seconds of completed work per future task for a user.
    /// Uses the AI estimate when the timer was not used.
    /// </summary>
    public static Task<Dictionary<Guid, int>> GetSecondsSpentByFutureTaskAsync(
        this AppDbContext db,
        Guid userId,
        CancellationToken ct = default
    ) =>
        db
            .DailyTasks.Where(t =>
                t.DailyPlan.UserId == userId && t.IsCompleted && t.FutureTaskId != null
            )
            .GroupBy(t => t.FutureTaskId!.Value)
            .Select(g => new
            {
                Id = g.Key,
                Seconds = g.Sum(t => t.TimeSpentSeconds ?? t.EstimatedMinutes * 60),
            })
            .ToDictionaryAsync(x => x.Id, x => x.Seconds, ct);
}
