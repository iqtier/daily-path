using DailyPath.Api.Data;
using DailyPath.Api.Dtos;
using DailyPath.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DailyPath.Api.Controllers;

// Handles all /api/goals URLs. 
// (AppDbContext db) asks ASP.NET Core to hand us the database, set up in Program.cs.
[ApiController]
[Route("api/goals")]
public class GoalsController(AppDbContext db) : ControllerBase
{
    // TEMP: one fake user until we add login. Every goal belongs to this user for now.
    private static readonly Guid TempUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    // GET /api/goals : list my goals, newest first
    [HttpGet]
    public async Task<ActionResult<List<GoalResponse>>> GetAll()
    {
        // Like prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
        var goals = await db.Goals
            .Where(g => g.UserId == TempUserId)
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync();

        return Ok(goals.Select(ToResponse).ToList());   // 200 OK with the list
    }

    // POST /api/goals : add a new goal
    [HttpPost]
    public async Task<ActionResult<GoalResponse>> Create(GoalRequest req)
    {
        // Build the goal from the DTO. The server sets UserId, not the user.
        var goal = new Goal
        {
            UserId = TempUserId,
            Title = req.Title,
            Details = req.Details,
            Category = req.Category,
            Status = req.Status
        };

        db.Goals.Add(goal);              // Like prisma.goal.create(...)
        await db.SaveChangesAsync();     // Actually writes to the database

        return StatusCode(201, ToResponse(goal));   // 201 Created
    }

    // PUT /api/goals/{id} : edit a goal
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<GoalResponse>> Update(Guid id, GoalRequest req)
    {
        // Find by id AND owner. Without the owner check, anyone could edit anyone's goal.
        var goal = await db.Goals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == TempUserId);
        if (goal is null) return NotFound();   // 404

        goal.Title = req.Title;
        goal.Details = req.Details;
        goal.Category = req.Category;
        goal.Status = req.Status;

        await db.SaveChangesAsync();   // EF Core notices what changed and updates only that
        return Ok(ToResponse(goal));
    }

    // DELETE /api/goals/{id} : delete a goal
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var goal = await db.Goals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == TempUserId);
        if (goal is null) return NotFound();

        db.Goals.Remove(goal);
        await db.SaveChangesAsync();
        return NoContent();   // 204: done, nothing to send back
    }

    // Turns a database Goal into a GoalResponse (hides UserId)
    private static GoalResponse ToResponse(Goal g) =>
        new(g.Id, g.Title, g.Details, g.Category, g.Status, g.CreatedAt);
}