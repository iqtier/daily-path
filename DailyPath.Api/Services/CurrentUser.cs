using System.Security.Claims;

namespace DailyPath.Api.Services;

public interface ICurrentUser
{
    Guid Id { get; }
}

/// <summary>Resolves the authenticated user's id from the current request's claims.</summary>
public class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public Guid Id =>
        Guid.TryParse(
            accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier),
            out var id
        )
            ? id
            : throw new InvalidOperationException("No authenticated user on this request.");
}
