using System.Text.Json;
using DailyPath.Api.Data;
using DailyPath.Api.Models;
using DailyPath.Api.Services.Gemini;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace DailyPath.Api.Services.Planning;

public class NothingToPlanException()
    : Exception("Add a goal or a future task before generating a plan.");

public enum CompleteOutcome
{
    Completed,
    NotFound,
    NotCurrentTask,
}

public enum BonusOutcome
{
    Added,
    NoPlan,
    TasksRemaining,
    LimitReached,
    NotEnoughTime,
}

/// <summary>Model input for bonus mode. Mode must be "bonus" to trigger prompt rule 12.</summary>
public record BonusInput(
    string Mode,
    string Today,
    int RemainingMinutes,
    List<GoalInput> Goals,
    List<FutureTaskInput> FutureTasks,
    List<YesterdayInput> TodaysTasks
);

/// <summary>Per-request planning settings for the authenticated user.</summary>
public record PlanningContext(Guid UserId, DateOnly Today, decimal DefaultHoursPerDay);

public class DailyPlanService(
    AppDbContext db,
    IGeminiClient gemini,
    ICurrentUser currentUser,
    ILogger<DailyPlanService> logger
)
{
    // Caps AI cost per user per day.
    public const int MaxBonusRequests = 3;
    public const int MinBonusMinutes = 10;
    private const int MaxBonusTasks = 2;

    private const string FallbackTimeZoneId = "America/Toronto";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private PlanningContext? _context;

    /// <summary>
    /// Loads the user's id, local date, and default hours. Cached for the rest of the request.
    /// </summary>
    public async Task<PlanningContext> GetContextAsync(CancellationToken ct = default)
    {
        if (_context is not null)
            return _context;

        var userId = currentUser.Id;
        var user =
            await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new InvalidOperationException("Authenticated user not found.");

        var zone = TimeZoneInfo.TryFindSystemTimeZoneById(user.TimeZoneId, out var found)
            ? found
            : TimeZoneInfo.FindSystemTimeZoneById(FallbackTimeZoneId);

        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, zone));

        return _context = new PlanningContext(userId, today, user.DefaultHoursPerDay);
    }

    /// <summary>Available minutes left today, based on actual time spent where recorded.</summary>
    public static int GetRemainingMinutes(DailyPlan plan)
    {
        var usedMinutes = plan
            .Tasks.Where(t => t.IsCompleted)
            .Sum(t =>
                t.TimeSpentSeconds is int seconds
                    ? (int)Math.Round(seconds / 60.0)
                    : t.EstimatedMinutes
            );

        return Math.Max(0, (int)(plan.HoursAvailable * 60) - usedMinutes);
    }

    public async Task<DailyPlan?> GetTodayAsync(CancellationToken ct = default)
    {
        var ctx = await GetContextAsync(ct);

        return await db
            .DailyPlans.Include(p => p.Tasks)
                .ThenInclude(t => t.Goal)
            .Include(p => p.Tasks)
                .ThenInclude(t => t.FutureTask)
            .FirstOrDefaultAsync(p => p.UserId == ctx.UserId && p.Date == ctx.Today, ct);
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

        var ctx = await GetContextAsync(ct);
        var (goals, ranked) = await LoadInputsAsync(ctx, ct);

        if (goals.Count == 0 && ranked.Count == 0)
            throw new NothingToPlanException();

        var yesterday = ctx.Today.AddDays(-1);
        var yesterdayTasks = await db
            .DailyTasks.Where(t =>
                t.DailyPlan.UserId == ctx.UserId && t.DailyPlan.Date == yesterday
            )
            .OrderBy(t => t.Order)
            .ToListAsync(ct);

        var built = PlanInputBuilder.Build(
            ctx.Today,
            hoursAvailable,
            goals,
            ranked,
            yesterdayTasks
        );
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
        LogResult("plan", aiResult, validation);

        var plan = new DailyPlan
        {
            UserId = ctx.UserId,
            Date = ctx.Today,
            HoursAvailable = hoursAvailable,
            Tasks = validation.Tasks.Select(ToDailyTask).ToList(),
        };

        db.DailyPlans.Add(plan);

        try
        {
            await db.SaveChangesAsync(ct);
            return await GetTodayAsync(ct) ?? plan;
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
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

    /// <summary>
    /// Adds up to two AI-generated tasks when every task is done and time remains.
    /// Limited to MaxBonusRequests per day.
    /// </summary>
    public async Task<(BonusOutcome Outcome, DailyPlan? Plan)> AddBonusTasksAsync(
        CancellationToken ct = default
    )
    {
        var plan = await GetTodayAsync(ct);
        if (plan is null)
            return (BonusOutcome.NoPlan, null);
        if (plan.Tasks.Any(t => !t.IsCompleted))
            return (BonusOutcome.TasksRemaining, plan);
        if (plan.BonusRequestCount >= MaxBonusRequests)
            return (BonusOutcome.LimitReached, plan);

        var remainingMinutes = GetRemainingMinutes(plan);
        if (remainingMinutes < MinBonusMinutes)
            return (BonusOutcome.NotEnoughTime, plan);

        var ctx = await GetContextAsync(ct);
        var (goals, ranked) = await LoadInputsAsync(ctx, ct);
        var todaysTasks = plan.Tasks.OrderBy(t => t.Order).ToList();

        var built = PlanInputBuilder.Build(
            plan.Date,
            plan.HoursAvailable,
            goals,
            ranked,
            todaysTasks
        );
        var input = new BonusInput(
            "bonus",
            built.Input.Today,
            remainingMinutes,
            built.Input.Goals,
            built.Input.FutureTasks,
            built.Input.Yesterday
        );

        var aiResult = await gemini.GenerateJsonAsync(
            PlannerPrompt.SystemPrompt,
            JsonSerializer.Serialize(input, JsonOptions),
            PlannerPrompt.ResponseSchema,
            ct
        );

        var validation = PlanValidator.Validate(aiResult.Text, built.IdMap, remainingMinutes);
        LogResult("bonus", aiResult, validation);

        var nextOrder = todaysTasks.Max(t => t.Order) + 1;
        foreach (var task in validation.Tasks.Take(MaxBonusTasks))
        {
            var dailyTask = ToDailyTask(task with { Order = nextOrder++ });
            dailyTask.IsBonus = true;
            dailyTask.DailyPlanId = plan.Id;
            db.DailyTasks.Add(dailyTask);
        }

        plan.BonusRequestCount++;

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            // A concurrent bonus request already used these order numbers.
            db.ChangeTracker.Clear();
        }

        return (BonusOutcome.Added, await GetTodayAsync(ct));
    }

    private async Task<(List<Goal> Goals, List<PrioritizedTask> Ranked)> LoadInputsAsync(
        PlanningContext ctx,
        CancellationToken ct
    )
    {
        var goals = await db
            .Goals.Where(g => g.UserId == ctx.UserId && g.Status == GoalStatus.Active)
            .OrderBy(g => g.CreatedAt)
            .ToListAsync(ct);

        var futureTasks = await db
            .FutureTasks.Where(t => t.UserId == ctx.UserId && t.Status == FutureTaskStatus.Pending)
            .ToListAsync(ct);

        var secondsSpent = await db.GetSecondsSpentByFutureTaskAsync(ctx.UserId, ct);
        var ranked = TaskPrioritizer.Rank(futureTasks, secondsSpent, ctx.Today);

        return (goals, ranked);
    }

    private void LogResult(string kind, GeminiResult aiResult, PlanValidationResult validation)
    {
        foreach (var warning in validation.Warnings)
            logger.LogWarning("Plan validation ({Kind}): {Warning}", kind, warning);

        logger.LogInformation(
            "Generated {Kind} with {Model}: {TaskCount} tasks, {TotalTokens} tokens",
            kind,
            aiResult.Model,
            validation.Tasks.Count,
            aiResult.Usage?.TotalTokenCount
        );
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };

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
