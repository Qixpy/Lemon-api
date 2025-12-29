# Build production Docker image for Lemon API

Write-Host "🔨 Building Lemon API production image..." -ForegroundColor Cyan

try {
    # Build with latest tag
    docker build -t lemon-api:latest .
    
    # Optionally tag with version from package.json
    $packageJson = Get-Content -Path "package.json" -Raw | ConvertFrom-Json
    $version = $packageJson.version
    docker tag lemon-api:latest "lemon-api:v$version"
    
    Write-Host "✅ Build complete!" -ForegroundColor Green
    Write-Host "   Images created:"
    Write-Host "   - lemon-api:latest"
    Write-Host "   - lemon-api:v$version"
    Write-Host ""
    Write-Host "To run: npm run docker:up:prod" -ForegroundColor Yellow
    Write-Host "   or: docker compose -f docker-compose.prod.yml up -d"
}
catch {
    Write-Host "❌ Build failed: $_" -ForegroundColor Red
    exit 1
}
