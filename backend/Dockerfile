FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY YesChef.slnx .
COPY YesChef.Core/YesChef.Core.csproj YesChef.Core/
COPY YesChef.Infrastructure/YesChef.Infrastructure.csproj YesChef.Infrastructure/
COPY YesChef.Api/YesChef.Api.csproj YesChef.Api/
RUN dotnet restore

COPY . .
RUN dotnet publish YesChef.Api/YesChef.Api.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENTRYPOINT ["dotnet", "YesChef.Api.dll"]
