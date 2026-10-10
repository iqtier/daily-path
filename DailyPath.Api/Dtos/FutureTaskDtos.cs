using System.ComponentModel.DataAnnotations;
using DailyPath.Api.Models;

namespace DailyPath.Api.Dtos;

/// <summary>Payload for creating or updating a future task.</summary>
public record FutureTaskRequest(
    [Required, MaxLength(200)] string Title,
    FutureTaskType Type,
    DateOnly DueDate,
    [Range(0, 100)] decimal? Weight,
    TaskSize? Size,
    [Range(0.25, 1000)] decimal? EstimatedHours,
    [MaxLength(4000)] string? Materials,
    FutureTaskStatus Status = FutureTaskStatus.Pending);

/// <summary>Future task as returned to the client.</summary>
public record FutureTaskResponse(
    Guid Id,
    string Title,
    FutureTaskType Type,
    DateOnly DueDate,
    decimal? Weight,
    TaskSize? Size,
    decimal? EstimatedHours,
    EstimateSource? EstimateSource,
    string? Materials,
    FutureTaskStatus Status,
    decimal HoursDone,
    DateTime CreatedAt,
    DateTime? CompletedAt);