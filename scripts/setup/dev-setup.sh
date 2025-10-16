#!/bin/bash

echo "🚀 Setting up Optimal AppSec Platform for Local Development..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
    print_error "docker compose is not available. Please install Docker Desktop and try again."
    exit 1
fi

print_status "Docker and Docker Compose are available"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_info "Creating .env file from development template..."
    cp env.development .env
    print_warning "Created .env file with development defaults."
    print_warning "Please update GITLAB_TOKEN in .env file if you want GitLab integration."
    echo ""
fi

# Load environment variables
source .env

# Create necessary directories
print_info "Creating necessary directories..."
mkdir -p data/{logs,uploads,exports,reports}
mkdir -p data/agents/{configs,logs,data}
mkdir -p data/monitoring/{prometheus,grafana}

print_status "Directories created"

# Build and start services
print_info "Building and starting development services..."
docker compose -f docker-compose.dev.yml up -d --build

# Wait for services to be ready
print_info "Waiting for services to initialize..."
sleep 45

# Check service health
print_info "Checking service health..."

# Function to check service health
check_service() {
    local service_name=$1
    local url=$2
    local expected_response=$3
    
    if curl -s "$url" | grep -q "$expected_response"; then
        print_status "$service_name is healthy"
        return 0
    else
        print_error "$service_name is not responding at $url"
        return 1
    fi
}

# Check all services
services_healthy=0

check_service "API Gateway" "http://localhost:8000/health" "healthy" && ((services_healthy++))
check_service "Portal" "http://localhost:3000" "html" && ((services_healthy++))
check_service "SBOM Service" "http://localhost:8002/health" "healthy" && ((services_healthy++))
check_service "Vulnerability Service" "http://localhost:8003/health" "healthy" && ((services_healthy++))
check_service "GitLab Listener" "http://localhost:8001/health" "healthy" && ((services_healthy++))
check_service "Runtime Agent" "http://localhost:8080/health" "healthy" && ((services_healthy++))
check_service "Prometheus" "http://localhost:9090/-/healthy" "Prometheus" && ((services_healthy++))
check_service "Grafana" "http://localhost:3001/api/health" "ok" && ((services_healthy++))

echo ""
if [ $services_healthy -eq 8 ]; then
    print_status "All services are healthy! 🎉"
else
    print_warning "Some services may not be fully ready yet. Check logs with: docker compose -f docker-compose.dev.yml logs"
fi

echo ""
echo "🌐 Access your Optimal AppSec Platform:"
echo ""
echo "  📊 Main Portal:        http://localhost:3000"
echo "  🔧 API Gateway:        http://localhost:8000"
echo "  📚 API Documentation:  http://localhost:8000/docs"
echo "  📋 SBOM Service:       http://localhost:8002"
echo "  🛡️  Vuln Service:       http://localhost:8003"
echo "  🔗 GitLab Listener:    http://localhost:8001"
echo "  🤖 Runtime Agent:      http://localhost:8080"
echo "  📈 Prometheus:         http://localhost:9090"
echo "  📊 Grafana:            http://localhost:3001 (admin/admin)"
echo ""

echo "🛠️  Development Commands:"
echo ""
echo "  View logs:              docker compose -f docker-compose.dev.yml logs -f"
echo "  Stop services:          docker compose -f docker-compose.dev.yml down"
echo "  Restart services:       docker compose -f docker-compose.dev.yml restart"
echo "  Rebuild services:       docker compose -f docker-compose.dev.yml up -d --build"
echo "  View specific service:  docker compose -f docker-compose.dev.yml logs -f [service-name]"
echo ""

echo "🧪 Test the Platform:"
echo ""
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Check the dashboard for live data"
echo "  3. View API docs at http://localhost:8000/docs"
echo "  4. Monitor metrics at http://localhost:9090"
echo ""

echo "📝 Next Steps:"
echo ""
echo "  1. Update .env with your GitLab token for full integration"
echo "  2. Configure your GitLab project with the provided CI/CD templates"
echo "  3. Deploy runtime agents to your Kubernetes clusters"
echo "  4. Customize the dashboard for your specific needs"
echo ""

print_status "Development environment setup complete! 🚀"
