using Microsoft.EntityFrameworkCore;
using DailyPath.Api.Models;

namespace DailyPath.Api.Data;


// The (options) part receives the connection settings from Program.cs.
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // Each DbSet is one table. 
    public DbSet<Goal> Goals => Set<Goal>();
    public DbSet<FutureTask> FutureTasks => Set<FutureTask>();

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
                 entity.HasIndex(t => new { t.UserId, t.Status, t.DueDate });
            });
    }
}