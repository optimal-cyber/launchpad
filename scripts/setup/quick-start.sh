#!/bin/bash

echo "🚀 Quick Start - Optimal AppSec Platform"
echo "========================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.development .env
    echo "✅ Created .env file with development defaults"
    echo ""
    echo "⚠️  Note: Update GITLAB_TOKEN in .env for full GitLab integration"
    echo ""
fi

# Start services
echo "🔨 Starting development services..."
docker compose -f docker-compose.dev.yml up -d --build

echo ""
echo "⏳ Waiting for services to initialize..."
sleep 30

echo ""
echo "🌐 Platform is starting up!"
echo ""
echo "Access your platform at:"
echo "  📊 Portal: http://localhost:3000"
echo "  🔧 API: http://localhost:8000"
echo "  📚 Docs: http://localhost:8000/docs"
echo ""
echo "To view logs: docker compose -f docker-compose.dev.yml logs -f"
echo "To stop: docker compose -f docker-compose.dev.yml down"
