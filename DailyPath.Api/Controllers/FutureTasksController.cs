using DailyPath.Api.Data;
using DailyPath.Api.Dtos;
using DailyPath.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DailyPath.Api.Controllers;

[ApiController]
[Route("api/future-tasks")]
public class FutureTasksController(AppDbContext db) : ControllerBase
{
    // Placeholder until authentication is added.
    private static readonly Guid TempUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    [HttpGet]
    public async Task<ActionResult<List<FutureTaskResponse>>> GetAll()
    {
        var tasks = await db.FutureTasks
            .Where(t => t.UserId == TempUserId)
            .ToListAsync();

        // Pending tasks first by due date, then completed tasks, most recent first.
        var ordered = tasks
            .Where(t => t.Status == FutureTaskStatus.Pending)
            .OrderBy(t => t.DueDate)
            .Concat(tasks
                .Where(t => t.Status == FutureTaskStatus.Done)
                .OrderByDescending(t => t.CompletedAt))
            .Select(ToResponse)
            .ToList();

        return Ok(ordered);
    }

    [HttpPost]
    public async Task<ActionResult<FutureTaskResponse>> Create(FutureTaskRequest req)
    {
        var task = new FutureTask { UserId = TempUserId };
        ApplyRequest(task, req);

        db.FutureTasks.Add(task);
        await db.SaveChangesAsync();

        return StatusCode(201, ToResponse(task));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<FutureTaskResponse>> Update(Guid id, FutureTaskRequest req)
    {
        var task = await db.FutureTasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == TempUserId);
        if (task is null) return NotFound();

        ApplyRequest(task, req);
        await db.SaveChangesAsync();

        return Ok(ToResponse(task));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var task = await db.FutureTasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == TempUserId);
        if (task is null) return NotFound();

        db.FutureTasks.Remove(task);
        await db.SaveChangesAsync();

        return NoContent();
    }

    private static void ApplyRequest(FutureTask task, FutureTaskRequest req)
    {
        task.Title = req.Title;
        task.Type = req.Type;
        task.DueDate = req.DueDate;
        task.Weight = req.Weight;
        task.Size = req.Size;
        task.Materials = req.Materials;
        (task.EstimatedHours, task.EstimateSource) = ResolveEstimate(req);

        // Stamp completion time only on the transition to Done; clear it if reopened.
        if (req.Status == FutureTaskStatus.Done && task.Status != FutureTaskStatus.Done)
            task.CompletedAt = DateTime.UtcNow;
        else if (req.Status == FutureTaskStatus.Pending)
            task.CompletedAt = null;

        task.Status = req.Status;
    }

    /// <summary>
    /// Explicit hours take priority over size. Returns nulls when neither is provided;
    /// the AI estimator will fill these in later.
    /// </summary>
    private static (decimal? Hours, EstimateSource? Source) ResolveEstimate(FutureTaskRequest req)
    {
        if (req.EstimatedHours is not null) return (req.EstimatedHours, EstimateSource.User);
        if (req.Size is not null) return (SizeToHours(req.Size.Value), EstimateSource.Size);
        return (null, null);
    }

    private static decimal SizeToHours(TaskSize size) => size switch
    {
        TaskSize.Small => 2m,
        TaskSize.Medium => 5m,
        TaskSize.Large => 10m,
        TaskSize.Huge => 20m,
        _ => throw new ArgumentOutOfRangeException(nameof(size))
    };

    private static FutureTaskResponse ToResponse(FutureTask t) => new(
        t.Id, t.Title, t.Type, t.DueDate, t.Weight, t.Size, t.EstimatedHours,
        t.EstimateSource, t.Materials, t.Status,
        HoursDone: 0m, // TODO: sum time from linked daily tasks once they exist.
        t.CreatedAt, t.CompletedAt);
}