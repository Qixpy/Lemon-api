#!/bin/bash
# Run Lemon API in production mode with Docker Compose

set -e

echo "🚀 Starting Lemon API in production mode..."

# Check if .env.prod exists, warn if not
if [ ! -f .env.prod ]; then
    echo "⚠️  Warning: .env.prod not found"
    echo "   Using default values from docker-compose.prod.yml"
    echo "   For production, create .env.prod with strong secrets!"
    echo ""
fi

# Start services
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "✅ Services started!"
echo ""
echo "View logs:     docker compose -f docker-compose.prod.yml logs -f"
echo "Health check:  curl http://localhost:3000/health"
echo "Ready check:   curl http://localhost:3000/ready"
echo "Stop services: docker compose -f docker-compose.prod.yml down"
