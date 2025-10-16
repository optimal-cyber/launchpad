#!/bin/bash

echo "🚀 Optimal Platform - Production Deployment Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_warning "kubectl is not installed. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install kubectl
    else
        print_error "Homebrew is not installed. Please install kubectl manually."
        exit 1
    fi
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found. Please create one from env.development"
    exit 1
fi

# Check GitLab token
GITLAB_TOKEN=$(grep GITLAB_TOKEN .env | cut -d'=' -f2)
if [ -z "$GITLAB_TOKEN" ] || [ "$GITLAB_TOKEN" = "your_gitlab_personal_access_token_here" ]; then
    print_error "GitLab token not configured in .env file"
    print_status "Please update GITLAB_TOKEN in your .env file"
    exit 1
fi

print_success "Prerequisites check passed"

# Test GitLab connection
print_status "Testing GitLab connection..."
if curl -s -H "PRIVATE-TOKEN: $GITLAB_TOKEN" "https://gitlab.com/api/v4/user" | grep -q "invalid_token"; then
    print_error "GitLab token is invalid or expired"
    print_status "Please update your GitLab token in the .env file"
    exit 1
fi

print_success "GitLab connection successful"

# Create production namespace
print_status "Creating Kubernetes namespace..."
kubectl create namespace optimal-platform --dry-run=client -o yaml | kubectl apply -f -
print_success "Namespace created/verified"

# Build production images
print_status "Building production images..."

# Build API Gateway
print_status "Building API Gateway..."
docker build -t optimal-platform-api-gateway:latest -f apps/api-gateway/Dockerfile apps/api-gateway/
if [ $? -eq 0 ]; then
    print_success "API Gateway built successfully"
else
    print_error "Failed to build API Gateway"
    exit 1
fi

# Build Portal
print_status "Building Portal..."
docker build -t optimal-platform-portal:latest -f apps/portal/Dockerfile apps/portal/
if [ $? -eq 0 ]; then
    print_success "Portal built successfully"
else
    print_error "Failed to build Portal"
    exit 1
fi

# Build Runtime Agent
print_status "Building Runtime Security Agent..."
docker build -t optimal-platform-runtime-agent:latest -f agents/runtime-security-agent/Dockerfile agents/runtime-security-agent/
if [ $? -eq 0 ]; then
    print_success "Runtime Agent built successfully"
else
    print_error "Failed to build Runtime Agent"
    exit 1
fi

# Create production Docker Compose file
print_status "Creating production Docker Compose configuration..."
cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  # API Gateway
  api-gateway:
    image: optimal-platform-api-gateway:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://optimal:secure_password@postgres:5432/optimal_platform
      - REDIS_URL=redis://redis:6379
      - GITLAB_TOKEN=${GITLAB_TOKEN}
      - GITLAB_BASE_URL=https://gitlab.com
    networks:
      - optimal-network
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Next.js Portal
  portal:
    image: optimal-platform-portal:latest
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE=http://api-gateway:8000
      - NODE_ENV=production
    networks:
      - optimal-network
    depends_on:
      - api-gateway
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  # PostgreSQL Database
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=optimal_platform
      - POSTGRES_USER=optimal
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - optimal-postgres-data:/var/lib/postgresql/data
    networks:
      - optimal-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U optimal"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis Cache
  redis:
    image: redis:7-alpine
    networks:
      - optimal-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Prometheus Monitoring
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - optimal-network
    restart: unless-stopped

  # Grafana Dashboard
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - optimal-network
    restart: unless-stopped

networks:
  optimal-network:
    driver: bridge

volumes:
  optimal-postgres-data:
  grafana-data:
EOF

print_success "Production Docker Compose file created"

# Create Kubernetes manifests
print_status "Creating Kubernetes manifests..."

# Runtime Agent DaemonSet
cat > k8s/runtime-agent-daemonset.yaml << EOF
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: optimal-runtime-agent
  namespace: optimal-platform
  labels:
    app: optimal-runtime-agent
spec:
  selector:
    matchLabels:
      app: optimal-runtime-agent
  template:
    metadata:
      labels:
        app: optimal-runtime-agent
    spec:
      serviceAccountName: optimal-runtime-agent
      containers:
      - name: runtime-agent
        image: optimal-platform-runtime-agent:latest
        env:
        - name: API_GATEWAY_URL
          value: "http://api-gateway.optimal-platform.svc.cluster.local:8000"
        - name: CLUSTER_NAME
          value: "production"
        - name: NODE_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
        securityContext:
          privileged: true
        volumeMounts:
        - name: docker-sock
          mountPath: /var/run/docker.sock
        - name: proc
          mountPath: /host/proc
          readOnly: true
        - name: sys
          mountPath: /host/sys
          readOnly: true
        - name: var-lib-docker
          mountPath: /var/lib/docker
          readOnly: true
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
      volumes:
      - name: docker-sock
        hostPath:
          path: /var/run/docker.sock
      - name: proc
        hostPath:
          path: /proc
      - name: sys
        hostPath:
          path: /sys
      - name: var-lib-docker
        hostPath:
          path: /var/lib/docker
      tolerations:
      - key: node-role.kubernetes.io/master
        operator: Exists
        effect: NoSchedule
      - key: node-role.kubernetes.io/control-plane
        operator: Exists
        effect: NoSchedule
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: optimal-runtime-agent
  namespace: optimal-platform
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: optimal-runtime-agent
rules:
- apiGroups: [""]
  resources: ["nodes", "pods", "services", "endpoints"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "daemonsets", "replicasets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["batch"]
  resources: ["jobs", "cronjobs"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: optimal-runtime-agent
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: optimal-runtime-agent
subjects:
- kind: ServiceAccount
  name: optimal-runtime-agent
  namespace: optimal-platform
EOF

# Create k8s directory if it doesn't exist
mkdir -p k8s

print_success "Kubernetes manifests created"

# Create monitoring configuration
print_status "Creating monitoring configuration..."
mkdir -p monitoring

cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'optimal-platform'
    static_configs:
      - targets: ['api-gateway:8000', 'portal:3000', 'postgres:5432', 'redis:6379']
    metrics_path: /metrics
    scrape_interval: 30s
EOF

print_success "Monitoring configuration created"

# Deploy to Kubernetes (optional)
if [ "$1" = "--k8s" ]; then
    print_status "Deploying to Kubernetes..."
    
    # Apply manifests
    kubectl apply -f k8s/runtime-agent-daemonset.yaml
    
    # Check deployment
    kubectl get pods -n optimal-platform
    kubectl get daemonset -n optimal-platform
    
    print_success "Kubernetes deployment completed"
else
    print_status "Starting production environment with Docker Compose..."
    
    # Stop any existing containers
    docker compose -f docker-compose.prod.yml down
    
    # Start production environment
    docker compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    print_status "Checking service health..."
    
    # Check API Gateway
    if curl -s http://localhost:8000/health | grep -q "healthy"; then
        print_success "API Gateway is healthy"
    else
        print_warning "API Gateway health check failed"
    fi
    
    # Check Portal
    if curl -s http://localhost:3000 | grep -q "Optimal"; then
        print_success "Portal is healthy"
    else
        print_warning "Portal health check failed"
    fi
    
    print_success "Production environment started"
fi

# Display access information
echo ""
echo "🎉 Optimal Platform Production Deployment Complete!"
echo "=================================================="
echo ""
echo "📊 Access URLs:"
echo "  • Portal: http://localhost:3000"
echo "  • API Gateway: http://localhost:8000"
echo "  • Prometheus: http://localhost:9090"
echo "  • Grafana: http://localhost:3001 (admin/admin)"
echo ""
echo "🔧 Management Commands:"
echo "  • View logs: docker compose -f docker-compose.prod.yml logs"
echo "  • Stop services: docker compose -f docker-compose.prod.yml down"
echo "  • Restart services: docker compose -f docker-compose.prod.yml restart"
echo ""
echo "📋 Next Steps:"
echo "  1. Test GitLab integration: python3 test-gitlab-integration.py"
echo "  2. Deploy runtime agents to Kubernetes: ./deploy-production.sh --k8s"
echo "  3. Configure monitoring alerts in Grafana"
echo "  4. Set up backup procedures for the database"
echo ""
echo "🔒 Security Notes:"
echo "  • Change default passwords in production"
echo "  • Set up SSL/TLS certificates"
echo "  • Configure firewall rules"
echo "  • Enable audit logging"
echo ""

print_success "Deployment script completed successfully!"
