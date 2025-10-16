#!/bin/bash

echo "🚀 Setting up Optimal DevSecOps Platform..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ docker compose is not available. Please install Docker Desktop and try again."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "✅ Created .env file. Please edit it with your GitLab credentials."
    echo ""
    echo "Required environment variables:"
    echo "  - GITLAB_TOKEN: Your GitLab personal access token"
    echo "  - GITLAB_WEBHOOK_SECRET: A secret for webhook verification"
    echo "  - INGESTION_TOKEN: A token for CI push authentication"
    echo ""
    echo "Please edit .env and run this script again."
    exit 0
fi

# Load environment variables
source .env

# Check if required variables are set
if [ -z "$GITLAB_TOKEN" ] || [ "$GITLAB_TOKEN" = "your_gitlab_personal_access_token_here" ]; then
    echo "❌ Please set GITLAB_TOKEN in your .env file"
    exit 1
fi

if [ -z "$GITLAB_WEBHOOK_SECRET" ] || [ "$GITLAB_WEBHOOK_SECRET" = "your_webhook_secret_here" ]; then
    echo "❌ Please set GITLAB_WEBHOOK_SECRET in your .env file"
    exit 1
fi

if [ -z "$INGESTION_TOKEN" ] || [ "$INGESTION_TOKEN" = "your_ingestion_token_here" ]; then
    echo "❌ Please set INGESTION_TOKEN in your .env file"
    exit 1
fi

echo "✅ Environment variables configured"

# Build and start services
echo "🔨 Building and starting services..."
docker compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🏥 Checking service health..."

# Check API Gateway
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo "✅ API Gateway is healthy"
else
    echo "❌ API Gateway is not responding"
fi

# Check GitLab Listener
if curl -s http://localhost:8001/health | grep -q "healthy"; then
    echo "✅ GitLab Listener is healthy"
else
    echo "❌ GitLab Listener is not responding"
fi

# Check SBOM Service
if curl -s http://localhost:8002/health | grep -q "healthy"; then
    echo "✅ SBOM Service is healthy"
else
    echo "❌ SBOM Service is not responding"
fi

# Check Vulnerability Service
if curl -s http://localhost:8003/health | grep -q "healthy"; then
    echo "✅ Vulnerability Service is healthy"
else
    echo "❌ Vulnerability Service is not responding"
fi

# Check Apollo Agent
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo "✅ Apollo Agent is healthy"
else
    echo "❌ Apollo Agent is not responding"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Access your platform at:"
echo "  - Portal: http://localhost:3000"
echo "  - API Docs: http://localhost:8000/docs"
echo "  - GitLab Integration: http://localhost:8001"
echo ""
echo "Next steps:"
echo "1. Link your GitLab project:"
echo "   curl -X POST 'http://localhost:8000/link/gitlab-project' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'Authorization: Bearer $INGESTION_TOKEN' \\"
echo "     -d '{\"gitlab_project_id\": YOUR_PROJECT_ID, \"optimal_project_id\": \"proj-001\", \"default_branch\": \"main\"}'"
echo ""
echo "2. Add the .gitlab-ci.yml.example to your project and configure:"
echo "   - DEVSECOPS_API: http://localhost:8000"
echo "   - DEVSECOPS_TOKEN: $INGESTION_TOKEN"
echo ""
echo "3. Run a pipeline to see results in the portal!"
echo ""
echo "To stop the platform: docker compose down"
echo "To view logs: docker compose logs -f"

