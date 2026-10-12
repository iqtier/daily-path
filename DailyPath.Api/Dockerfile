# Build stage: full SDK to restore and publish.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first so this layer is cached until the project file changes.
COPY DailyPath.Api/DailyPath.Api.csproj DailyPath.Api/
RUN dotnet restore DailyPath.Api/DailyPath.Api.csproj

COPY DailyPath.Api/ DailyPath.Api/
RUN dotnet publish DailyPath.Api/DailyPath.Api.csproj -c Release -o /app/publish --no-restore

# Runtime stage: smaller image with only the ASP.NET Core runtime.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

# Run as the non-root user provided by the base image.
USER $APP_UID

ENTRYPOINT ["dotnet", "DailyPath.Api.dll"]