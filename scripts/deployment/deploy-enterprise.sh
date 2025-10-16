#!/bin/bash

# Enterprise DevSecOps Platform Deployment Script
# Deploys AI-augmented security platform with multi-cluster support

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_ai() {
    echo -e "${PURPLE}[AI]${NC} $1"
}

# Banner
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    Enterprise DevSecOps Platform                            ║"
echo "║                    AI-Augmented Security Management                         ║"
echo "║                    Multi-Cluster Continuous Scanning                       ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check prerequisites
log_info "Checking prerequisites..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker compose is available
if ! docker compose version > /dev/null 2>&1; then
    log_error "Docker Compose V2 is not available. Please install Docker Desktop and try again."
    exit 1
fi

# Check if kubectl is available (optional)
if command -v kubectl > /dev/null 2>&1; then
    log_info "Kubectl found - Kubernetes deployment will be available"
    KUBECTL_AVAILABLE=true
else
    log_warning "Kubectl not found - Kubernetes deployment will be skipped"
    KUBECTL_AVAILABLE=false
fi

log_success "Prerequisites check completed"

# Create necessary directories
log_info "Creating necessary directories..."
mkdir -p data
mkdir -p logs
mkdir -p kubeconfigs
mkdir -p models
mkdir -p certificates

# Set up environment variables
log_info "Setting up environment variables..."
export GITLAB_TOKEN=${GITLAB_TOKEN:-"glpat-Z-LQhTor-ViRb_K-29mhrW86MQp1OjgwNzcxCw.01.120d9ezlb"}
export NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE:-"http://localhost:8000"}
export APOLLO_AGENT_TOKEN=${APOLLO_AGENT_TOKEN:-"apollo-enterprise-token-$(openssl rand -hex 16)"}

# Create .env file
cat > .env << EOF
# Enterprise DevSecOps Platform Environment Variables
GITLAB_TOKEN=${GITLAB_TOKEN}
NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}
APOLLO_AGENT_TOKEN=${APOLLO_AGENT_TOKEN}

# Database Configuration
POSTGRES_PASSWORD=password
POSTGRES_DB=optimal_platform
POSTGRES_USER=optimal_user

# Redis Configuration
REDIS_URL=redis://redis:6379

# AI Model Configuration
AI_MODELS_ENABLED=true
AI_CONFIDENCE_THRESHOLD=0.8

# Multi-cluster Configuration
CLUSTER_DISCOVERY_ENABLED=true
AUTO_SCALING_ENABLED=true

# Security Configuration
ENCRYPTION_AT_REST=true
ENCRYPTION_IN_TRANSIT=true
AUDIT_LOGGING_ENABLED=true
EOF

log_success "Environment variables configured"

# Deploy the platform
log_info "Deploying Enterprise DevSecOps Platform..."

# Stop any existing containers
log_info "Stopping existing containers..."
docker compose -f docker-compose.apollo.yml down --remove-orphans || true

# Build and start services
log_info "Building and starting enterprise services..."
docker compose -f docker-compose.apollo.yml up -d --build

# Wait for services to be ready
log_info "Waiting for services to be ready..."
sleep 30

# Check service health
log_info "Checking service health..."

# Check API Gateway
if curl -s -f http://localhost:8000/health > /dev/null; then
    log_success "API Gateway is healthy"
else
    log_error "API Gateway is not responding"
fi

# Check Portal
if curl -s -f http://localhost:3000 > /dev/null; then
    log_success "Portal is healthy"
else
    log_error "Portal is not responding"
fi

# Check PostgreSQL
if docker exec optimal-platform-postgres-1 pg_isready -U optimal_user -d optimal_platform > /dev/null 2>&1; then
    log_success "PostgreSQL is healthy"
else
    log_error "PostgreSQL is not responding"
fi

# Check Redis
if docker exec optimal-platform-redis-1 redis-cli ping > /dev/null 2>&1; then
    log_success "Redis is healthy"
else
    log_error "Redis is not responding"
fi

# Deploy Kubernetes DaemonSet (if kubectl is available)
if [ "$KUBECTL_AVAILABLE" = true ]; then
    log_info "Deploying Kubernetes DaemonSet..."
    
    # Create namespace
    kubectl create namespace apollo-system --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply DaemonSet
    kubectl apply -f apps/scanning-agent/kubernetes/apollo-daemonset.yaml
    
    log_success "Kubernetes DaemonSet deployed"
    log_info "Apollo agents will be deployed on all nodes in the cluster"
else
    log_warning "Skipping Kubernetes deployment - kubectl not available"
fi

# Display platform information
echo -e "\n${CYAN}╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                        Platform Information                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}🌐 Web Interfaces:${NC}"
echo "  • Enterprise Dashboard: http://localhost:3000/enterprise"
echo "  • Apollo Dashboard:     http://localhost:3000/apollo"
echo "  • Vulnerabilities:      http://localhost:3000/vulnerabilities"
echo "  • SBOM Management:      http://localhost:3000/sbom"
echo "  • API Documentation:    http://localhost:8000/docs"

echo -e "\n${GREEN}🔧 Services:${NC}"
echo "  • API Gateway:          http://localhost:8000"
echo "  • Portal:               http://localhost:3000"
echo "  • PostgreSQL:           localhost:5432"
echo "  • Redis:                localhost:6379"
echo "  • Prometheus:           http://localhost:9090"
echo "  • Grafana:              http://localhost:3001"

echo -e "\n${GREEN}🤖 AI Features:${NC}"
echo "  • Vulnerability Scoring with AI"
echo "  • Anomaly Detection"
echo "  • Risk Assessment"
echo "  • Attack Vector Prediction"
echo "  • Automated Remediation Guidance"
echo "  • Predictive Analytics"

echo -e "\n${GREEN}🏢 Enterprise Features:${NC}"
echo "  • Multi-cluster Support"
echo "  • Multi-environment Management (prod, staging, preprod, dev)"
echo "  • Kubernetes DaemonSet Agents"
echo "  • Real-time Container Scanning"
echo "  • AI-Enhanced Security Insights"
echo "  • Compliance Management (CIS, NIST, FedRAMP, SOC2)"
echo "  • Automated Reporting"

echo -e "\n${GREEN}🔒 Security Features:${NC}"
echo "  • Continuous Vulnerability Scanning"
echo "  • Container Image Analysis"
echo "  • Runtime Security Monitoring"
echo "  • Network Traffic Analysis"
echo "  • Behavioral Anomaly Detection"
echo "  • Threat Intelligence Integration"

# Display cluster information
if [ "$KUBECTL_AVAILABLE" = true ]; then
    echo -e "\n${GREEN}☸️  Kubernetes Clusters:${NC}"
    kubectl get nodes -o wide 2>/dev/null || echo "  No clusters available"
    echo -e "\n${GREEN}🤖 Apollo Agents:${NC}"
    kubectl get pods -n apollo-system -o wide 2>/dev/null || echo "  No agents deployed"
fi

# Display service status
echo -e "\n${GREEN}📊 Service Status:${NC}"
docker compose -f docker-compose.apollo.yml ps

# Display logs command
echo -e "\n${GREEN}📋 Useful Commands:${NC}"
echo "  • View logs:              docker compose -f docker-compose.apollo.yml logs -f"
echo "  • Stop platform:          docker compose -f docker-compose.apollo.yml down"
echo "  • Restart platform:       docker compose -f docker-compose.apollo.yml restart"
echo "  • View agent logs:        docker compose -f docker-compose.apollo.yml logs apollo-agent"
echo "  • Check API health:       curl http://localhost:8000/health"
echo "  • Check enterprise API:   curl http://localhost:8000/api/enterprise/clusters"

# AI Insights
log_ai "AI models are initializing and will be ready for enhanced security analysis"
log_ai "The platform will automatically discover and scan containers across all environments"
log_ai "AI-powered insights will be generated and displayed in the Enterprise Dashboard"

echo -e "\n${GREEN}✅ Enterprise DevSecOps Platform deployment completed successfully!${NC}"
echo -e "${CYAN}🚀 Your AI-augmented security platform is now running and ready to protect your multi-cluster environment!${NC}\n"









