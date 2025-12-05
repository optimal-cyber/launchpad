# Optimal Platform - Quick Start Guide

## 🚀 Deploy in 5 Minutes

This guide gets you from zero to a running Optimal Platform demo environment.

## Prerequisites

Make sure you have these installed:
- Docker Desktop
- kubectl
- Helm (v3.13+)
- AWS CLI or gcloud CLI
- Terraform (v1.6+)

Check with:
```bash
make doctor
```

---

## Option A: Local Development (Fastest)

Perfect for demos on your laptop:

```bash
# Clone the repo
git clone https://github.com/optimal-platform/optimal-platform.git
cd optimal-platform

# Start everything locally
make dev

# That's it! Access at:
# Portal:      http://localhost:3000
# API Docs:    http://localhost:8000/docs
# Grafana:     http://localhost:3001 (admin/admin)
```

---

## Option B: Deploy to AWS (10 Minutes)

For client demos on real infrastructure:

### 1. Configure AWS

```bash
# Login to AWS
aws configure
# Or: aws sso login --profile your-profile

# Copy and edit config
cp infra/terraform/aws/terraform.tfvars.example infra/terraform/aws/terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
aws_region  = "us-east-1"
environment = "development"
domain_name = ""  # Optional: your domain
```

### 2. Deploy Infrastructure

```bash
# Initialize Terraform
cd infra/terraform/aws
terraform init

# Deploy (takes ~15 minutes)
terraform apply
```

### 3. Deploy Platform

```bash
# Back to root
cd ../../..

# Configure kubectl
aws eks update-kubeconfig --name optimal-development --region us-east-1

# Deploy with Helm
make helm-deps
helm upgrade --install optimal-platform k8s/helm-charts/optimal-platform \
  --namespace optimal-system \
  --create-namespace \
  -f k8s/helm-charts/optimal-platform/values-development.yaml
```

### 4. Access Your Platform

```bash
# Get the Load Balancer URL
kubectl get svc -n ingress-nginx

# Port forward for immediate access
make port-forward

# Access at http://localhost:3000
```

---

## Option C: Deploy to GCP (10 Minutes)

### 1. Configure GCP

```bash
# Login to GCP
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Copy and edit config
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

### 3. Deploy Platform

```bash
cd ../../..

# Configure kubectl
gcloud container clusters get-credentials optimal-development --region us-central1

# Deploy with Helm
make helm-deps
helm upgrade --install optimal-platform k8s/helm-charts/optimal-platform \
  --namespace optimal-system \
  --create-namespace \
  -f k8s/helm-charts/optimal-platform/values-development.yaml
```

---

## 🎯 Demo Flow

Once deployed, here's a suggested demo flow:

### 1. Landing Page
Navigate to `http://localhost:3000` (or your domain)
- Show the modern landing page
- Click "Get Started Free" → SSO login modal

### 2. Launch Pad
After login, you land on the Launch Pad:
- Showcase all integrated tools (GitLab, Harbor, Grafana, etc.)
- Explain the "single pane of glass" concept

### 3. Optimal Hub
Click on "Optimal Hub":
- Show environment overview
- Highlight vulnerability counts
- Demo the compliance scores

### 4. Vulnerabilities
Navigate to Vulnerabilities:
- Show CVE tracking
- Filter by severity
- Show AI-powered recommendations

### 5. SBOM Management
Show Software Bill of Materials:
- Component inventory
- License tracking
- Dependency analysis

### 6. Observability (Grafana)
Access Grafana at port 3001:
- Pre-built dashboards
- Real-time metrics
- Custom alerting

---

## 🛠 Useful Commands

```bash
# Check status
make status

# View logs
make logs SERVICE=portal

# Shell into a container
make shell SERVICE=api-gateway

# Rollback if needed
make helm-rollback

# Clean up
make dev-stop           # Local
terraform destroy       # Cloud
```

---

## 📊 Demo Credentials

| Service | Username | Password |
|---------|----------|----------|
| Portal | Any SSO | Auto-login enabled |
| Grafana | admin | admin |
| Keycloak | admin | (set in values) |

---

## 💡 Tips for Client Demos

1. **Pre-warm the environment** - Deploy 30 minutes before the demo
2. **Use port forwarding** - More reliable than waiting for DNS
3. **Have backup screenshots** - Just in case
4. **Show the code** - Clients love seeing the IaC and Helm charts
5. **Highlight security features** - Network policies, RBAC, encryption

---

## 🆘 Troubleshooting

### Pods not starting?
```bash
kubectl get pods -n optimal-system
kubectl describe pod <pod-name> -n optimal-system
```

### Can't connect to services?
```bash
kubectl get svc -n optimal-system
make port-forward
```

### Need to restart everything?
```bash
make dev-reset  # Local
# Or for cloud:
helm uninstall optimal-platform -n optimal-system
helm upgrade --install optimal-platform ...
```

---

## Next Steps

- Read the full [Enterprise Deployment Guide](./ENTERPRISE_DEPLOYMENT.md)
- Set up your [domain and SSL](./MULTI_DOMAIN_DEPLOYMENT.md)
- Configure [CI/CD pipelines](../.github/workflows/deploy.yml)

Questions? Email support@gooptimal.io

