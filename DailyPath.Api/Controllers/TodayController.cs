using DailyPath.Api.Dtos;
using DailyPath.Api.Models;
using DailyPath.Api.Services.Gemini;
using DailyPath.Api.Services.Planning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace DailyPath.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/today")]
public class TodayController(DailyPlanService plans, ILogger<TodayController> logger)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<TodayResponse>> Get(CancellationToken ct)
    {
        var plan = await plans.GetTodayAsync(ct);
        return Ok(await ToResponseAsync(plan, ct));
    }

    [HttpPost]
    public async Task<ActionResult<TodayResponse>> Generate(
        GenerateTodayRequest req,
        CancellationToken ct
    )
    {
        try
        {
            var plan = await plans.GenerateTodayAsync(req.HoursAvailable, ct);
            return Ok(await ToResponseAsync(plan, ct));
        }
        catch (NothingToPlanException ex)
        {
            return UnprocessableEntity(new { error = ex.Message });
        }
        catch (Exception ex) when (ex is GeminiException or PlanValidationException)
        {
            return AiFailure(ex);
        }
    }

    [HttpPost("tasks/{id:guid}/complete")]
    public async Task<ActionResult<TodayResponse>> Complete(
        Guid id,
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] CompleteTaskRequest? req,
        CancellationToken ct
    )
    {
        var (outcome, plan) = await plans.CompleteTaskAsync(id, req?.TimeSpentSeconds, ct);

        return outcome switch
        {
            CompleteOutcome.NotFound => NotFound(),
            CompleteOutcome.NotCurrentTask => BadRequest(
                new { error = "Only the current task can be completed." }
            ),
            _ => Ok(await ToResponseAsync(plan, ct)),
        };
    }

    [HttpPost("bonus")]
    public async Task<ActionResult<TodayResponse>> AddBonus(CancellationToken ct)
    {
        try
        {
            var (outcome, plan) = await plans.AddBonusTasksAsync(ct);

            return outcome switch
            {
                BonusOutcome.NoPlan => NotFound(new { error = "No plan for today yet." }),
                BonusOutcome.TasksRemaining => Conflict(
                    new { error = "Finish today's tasks first." }
                ),
                BonusOutcome.LimitReached => StatusCode(
                    429,
                    new { error = "That's it for today. Great work." }
                ),
                BonusOutcome.NotEnoughTime => UnprocessableEntity(
                    new { error = "Not enough time left for a bonus task." }
                ),
                _ => Ok(await ToResponseAsync(plan, ct)),
            };
        }
        catch (Exception ex) when (ex is GeminiException or PlanValidationException)
        {
            return AiFailure(ex);
        }
    }

    // Internal details go to the log only; the client gets a generic message.
    private ObjectResult AiFailure(Exception ex)
    {
        if (ex is GeminiUnavailableException)
        {
            logger.LogWarning(ex, "AI unavailable");
            return StatusCode(
                503,
                new { error = "Couldn't reach the planner right now. Try again in a minute." }
            );
        }

        logger.LogError(ex, "AI produced an unusable result");
        return StatusCode(
            502,
            new { error = "Something went wrong building your tasks. Try again." }
        );
    }

    private async Task<TodayResponse> ToResponseAsync(DailyPlan? plan, CancellationToken ct)
    {
        var ctx = await plans.GetContextAsync(ct);
        var date = ctx.Today.ToString("yyyy-MM-dd");

        if (plan is null || plan.Tasks.Count == 0)
        {
            return new TodayResponse(
                date,
                false,
                ctx.DefaultHoursPerDay,
                null,
                0,
                0,
                null,
                DailyPlanService.MaxBonusRequests,
                []
            );
        }

        var ordered = plan.Tasks.OrderBy(t => t.Order).ToList();
        var currentId = ordered.FirstOrDefault(t => !t.IsCompleted)?.Id;

        var tasks = ordered
            .Select(t =>
            {
                var isLocked = !t.IsCompleted && t.Id != currentId;
                if (isLocked)
                    return new TodayTaskResponse(
                        t.Id,
                        t.Order,
                        true,
                        false,
                        t.IsBonus,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                    );

                return new TodayTaskResponse(
                    t.Id,
                    t.Order,
                    false,
                    t.IsCompleted,
                    t.IsBonus,
                    t.Title,
                    t.Description,
                    t.Reason,
                    ToLinkedTo(t),
                    t.IsCompleted ? t.EstimatedMinutes : null,
                    t.TimeSpentSeconds
                );
            })
            .ToList();

        return new TodayResponse(
            date,
            true,
            ctx.DefaultHoursPerDay,
            plan.HoursAvailable,
            ordered.Count,
            ordered.Count(t => t.IsCompleted),
            DailyPlanService.GetRemainingMinutes(plan),
            Math.Max(0, DailyPlanService.MaxBonusRequests - plan.BonusRequestCount),
            tasks
        );
    }

    private static LinkedToResponse? ToLinkedTo(DailyTask t) =>
        t.Goal is not null ? new LinkedToResponse(LinkTypes.Goal, t.Goal.Id, t.Goal.Title)
        : t.FutureTask is not null
            ? new LinkedToResponse(LinkTypes.FutureTask, t.FutureTask.Id, t.FutureTask.Title)
        : null;
}
