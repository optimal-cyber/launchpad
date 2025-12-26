---
sidebar_position: 2
title: Local Development
description: Deploy Optimal Platform locally with Kind
---

# Local Development

Deploy Optimal Platform to a local Kubernetes cluster using Kind (Kubernetes in Docker) for development and testing.

## Prerequisites

- Docker Desktop (4GB+ RAM allocated)
- kubectl
- Helm 3.x
- Kind
- Make (optional)

## Quick Start

### 1. Create Kind Cluster

```bash
# Create cluster with ingress support
kind create cluster --name optimal-local --config k8s/local/kind-config.yaml
```

The Kind configuration creates:
- 1 control-plane node
- 2 worker nodes
- Port mappings for HTTP (80), HTTPS (443), and services

### 2. Install Dependencies

```bash
# Add Helm repositories
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Install ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for ingress to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s
```

### 3. Deploy Platform

```bash
# Install platform with development values
helm upgrade --install optimal-platform k8s/helm-charts/optimal-platform \
  --namespace optimal-system \
  --create-namespace \
  -f k8s/helm-charts/optimal-platform/values-development.yaml
```

Or using Make:

```bash
make deploy-local
```

### 4. Wait for Pods

```bash
# Watch pod status
kubectl get pods -n optimal-system -w

# Check all pods are running
kubectl get pods -n optimal-system
```

Expected output:
```
NAME                                READY   STATUS    RESTARTS   AGE
optimal-portal-xxx                  1/1     Running   0          2m
optimal-api-gateway-xxx             1/1     Running   0          2m
optimal-sbom-service-xxx            1/1     Running   0          2m
optimal-vuln-service-xxx            1/1     Running   0          2m
postgresql-0                        1/1     Running   0          2m
redis-master-0                      1/1     Running   0          2m
```

## Accessing Services

### Port Forwarding

```bash
# Portal
kubectl port-forward svc/optimal-portal 3000:80 -n optimal-system

# API Gateway
kubectl port-forward svc/optimal-api-gateway 8000:8000 -n optimal-system

# Grafana
kubectl port-forward svc/grafana 3001:80 -n monitoring

# Keycloak
kubectl port-forward svc/keycloak 8080:80 -n keycloak
```

Or use the helper script:

```bash
make port-forward
```

### Service URLs

| Service | URL | Notes |
|---------|-----|-------|
| Portal | http://localhost:3000 | Main web interface |
| API Docs | http://localhost:8000/docs | OpenAPI/Swagger |
| Grafana | http://localhost:3001 | admin/admin |
| Keycloak | http://localhost:8080 | See secrets |

## Configuration

### Development Values

Key settings in `values-development.yaml`:

```yaml
global:
  domain: localhost

portal:
  replicas: 1
  resources:
    limits:
      cpu: 200m
      memory: 256Mi

postgresql:
  primary:
    persistence:
      size: 5Gi

# Disable for local dev
velero:
  enabled: false

networkPolicies:
  enabled: false
```

### Environment Variables

Create a `.env` file for local overrides:

```bash
# Database
DATABASE_URL=postgresql://optimal:optimal@localhost:5432/optimal

# Redis
REDIS_URL=redis://localhost:6379

# Keycloak (optional)
KEYCLOAK_URL=http://localhost:8080
```

## Development Workflow

### Hot Reloading

For frontend development:

```bash
cd apps/portal
npm install
npm run dev
```

For backend development:

```bash
cd apps/api-gateway
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Running Tests

```bash
# Frontend tests
cd apps/portal && npm test

# Backend tests
cd apps/api-gateway && pytest

# Integration tests
make test-integration
```

### Viewing Logs

```bash
# All pods
kubectl logs -n optimal-system -l app.kubernetes.io/part-of=optimal-platform --tail=100 -f

# Specific service
kubectl logs -n optimal-system -l app=api-gateway --tail=100 -f
```

## Cleanup

### Delete Deployment

```bash
helm uninstall optimal-platform -n optimal-system
```

### Delete Cluster

```bash
kind delete cluster --name optimal-local
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n optimal-system

# Check resource constraints
kubectl top nodes
kubectl top pods -n optimal-system
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
kubectl get pods -n optimal-system -l app.kubernetes.io/name=postgresql

# Test connection
kubectl exec -it postgresql-0 -n optimal-system -- psql -U optimal -d optimal -c "SELECT 1"
```

### Ingress Not Working

```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Verify ingress resources
kubectl get ingress -n optimal-system

# Check ingress logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```

## Resource Requirements

Minimum resources for local development:

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 4 cores | 8 cores |
| RAM | 8 GB | 16 GB |
| Disk | 20 GB | 50 GB |
