using DailyPath.Api.Models;
using DailyPath.Api.Services;

namespace DailyPath.Api.Tests;

public class TaskPrioritizerTests
{
    // Fixed date keeps results identical on every run.
    private static readonly DateOnly Today = new(2026, 10, 10);
    private static readonly Dictionary<Guid, int> NoTimeSpent = [];

    private static FutureTask MakeTask(
        string title,
        decimal hours,
        int dueInDays,
        decimal? weight = 15,
        FutureTaskStatus status = FutureTaskStatus.Pending
    ) =>
        new()
        {
            Title = title,
            EstimatedHours = hours,
            DueDate = Today.AddDays(dueInDays),
            Weight = weight,
            Status = status,
        };

    [Fact]
    public void Larger_task_ranks_first_when_weight_and_due_date_match()
    {
        var report = MakeTask("Research report", hours: 10, dueInDays: 5);
        var worksheet = MakeTask("Short worksheet", hours: 3, dueInDays: 5);

        var ranked = TaskPrioritizer.Rank([worksheet, report], NoTimeSpent, Today);

        Assert.Equal(report.Id, ranked[0].Task.Id);
        Assert.Equal(2.0m, ranked[0].Pressure);
        Assert.Equal(0.6m, ranked[1].Pressure);
    }

    [Fact]
    public void Time_spent_reduces_hours_left()
    {
        var report = MakeTask("Research report", hours: 10, dueInDays: 5);
        var spent = new Dictionary<Guid, int> { [report.Id] = 4 * 3600 };

        var ranked = TaskPrioritizer.Rank([report], spent, Today);

        Assert.Equal(6m, ranked[0].HoursLeft);
        Assert.Equal(1.2m, ranked[0].Pressure);
    }

    [Fact]
    public void Completed_tasks_are_excluded()
    {
        var done = MakeTask("Old quiz", hours: 2, dueInDays: 3, status: FutureTaskStatus.Done);
        var pending = MakeTask("Lab report", hours: 4, dueInDays: 3);

        var ranked = TaskPrioritizer.Rank([done, pending], NoTimeSpent, Today);

        Assert.Single(ranked);
        Assert.Equal(pending.Id, ranked[0].Task.Id);
    }

    [Fact]
    public void Overdue_task_is_treated_as_one_day_left()
    {
        var overdue = MakeTask("Late essay", hours: 3, dueInDays: -2);

        var ranked = TaskPrioritizer.Rank([overdue], NoTimeSpent, Today);

        Assert.Equal(1, ranked[0].DaysLeft);
        Assert.Equal(3m, ranked[0].Pressure);
    }

    [Fact]
    public void IsOverloaded_when_total_pressure_exceeds_available_hours()
    {
        var report = MakeTask("Research report", hours: 10, dueInDays: 5);
        var worksheet = MakeTask("Short worksheet", hours: 3, dueInDays: 5);
        var ranked = TaskPrioritizer.Rank([report, worksheet], NoTimeSpent, Today);

        // Combined pressure is 2.6 hours per day.
        Assert.True(TaskPrioritizer.IsOverloaded(ranked, hoursAvailable: 2m));
        Assert.False(TaskPrioritizer.IsOverloaded(ranked, hoursAvailable: 3m));
    }
}
