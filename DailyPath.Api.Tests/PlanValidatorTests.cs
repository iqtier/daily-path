using System.Text.Json;
using DailyPath.Api.Services.Planning;

namespace DailyPath.Api.Tests;

public class PlanValidatorTests
{
    private static readonly Guid GoalId = Guid.NewGuid();
    private static readonly Guid FutureTaskId = Guid.NewGuid();

    private static readonly Dictionary<string, LinkTarget> IdMap = new()
    {
        ["g1"] = new LinkTarget(LinkTypes.Goal, GoalId),
        ["ft1"] = new LinkTarget(LinkTypes.FutureTask, FutureTaskId),
    };

    private static object AiTaskJson(
        int order,
        string linkedType,
        string linkedId,
        int minutes = 30
    ) =>
        new
        {
            order,
            title = $"Task {order}",
            description = "Details",
            reason = "Reason",
            estimatedMinutes = minutes,
            linkedType,
            linkedId,
        };

    private static string PlanJson(params object[] tasks) =>
        JsonSerializer.Serialize(new { tasks });

    [Fact]
    public void Valid_plan_maps_aliases_to_database_ids()
    {
        var json = PlanJson(AiTaskJson(1, "futureTask", "ft1"), AiTaskJson(2, "goal", "g1"));

        var result = PlanValidator.Validate(json, IdMap, availableMinutes: 120);

        Assert.Equal(2, result.Tasks.Count);
        Assert.Equal(FutureTaskId, result.Tasks[0].Link.Id);
        Assert.Equal(GoalId, result.Tasks[1].Link.Id);
        Assert.Empty(result.Warnings);
    }

    [Fact]
    public void Unknown_link_id_is_dropped()
    {
        var json = PlanJson(AiTaskJson(1, "futureTask", "ft1"), AiTaskJson(2, "goal", "g9"));

        var result = PlanValidator.Validate(json, IdMap, availableMinutes: 120);

        Assert.Single(result.Tasks);
        Assert.Contains(result.Warnings, w => w.Contains("unknown link"));
    }

    [Fact]
    public void Link_type_mismatch_is_dropped()
    {
        var json = PlanJson(AiTaskJson(1, "futureTask", "ft1"), AiTaskJson(2, "goal", "ft1"));

        var result = PlanValidator.Validate(json, IdMap, availableMinutes: 120);

        Assert.Single(result.Tasks);
    }

    [Fact]
    public void Tasks_over_time_budget_are_dropped_from_the_end()
    {
        var json = PlanJson(
            AiTaskJson(1, "futureTask", "ft1", minutes: 60),
            AiTaskJson(2, "futureTask", "ft1", minutes: 60),
            AiTaskJson(3, "goal", "g1", minutes: 60)
        );

        var result = PlanValidator.Validate(json, IdMap, availableMinutes: 120);

        Assert.Equal(2, result.Tasks.Count);
        Assert.Equal(LinkTypes.FutureTask, result.Tasks[^1].Link.Type);
    }

    [Fact]
    public void Extreme_estimates_are_clamped()
    {
        var json = PlanJson(AiTaskJson(1, "futureTask", "ft1", minutes: 0));

        var result = PlanValidator.Validate(json, IdMap, availableMinutes: 120);

        Assert.Equal(5, result.Tasks[0].EstimatedMinutes);
        Assert.Contains(result.Warnings, w => w.Contains("clamped"));
    }

    [Fact]
    public void Orders_are_renumbered_sequentially()
    {
        var json = PlanJson(AiTaskJson(5, "goal", "g1"), AiTaskJson(2, "futureTask", "ft1"));

        var result = PlanValidator.Validate(json, IdMap, availableMinutes: 120);

        Assert.Equal([1, 2], result.Tasks.Select(t => t.Order));
        Assert.Equal(LinkTypes.FutureTask, result.Tasks[0].Link.Type);
    }

    [Fact]
    public void Invalid_json_throws()
    {
        Assert.Throws<PlanValidationException>(() =>
            PlanValidator.Validate("{ not json", IdMap, availableMinutes: 120)
        );
    }

    [Fact]
    public void Plan_with_no_valid_tasks_throws()
    {
        var json = PlanJson(AiTaskJson(1, "goal", "g9"));

        Assert.Throws<PlanValidationException>(() =>
            PlanValidator.Validate(json, IdMap, availableMinutes: 120)
        );
    }
}
