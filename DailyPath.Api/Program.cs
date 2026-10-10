using System.Text.Json;
using System.Text.Json.Serialization;
using DailyPath.Api.Configuration;
using DailyPath.Api.Data;
using DailyPath.Api.Services.Gemini;
using DailyPath.Api.Services.Planning;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Register the database so any controller can ask for it.
// Reads the connection string from user secrets.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default"))
);

builder.Services.AddHttpClient<IGeminiClient, GeminiClient>(client =>
    client.BaseAddress = new Uri("https://generativelanguage.googleapis.com/")
);
builder
    .Services.AddOptions<GeminiOptions>()
    .Bind(builder.Configuration.GetSection(GeminiOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

// Send and read enums as lowercase text ("fitness") instead of numbers (0),
// so the JSON matches what the frontend expects.
builder
    .Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)
        )
    );
builder.Services.AddScoped<DailyPlanService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
