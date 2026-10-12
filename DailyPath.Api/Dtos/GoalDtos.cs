using System.ComponentModel.DataAnnotations;
using DailyPath.Api.Models;

namespace DailyPath.Api.Dtos;

public record GoalRequest(
    [Required, MaxLength(200)] string Title,
    [MaxLength(2000)] string? Details,
    GoalCategory Category,
    GoalStatus Status
);

public record GoalResponse(
    Guid Id,
    string Title,
    string? Details,
    GoalCategory Category,
    GoalStatus Status,
    int CompletedTodoCount,
    DateTime CreatedAt
);
