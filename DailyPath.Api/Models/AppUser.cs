using Microsoft.AspNetCore.Identity;

namespace DailyPath.Api.Models;

/// <summary>
/// Application user. Identity provides email, password hash, lockout, and security stamp;
/// this class adds planning settings.
/// </summary>
public class AppUser : IdentityUser<Guid>
{
    /// <summary>IANA time zone id used to decide the user's "today".</summary>
    public string TimeZoneId { get; set; } = "America/Toronto";

    public decimal DefaultHoursPerDay { get; set; } = 3m;
}
