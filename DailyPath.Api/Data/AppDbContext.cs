using DailyPath.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DailyPath.Api.Data;

// The (options) part receives the connection settings from Program.cs.
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // Each DbSet is one table.
    public DbSet<Goal> Goals => Set<Goal>();
    public DbSet<FutureTask> FutureTasks => Set<FutureTask>();
    public DbSet<DailyPlan> DailyPlans => Set<DailyPlan>();
    public DbSet<DailyTask> DailyTasks => Set<DailyTask>();

    // Extra table rules
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Save enums as text ("Fitness") instead of numbers (0), so the database is easy to read
        modelBuilder.Entity<Goal>().Property(g => g.Category).HasConversion<string>();
        modelBuilder.Entity<Goal>().Property(g => g.Status).HasConversion<string>();

        // Limit title length so nobody can save a huge string
        modelBuilder.Entity<Goal>().Property(g => g.Title).HasMaxLength(200);

        modelBuilder.Entity<FutureTask>(entity =>
        {
            entity.Property(t => t.Title).HasMaxLength(200);
            entity.Property(t => t.Materials).HasMaxLength(4000);
            entity.Property(t => t.Weight).HasPrecision(5, 2);
            entity.Property(t => t.EstimatedHours).HasPrecision(6, 2);

            entity.Property(t => t.Type).HasConversion<string>();
            entity.Property(t => t.Status).HasConversion<string>();
            entity.Property(t => t.Size).HasConversion<string>();
            entity.Property(t => t.EstimateSource).HasConversion<string>();

            // Speeds up the main query: a user's pending tasks ordered by due date.
            entity.HasIndex(t => new
            {
                t.UserId,
                t.Status,
                t.DueDate,
            });
        });

        modelBuilder.Entity<DailyPlan>(entity =>
        {
            entity.Property(p => p.HoursAvailable).HasPrecision(4, 2);

            // One plan per user per day.
            entity.HasIndex(p => new { p.UserId, p.Date }).IsUnique();

            entity
                .HasMany(p => p.Tasks)
                .WithOne(t => t.DailyPlan)
                .HasForeignKey(t => t.DailyPlanId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DailyTask>(entity =>
        {
            entity.Property(t => t.Title).HasMaxLength(200);
            entity.Property(t => t.Description).HasMaxLength(1000);
            entity.Property(t => t.Reason).HasMaxLength(500);

            entity.HasIndex(t => new { t.DailyPlanId, t.Order }).IsUnique();

            // Deleting a goal or future task removes its daily tasks, including history.
            entity
                .HasOne(t => t.Goal)
                .WithMany()
                .HasForeignKey(t => t.GoalId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne(t => t.FutureTask)
                .WithMany()
                .HasForeignKey(t => t.FutureTaskId)
                .OnDelete(DeleteBehavior.Cascade);

            // Exactly one of GoalId or FutureTaskId must be set.
            entity.ToTable(t =>
                t.HasCheckConstraint(
                    "CK_DailyTask_SingleLink",
                    "(\"GoalId\" IS NULL) <> (\"FutureTaskId\" IS NULL)"
                )
            );
        });
    }
}
