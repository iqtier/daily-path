using System.Text.Json;
using DailyPath.Api.Data;
using DailyPath.Api.Models;
using DailyPath.Api.Services.Gemini;
using Microsoft.EntityFrameworkCore;

namespace DailyPath.Api.Services.Planning;

public class NothingToPlanException()
    : Exception("Add a goal or a future task before generating a plan.");

public enum CompleteOutcome
{
    Completed,
    NotFound,
    NotCurrentTask,
}

public class DailyPlanService(
    AppDbContext db,
    IGeminiClient gemini,
    ILogger<DailyPlanService> logger
)
{
    // Placeholders until user accounts and settings exist.
    public static readonly Guid TempUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    public const decimal DefaultHoursPerDay = 3m;
    private static readonly TimeZoneInfo TempUserTimeZone = TimeZoneInfo.FindSystemTimeZoneById(
        "America/Toronto"
    );

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    /// <summary>Today's date in the user's time zone, not the server's.</summary>
    public static DateOnly GetUserToday() =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TempUserTimeZone));

    public Task<DailyPlan?> GetTodayAsync(CancellationToken ct = default)
    {
        var today = GetUserToday();
        return db
            .DailyPlans.Include(p => p.Tasks)
                .ThenInclude(t => t.Goal)
            .Include(p => p.Tasks)
                .ThenInclude(t => t.FutureTask)
            .FirstOrDefaultAsync(p => p.UserId == TempUserId && p.Date == today, ct);
    }

    /// <summary>
    /// Generates today's plan, or returns the existing one. Safe to call more than once.
    /// </summary>
    public async Task<DailyPlan> GenerateTodayAsync(
        decimal hoursAvailable,
        CancellationToken ct = default
    )
    {
        var existing = await GetTodayAsync(ct);
        if (existing is not null)
            return existing;

        var today = GetUserToday();
        var yesterday = today.AddDays(-1);

        var goals = await db
            .Goals.Where(g => g.UserId == TempUserId && g.Status == GoalStatus.Active)
            .OrderBy(g => g.CreatedAt)
            .ToListAsync(ct);

        var futureTasks = await db
            .FutureTasks.Where(t => t.UserId == TempUserId && t.Status == FutureTaskStatus.Pending)
            .ToListAsync(ct);

        if (goals.Count == 0 && futureTasks.Count == 0)
            throw new NothingToPlanException();

        // Completed work per future task. Falls back to the estimate when the timer was not used.
        var secondsSpent = await db
            .DailyTasks.Where(t =>
                t.DailyPlan.UserId == TempUserId && t.IsCompleted && t.FutureTaskId != null
            )
            .GroupBy(t => t.FutureTaskId!.Value)
            .Select(g => new
            {
                Id = g.Key,
                Seconds = g.Sum(t => t.TimeSpentSeconds ?? t.EstimatedMinutes * 60),
            })
            .ToDictionaryAsync(x => x.Id, x => x.Seconds, ct);

        var yesterdayTasks = await db
            .DailyTasks.Where(t =>
                t.DailyPlan.UserId == TempUserId && t.DailyPlan.Date == yesterday
            )
            .OrderBy(t => t.Order)
            .ToListAsync(ct);

        var ranked = TaskPrioritizer.Rank(futureTasks, secondsSpent, today);
        var built = PlanInputBuilder.Build(today, hoursAvailable, goals, ranked, yesterdayTasks);
        var inputJson = JsonSerializer.Serialize(built.Input, JsonOptions);

        var aiResult = await gemini.GenerateJsonAsync(
            PlannerPrompt.SystemPrompt,
            inputJson,
            PlannerPrompt.ResponseSchema,
            ct
        );

        var validation = PlanValidator.Validate(
            aiResult.Text,
            built.IdMap,
            (int)(hoursAvailable * 60)
        );

        foreach (var warning in validation.Warnings)
            logger.LogWarning("Plan validation: {Warning}", warning);

        logger.LogInformation(
            "Generated plan for {Date} with {Model}: {TaskCount} tasks, {TotalTokens} tokens",
            today,
            aiResult.Model,
            validation.Tasks.Count,
            aiResult.Usage?.TotalTokenCount
        );

        var plan = new DailyPlan
        {
            UserId = TempUserId,
            Date = today,
            HoursAvailable = hoursAvailable,
            Tasks = validation.Tasks.Select(ToDailyTask).ToList(),
        };

        db.DailyPlans.Add(plan);

        try
        {
            await db.SaveChangesAsync(ct);
            return await GetTodayAsync(ct) ?? plan;
        }
        catch (DbUpdateException)
        {
            // Another request created today's plan first; the unique index rejected this one.
            db.ChangeTracker.Clear();
            return await GetTodayAsync(ct)
                ?? throw new InvalidOperationException("Plan save failed.");
        }
    }

    /// <summary>
    /// Completes a task in today's plan. Only the current (first incomplete) task can be
    /// completed. Completing an already-completed task is a no-op.
    /// </summary>
    public async Task<(CompleteOutcome Outcome, DailyPlan? Plan)> CompleteTaskAsync(
        Guid taskId,
        int? timeSpentSeconds,
        CancellationToken ct = default
    )
    {
        var plan = await GetTodayAsync(ct);
        var task = plan?.Tasks.FirstOrDefault(t => t.Id == taskId);
        if (plan is null || task is null)
            return (CompleteOutcome.NotFound, null);

        if (task.IsCompleted)
            return (CompleteOutcome.Completed, plan);

        var current = plan.Tasks.Where(t => !t.IsCompleted).MinBy(t => t.Order);
        if (current?.Id != task.Id)
            return (CompleteOutcome.NotCurrentTask, plan);

        task.IsCompleted = true;
        task.CompletedAt = DateTime.UtcNow;
        task.TimeSpentSeconds = timeSpentSeconds;

        await db.SaveChangesAsync(ct);
        return (CompleteOutcome.Completed, plan);
    }

    private static DailyTask ToDailyTask(ValidatedTask t) =>
        new()
        {
            Order = t.Order,
            Title = t.Title,
            Description = t.Description,
            Reason = t.Reason,
            EstimatedMinutes = t.EstimatedMinutes,
            GoalId = t.Link.Type == LinkTypes.Goal ? t.Link.Id : null,
            FutureTaskId = t.Link.Type == LinkTypes.FutureTask ? t.Link.Id : null,
        };
}
