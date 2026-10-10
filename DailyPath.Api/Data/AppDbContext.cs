using Microsoft.EntityFrameworkCore;
using DailyPath.Api.Models;

namespace DailyPath.Api.Data;


// The (options) part receives the connection settings from Program.cs.
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // Each DbSet is one table. 
    public DbSet<Goal> Goals => Set<Goal>();

    // Extra table rules
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Save enums as text ("Fitness") instead of numbers (0), so the database is easy to read
        modelBuilder.Entity<Goal>().Property(g => g.Category).HasConversion<string>();
        modelBuilder.Entity<Goal>().Property(g => g.Status).HasConversion<string>();

        // Limit title length so nobody can save a huge string
        modelBuilder.Entity<Goal>().Property(g => g.Title).HasMaxLength(200);
    }
}