using DailyPath.Api.Dtos;
using DailyPath.Api.Models;
using DailyPath.Api.Services.Gemini;
using DailyPath.Api.Services.Planning;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace DailyPath.Api.Controllers;

[ApiController]
[Route("api/today")]
public class TodayController(DailyPlanService plans, ILogger<TodayController> logger)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<TodayResponse>> Get(CancellationToken ct)
    {
        var plan = await plans.GetTodayAsync(ct);
        return Ok(ToResponse(plan));
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
            return Ok(ToResponse(plan));
        }
        catch (NothingToPlanException ex)
        {
            return UnprocessableEntity(new { error = ex.Message });
        }
        catch (GeminiUnavailableException ex)
        {
            logger.LogWarning(ex, "Plan generation unavailable");
            return StatusCode(
                503,
                new { error = "Couldn't build today's list right now. Try again in a minute." }
            );
        }
        catch (Exception ex) when (ex is GeminiException or PlanValidationException)
        {
            logger.LogError(ex, "Plan generation produced an unusable result");
            return StatusCode(
                502,
                new { error = "Something went wrong building today's list. Try again." }
            );
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
            _ => Ok(ToResponse(plan)),
        };
    }

    private static TodayResponse ToResponse(DailyPlan? plan)
    {
        var date = (plan?.Date ?? DailyPlanService.GetUserToday()).ToString("yyyy-MM-dd");

        if (plan is null)
            return new TodayResponse(
                date,
                false,
                DailyPlanService.DefaultHoursPerDay,
                null,
                0,
                0,
                []
            );

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
            DailyPlanService.DefaultHoursPerDay,
            plan.HoursAvailable,
            ordered.Count,
            ordered.Count(t => t.IsCompleted),
            tasks
        );
    }

    private static LinkedToResponse? ToLinkedTo(DailyTask t) =>
        t.Goal is not null ? new LinkedToResponse(LinkTypes.Goal, t.Goal.Id, t.Goal.Title)
        : t.FutureTask is not null
            ? new LinkedToResponse(LinkTypes.FutureTask, t.FutureTask.Id, t.FutureTask.Title)
        : null;
}
