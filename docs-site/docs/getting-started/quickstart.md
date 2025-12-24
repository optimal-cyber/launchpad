---
sidebar_position: 3
title: Quick Start
description: Deploy Optimal Platform in 5 minutes
---

# Quick Start

Get Optimal Platform running in minutes with these deployment options.

## Option A: Local Development (Fastest)

Perfect for demos and development on your laptop.

### 1. Clone and Setup

```bash
git clone https://github.com/optimal-platform/optimal-platform.git
cd optimal-platform

# Verify prerequisites
make doctor
```

### 2. Create Kind Cluster

```bash
# Create local Kubernetes cluster with ingress
kind create cluster --name optimal-local --config k8s/kind-config.yaml
```

### 3. Deploy Platform

```bash
# Install dependencies and deploy
make helm-deps
make deploy-local

# Wait for pods to be ready
kubectl get pods -n optimal-system -w
```

### 4. Access Services

```bash
# Port forward for local access
make port-forward
```

| Service | URL | Credentials |
|---------|-----|-------------|
| Portal | http://localhost:3000 | SSO Login |
| API Docs | http://localhost:8000/docs | - |
| Grafana | http://localhost:3001 | admin/admin |
| Keycloak | http://localhost:8080 | admin/(from values) |

---

## Option B: Cloud Deployment (AWS)

### 1. Configure AWS

```bash
# Authenticate
aws configure
# Or: aws sso login --profile your-profile

# Copy configuration
cp infra/terraform/aws/terraform.tfvars.example infra/terraform/aws/terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
aws_region  = "us-east-1"
environment = "development"
domain_name = "yourdomain.com"  # Optional
```

### 2. Deploy Infrastructure

```bash
cd infra/terraform/aws
terraform init
terraform apply  # Takes ~15 minutes
```

### 3. Configure kubectl

```bash
aws eks update-kubeconfig --name optimal-development --region us-east-1
```

### 4. Deploy Platform

```bash
cd ../../..
make helm-deps
helm upgrade --install optimal-platform k8s/helm-charts/optimal-platform \
  --namespace optimal-system \
  --create-namespace \
  -f k8s/helm-charts/optimal-platform/values-development.yaml
```

### 5. Get Access URL

```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

---

## Option C: Cloud Deployment (GCP)

### 1. Configure GCP

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

cp infra/terraform/gcp/terraform.tfvars.example infra/terraform/gcp/terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
project_id  = "your-project-id"
region      = "us-central1"
environment = "development"
```

### 2. Deploy Infrastructure

```bash
cd infra/terraform/gcp
terraform init
terraform apply
```

### 3. Configure kubectl

```bash
gcloud container clusters get-credentials optimal-development --region us-central1
```

### 4. Deploy Platform

```bash
cd ../../..
make helm-deps
helm upgrade --install optimal-platform k8s/helm-charts/optimal-platform \
  --namespace optimal-system \
  --create-namespace \
  -f k8s/helm-charts/optimal-platform/values-development.yaml
```

---

## Option D: Airgap Deployment (Outpost)

For disconnected environments. See [Outpost Deployment](../deployment/outpost/overview) for detailed instructions.

```bash
# On connected machine: Create package
outpost package create --config outpost.yaml --output optimal-bundle.tar.gz

# Transfer to airgap environment
# On disconnected machine: Deploy
outpost deploy --bundle optimal-bundle.tar.gz
```

---

## Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n optimal-system

# Check services
kubectl get svc -n optimal-system

# View logs
kubectl logs -n optimal-system -l app=optimal-portal --tail=50
```

Expected output:
```
NAME                               READY   STATUS    RESTARTS   AGE
optimal-portal-xxx-xxx             1/1     Running   0          5m
optimal-api-gateway-xxx-xxx        1/1     Running   0          5m
optimal-sbom-service-xxx-xxx       1/1     Running   0          5m
optimal-vuln-service-xxx-xxx       1/1     Running   0          5m
```

## Troubleshooting

### Pods not starting?

```bash
kubectl describe pod <pod-name> -n optimal-system
kubectl logs <pod-name> -n optimal-system
```

### Can't connect to services?

```bash
# Check ingress
kubectl get ingress -n optimal-system

# Port forward directly
kubectl port-forward svc/optimal-portal 3000:80 -n optimal-system
```

### Database connection issues?

```bash
# Verify database secret
kubectl get secret optimal-db-credentials -n optimal-system -o yaml

# Test connectivity from pod
kubectl exec -it <api-pod> -n optimal-system -- nc -zv postgresql 5432
```

## Next Steps

- [Architecture Deep Dive](./architecture)
- [Configure SSO](../reference/iam/keycloak)
- [Setup Monitoring](../reference/observability/overview)
- [Deploy to Production](../deployment/cloud/aws)
