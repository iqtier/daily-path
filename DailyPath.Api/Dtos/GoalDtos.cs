using System.ComponentModel.DataAnnotations;
using DailyPath.Api.Models;

namespace DailyPath.Api.Dtos;

// What the frontend SENDS to create or edit a goal.
// Only these 4 fields can be set. Id, UserId, and CreatedAt are set by the server.
public record GoalRequest(
    [Required, MaxLength(200)] string Title,   // Must exist, max 200 characters
    [MaxLength(2000)] string? Details,         // Optional, max 2000 characters
    GoalCategory Category,
    GoalStatus Status);

// What the API SENDS BACK. No UserId, the frontend doesn't need it.
public record GoalResponse(
    Guid Id,
    string Title,
    string? Details,
    GoalCategory Category,
    GoalStatus Status,
    DateTime CreatedAt);