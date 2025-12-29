# Run Lemon API in production mode with Docker Compose

Write-Host "🚀 Starting Lemon API in production mode..." -ForegroundColor Cyan

# Check if .env.prod exists, warn if not
if (-not (Test-Path .env.prod)) {
    Write-Host "⚠️  Warning: .env.prod not found" -ForegroundColor Yellow
    Write-Host "   Using default values from docker-compose.prod.yml"
    Write-Host "   For production, create .env.prod with strong secrets!"
    Write-Host ""
}

try {
    # Start services
    docker compose -f docker-compose.prod.yml up -d --build
    
    Write-Host ""
    Write-Host "✅ Services started!" -ForegroundColor Green
    Write-Host ""
    Write-Host "View logs:     docker compose -f docker-compose.prod.yml logs -f" -ForegroundColor Cyan
    Write-Host "Health check:  curl http://localhost:3000/health"
    Write-Host "Ready check:   curl http://localhost:3000/ready"
    Write-Host "Stop services: docker compose -f docker-compose.prod.yml down"
}
catch {
    Write-Host "❌ Failed to start services: $_" -ForegroundColor Red
    exit 1
}
