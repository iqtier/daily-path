using System.Text.Json;
using DailyPath.Api.Services.Gemini;
using Microsoft.AspNetCore.Mvc;

namespace DailyPath.Api.Controllers;

/// <summary>Development-only diagnostics. Returns 404 outside the Development environment.</summary>
[ApiController]
[Route("api/dev")]
public class DevController(IGeminiClient gemini, IWebHostEnvironment env) : ControllerBase
{
    private static readonly JsonElement PingSchema = JsonDocument
        .Parse(
            """
            {
              "type": "object",
              "properties": { "reply": { "type": "string" } },
              "required": ["reply"]
            }
            """
        )
        .RootElement;

    [HttpGet("gemini-ping")]
    public async Task<IActionResult> GeminiPing(CancellationToken ct)
    {
        if (!env.IsDevelopment())
            return NotFound();

        try
        {
            var result = await gemini.GenerateJsonAsync(
                "Reply with valid JSON only.",
                "Say hello in one word.",
                PingSchema,
                ct
            );

            return Ok(
                new
                {
                    result.Model,
                    result.Text,
                    result.Usage,
                }
            );
        }
        catch (GeminiUnavailableException ex)
        {
            return StatusCode(503, new { error = ex.Message });
        }
    }
}
