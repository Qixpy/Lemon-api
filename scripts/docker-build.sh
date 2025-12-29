#!/bin/bash
# Build production Docker image for Lemon API

set -e

echo "🔨 Building Lemon API production image..."

# Build with latest tag
docker build -t lemon-api:latest .

# Optionally tag with version from package.json
VERSION=$(node -p "require('./package.json').version")
docker tag lemon-api:latest lemon-api:v$VERSION

echo "✅ Build complete!"
echo "   Images created:"
echo "   - lemon-api:latest"
echo "   - lemon-api:v$VERSION"
echo ""
echo "To run: npm run docker:up:prod"
echo "   or: docker compose -f docker-compose.prod.yml up -d"
