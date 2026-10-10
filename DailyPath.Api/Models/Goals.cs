namespace DailyPath.Api.Models;

// A long-term aim the user works toward, like "Get fit".
// This class becomes the "Goals" table, like a model in schema.prisma.
public class Goal
{
    public Guid Id { get; set; } = Guid.NewGuid();      // Primary key, auto-made like @default(uuid())
    public Guid UserId { get; set; }                     // Owner. The real User table comes with login later
    public string Title { get; set; } = "";
    public string? Details { get; set; }                 // "?" = optional, like String? in Prisma
    public GoalCategory Category { get; set; } = GoalCategory.Other;
    public GoalStatus Status { get; set; } = GoalStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// Allowed values, like an enum in Prisma
public enum GoalCategory { Fitness, Career, Learning, Health, Personal, Other }
public enum GoalStatus { Active, Paused, Achieved }