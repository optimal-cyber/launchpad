#!/bin/bash

# Optimal Runtime Security Agent Deployment Script
# Deploys the agent to Kubernetes clusters for real-time security monitoring

set -e

# Configuration
NAMESPACE="optimal-security"
AGENT_IMAGE="optimal/runtime-security-agent:latest"
API_ENDPOINT="${OPTIMAL_API_ENDPOINT:-https://api.optimal-platform.com}"
API_TOKEN="${OPTIMAL_API_TOKEN:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check if kubectl can connect to cluster
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check if API token is provided
    if [ -z "$API_TOKEN" ]; then
        log_error "OPTIMAL_API_TOKEN environment variable is required"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Create namespace
create_namespace() {
    log_info "Creating namespace: $NAMESPACE"
    
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_warning "Namespace $NAMESPACE already exists"
    else
        kubectl create namespace "$NAMESPACE"
        log_success "Namespace $NAMESPACE created"
    fi
}

# Deploy RBAC
deploy_rbac() {
    log_info "Deploying RBAC resources..."
    
    # Update API token in secret
    sed -i.bak "s/b3B0aW1hbC1hcGktdG9rZW4tZXhhbXBsZQ==/$(echo -n "$API_TOKEN" | base64)/g" \
        runtime-security-agent/kubernetes/rbac.yaml
    
    kubectl apply -f runtime-security-agent/kubernetes/rbac.yaml
    log_success "RBAC resources deployed"
}

# Deploy ConfigMap
deploy_config() {
    log_info "Deploying agent configuration..."
    
    # Update API endpoint in config
    sed -i.bak "s|https://api.optimal-platform.com|$API_ENDPOINT|g" \
        runtime-security-agent/kubernetes/configmap.yaml
    
    kubectl apply -f runtime-security-agent/kubernetes/configmap.yaml
    log_success "Configuration deployed"
}

# Deploy DaemonSet
deploy_agent() {
    log_info "Deploying runtime security agent..."
    
    # Update image in DaemonSet
    sed -i.bak "s|optimal/runtime-security-agent:latest|$AGENT_IMAGE|g" \
        runtime-security-agent/kubernetes/daemonset.yaml
    
    kubectl apply -f runtime-security-agent/kubernetes/daemonset.yaml
    log_success "Agent DaemonSet deployed"
}

# Wait for deployment
wait_for_deployment() {
    log_info "Waiting for agent pods to be ready..."
    
    # Wait for DaemonSet to be ready
    kubectl wait --for=condition=ready pod -l app=optimal-security-agent -n "$NAMESPACE" --timeout=300s
    
    # Get pod status
    kubectl get pods -n "$NAMESPACE" -l app=optimal-security-agent
    
    log_success "Agent deployment completed"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check if pods are running
    RUNNING_PODS=$(kubectl get pods -n "$NAMESPACE" -l app=optimal-security-agent --field-selector=status.phase=Running --no-headers | wc -l)
    TOTAL_NODES=$(kubectl get nodes --no-headers | wc -l)
    
    log_info "Running agent pods: $RUNNING_PODS"
    log_info "Total cluster nodes: $TOTAL_NODES"
    
    if [ "$RUNNING_PODS" -eq "$TOTAL_NODES" ]; then
        log_success "All nodes have running agent pods"
    else
        log_warning "Not all nodes have running agent pods"
    fi
    
    # Check agent health
    log_info "Checking agent health..."
    kubectl get pods -n "$NAMESPACE" -l app=optimal-security-agent -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.phase}{"\t"}{.status.containerStatuses[0].ready}{"\n"}{end}'
}

# Show status
show_status() {
    log_info "Deployment Status:"
    echo ""
    echo "Namespace: $NAMESPACE"
    echo "Agent Image: $AGENT_IMAGE"
    echo "API Endpoint: $API_ENDPOINT"
    echo ""
    echo "Pods:"
    kubectl get pods -n "$NAMESPACE" -l app=optimal-security-agent
    echo ""
    echo "DaemonSet:"
    kubectl get daemonset -n "$NAMESPACE" optimal-runtime-security-agent
    echo ""
    echo "To view logs:"
    echo "kubectl logs -n $NAMESPACE -l app=optimal-security-agent -f"
    echo ""
    echo "To check metrics:"
    echo "kubectl port-forward -n $NAMESPACE svc/optimal-security-agent 8080:8080"
    echo "curl http://localhost:8080/metrics"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f runtime-security-agent/kubernetes/*.bak
}

# Main deployment function
main() {
    log_info "Starting Optimal Runtime Security Agent deployment"
    echo ""
    
    check_prerequisites
    create_namespace
    deploy_rbac
    deploy_config
    deploy_agent
    wait_for_deployment
    verify_deployment
    show_status
    cleanup
    
    log_success "Deployment completed successfully!"
    echo ""
    log_info "The runtime security agent is now monitoring your cluster for:"
    echo "  - Container vulnerabilities"
    echo "  - Compliance violations"
    echo "  - Network anomalies"
    echo "  - Behavioral threats"
    echo "  - Real-time security events"
}

# Handle script arguments
case "${1:-deploy}" in
    deploy)
        main
        ;;
    status)
        show_status
        ;;
    logs)
        kubectl logs -n "$NAMESPACE" -l app=optimal-security-agent -f
        ;;
    delete)
        log_info "Deleting Optimal Runtime Security Agent..."
        kubectl delete -f runtime-security-agent/kubernetes/daemonset.yaml
        kubectl delete -f runtime-security-agent/kubernetes/configmap.yaml
        kubectl delete -f runtime-security-agent/kubernetes/rbac.yaml
        kubectl delete namespace "$NAMESPACE"
        log_success "Agent deleted"
        ;;
    *)
        echo "Usage: $0 {deploy|status|logs|delete}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Deploy the runtime security agent (default)"
        echo "  status  - Show deployment status"
        echo "  logs    - View agent logs"
        echo "  delete  - Remove the agent from the cluster"
        exit 1
        ;;
esac
