using DailyPath.Api.Data;
using DailyPath.Api.Dtos;
using DailyPath.Api.Models;
using DailyPath.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DailyPath.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/goals")]
public class GoalsController(AppDbContext db, ICurrentUser currentUser) : ControllerBase
{
    private static readonly Dictionary<Guid, int> NoCounts = [];

    [HttpGet]
    public async Task<ActionResult<List<GoalResponse>>> GetAll()
    {
        var userId = currentUser.Id;

        var goals = await db
            .Goals.Where(g => g.UserId == userId)
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync();

        var counts = await db.GetCompletedTodoCountByGoalAsync(userId);

        return Ok(goals.Select(g => ToResponse(g, counts)).ToList());
    }

    [HttpGet("{id:guid}/history")]
    public async Task<ActionResult<List<GoalHistoryItem>>> GetHistory(Guid id)
    {
        var userId = currentUser.Id;

        var goalExists = await db.Goals.AnyAsync(g => g.Id == id && g.UserId == userId);
        if (!goalExists)
            return NotFound();

        var items = await db
            .DailyTasks.Where(t => t.GoalId == id && t.IsCompleted)
            .OrderByDescending(t => t.DailyPlan.Date)
            .ThenByDescending(t => t.CompletedAt)
            .Select(t => new
            {
                t.Id,
                t.Title,
                t.Description,
                t.DailyPlan.Date,
                t.CompletedAt,
                t.TimeSpentSeconds,
            })
            .ToListAsync();

        return Ok(
            items
                .Select(t => new GoalHistoryItem(
                    t.Id,
                    t.Title,
                    t.Description,
                    t.Date.ToString("yyyy-MM-dd"),
                    t.CompletedAt,
                    t.TimeSpentSeconds is int seconds ? (int)Math.Round(seconds / 60.0) : null
                ))
                .ToList()
        );
    }

    [HttpPost]
    public async Task<ActionResult<GoalResponse>> Create(GoalRequest req)
    {
        var goal = new Goal
        {
            UserId = currentUser.Id,
            Title = req.Title,
            Details = req.Details,
            Category = req.Category,
            Status = req.Status,
        };

        db.Goals.Add(goal);
        await db.SaveChangesAsync();

        return StatusCode(201, ToResponse(goal, NoCounts));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<GoalResponse>> Update(Guid id, GoalRequest req)
    {
        var userId = currentUser.Id;

        var goal = await db.Goals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);
        if (goal is null)
            return NotFound();

        goal.Title = req.Title;
        goal.Details = req.Details;
        goal.Category = req.Category;
        goal.Status = req.Status;

        await db.SaveChangesAsync();

        var counts = await db.GetCompletedTodoCountByGoalAsync(userId);
        return Ok(ToResponse(goal, counts));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = currentUser.Id;

        var goal = await db.Goals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);
        if (goal is null)
            return NotFound();

        db.Goals.Remove(goal);
        await db.SaveChangesAsync();

        return NoContent();
    }

    private static GoalResponse ToResponse(
        Goal g,
        IReadOnlyDictionary<Guid, int> completedCounts
    ) =>
        new(
            g.Id,
            g.Title,
            g.Details,
            g.Category,
            g.Status,
            completedCounts.GetValueOrDefault(g.Id),
            g.CreatedAt
        );
}
