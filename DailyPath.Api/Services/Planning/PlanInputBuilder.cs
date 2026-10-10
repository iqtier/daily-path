using DailyPath.Api.Models;

namespace DailyPath.Api.Services.Planning;

public static class LinkTypes
{
    public const string Goal = "goal";
    public const string FutureTask = "futureTask";
}

public record LinkTarget(string Type, Guid Id);

public record PlanInput(
    string Today,
    decimal HoursAvailableToday,
    List<GoalInput> Goals,
    List<FutureTaskInput> FutureTasks,
    List<YesterdayInput> Yesterday
);

public record GoalInput(string Id, string Title, string Category, string? Details);

public record FutureTaskInput(
    string Id,
    int PriorityRank,
    string Title,
    string Type,
    string DueDate,
    int DaysLeft,
    decimal? Weight,
    decimal HoursLeft,
    decimal Pressure,
    string? Materials
);

public record YesterdayInput(
    string Title,
    string LinkedId,
    bool Completed,
    int EstimatedMinutes,
    int? ActualMinutes
);

/// <summary>Model input plus the map from the short ids sent to the model back to database ids.</summary>
public record BuiltPlanInput(PlanInput Input, IReadOnlyDictionary<string, LinkTarget> IdMap);

/// <summary>
/// Builds the model input from domain data. Database ids are replaced with short aliases
/// (g1, ft1) so they are never sent to the model and any unknown id in the reply can be rejected.
/// </summary>
public static class PlanInputBuilder
{
    public static BuiltPlanInput Build(
        DateOnly today,
        decimal hoursAvailable,
        IReadOnlyList<Goal> activeGoals,
        IReadOnlyList<PrioritizedTask> rankedTasks,
        IReadOnlyList<DailyTask> yesterdayTasks
    )
    {
        var idMap = new Dictionary<string, LinkTarget>();
        var aliasByDbId = new Dictionary<Guid, string>();

        string Register(string alias, string type, Guid id)
        {
            idMap[alias] = new LinkTarget(type, id);
            aliasByDbId[id] = alias;
            return alias;
        }

        var goals = activeGoals
            .Select(
                (g, i) =>
                    new GoalInput(
                        Register($"g{i + 1}", LinkTypes.Goal, g.Id),
                        g.Title,
                        g.Category.ToString().ToLowerInvariant(),
                        g.Details
                    )
            )
            .ToList();

        var futureTasks = rankedTasks
            .Select(
                (r, i) =>
                    new FutureTaskInput(
                        Register($"ft{i + 1}", LinkTypes.FutureTask, r.Task.Id),
                        r.Rank,
                        r.Task.Title,
                        r.Task.Type.ToString().ToLowerInvariant(),
                        r.Task.DueDate.ToString("yyyy-MM-dd"),
                        r.DaysLeft,
                        r.Task.Weight,
                        r.HoursLeft,
                        r.Pressure,
                        r.Task.Materials
                    )
            )
            .ToList();

        // Skip yesterday's tasks whose goal or future task is no longer active.
        var yesterday = yesterdayTasks
            .Select(t =>
                (
                    Task: t,
                    Alias: aliasByDbId.GetValueOrDefault(t.GoalId ?? t.FutureTaskId ?? Guid.Empty)
                )
            )
            .Where(x => x.Alias is not null)
            .Select(x => new YesterdayInput(
                x.Task.Title,
                x.Alias!,
                x.Task.IsCompleted,
                x.Task.EstimatedMinutes,
                x.Task.TimeSpentSeconds is int seconds ? (int)Math.Round(seconds / 60.0) : null
            ))
            .ToList();

        var input = new PlanInput(
            today.ToString("yyyy-MM-dd"),
            hoursAvailable,
            goals,
            futureTasks,
            yesterday
        );
        return new BuiltPlanInput(input, idMap);
    }
}
