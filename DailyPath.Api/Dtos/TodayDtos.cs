using System.ComponentModel.DataAnnotations;

namespace DailyPath.Api.Dtos;

public record GenerateTodayRequest([Range(0.25, 16)] decimal HoursAvailable);

/// <summary>TimeSpentSeconds is null when the timer was not used. Capped at 24 hours.</summary>
public record CompleteTaskRequest([Range(0, 86400)] int? TimeSpentSeconds);

/// <summary>
/// Today's state. When HasPlan is false, the client shows the setup screen
/// pre-filled with DefaultHoursAvailable. The bonus card is shown when all tasks are done,
/// RemainingMinutes is at least 10, and BonusRequestsLeft is above 0.
/// </summary>
public record TodayResponse(
    string Date,
    bool HasPlan,
    decimal DefaultHoursAvailable,
    decimal? HoursAvailableToday,
    int TotalTasks,
    int CompletedTasks,
    int? RemainingMinutes,
    int BonusRequestsLeft,
    List<TodayTaskResponse> Tasks
);

/// <summary>Locked tasks expose only Id, Order, and IsLocked. Estimates appear after completion.</summary>
public record TodayTaskResponse(
    Guid Id,
    int Order,
    bool IsLocked,
    bool IsCompleted,
    bool IsBonus,
    string? Title,
    string? Description,
    string? Reason,
    LinkedToResponse? LinkedTo,
    int? EstimatedMinutes,
    int? TimeSpentSeconds
);

public record LinkedToResponse(string Type, Guid Id, string Title);
