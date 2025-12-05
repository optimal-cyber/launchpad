# Optimal Platform - Enterprise Deployment Guide

## Overview

This guide covers deploying Optimal Platform to **AWS (EKS)** or **Google Cloud (GKE)** for enterprise production environments. The deployment is designed to be developer-friendly while maintaining enterprise-grade security and scalability.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Optimal Platform Architecture                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Portal     │    │ API Gateway  │    │   Keycloak   │                  │
│  │  (Next.js)   │───▶│  (FastAPI)   │◀──▶│    (SSO)     │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│         │                   │                                               │
│         │                   ▼                                               │
│         │    ┌──────────────────────────────────────────┐                  │
│         │    │            Microservices                  │                  │
│         │    │  ┌─────────┐ ┌─────────┐ ┌─────────────┐│                  │
│         │    │  │  SBOM   │ │  Vuln   │ │   GitLab    ││                  │
│         │    │  │ Service │ │ Service │ │  Listener   ││                  │
│         │    │  └─────────┘ └─────────┘ └─────────────┘│                  │
│         │    │  ┌─────────┐ ┌─────────────────────────┐│                  │
│         │    │  │ Worker  │ │ Runtime Security Agent  ││                  │
│         │    │  └─────────┘ └─────────────────────────┘│                  │
│         │    └──────────────────────────────────────────┘                  │
│         │                   │                                               │
│         ▼                   ▼                                               │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │                   Data Layer                          │                  │
│  │   ┌───────────┐    ┌───────────┐    ┌───────────┐   │                  │
│  │   │ PostgreSQL│    │   Redis   │    │    S3/    │   │                  │
│  │   │   (RDS/   │    │(ElastiCache│   │   GCS     │   │                  │
│  │   │ CloudSQL) │    │/Memorystore│   │           │   │                  │
│  │   └───────────┘    └───────────┘    └───────────┘   │                  │
│  └──────────────────────────────────────────────────────┘                  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │                   Monitoring                          │                  │
│  │   ┌───────────┐    ┌───────────┐    ┌───────────┐   │                  │
│  │   │Prometheus │───▶│  Grafana  │    │  Alerting │   │                  │
│  │   └───────────┘    └───────────┘    └───────────┘   │                  │
│  └──────────────────────────────────────────────────────┘                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Quick Start (5-Minute Demo Deploy)

### Prerequisites

```bash
# Check all requirements
make doctor
```

Required tools:
- Docker & Docker Compose
- kubectl (v1.28+)
- Helm (v3.13+)
- Terraform (v1.6+)
- AWS CLI or gcloud CLI

### Deploy to AWS

```bash
# 1. Setup (one-time)
make setup

# 2. Configure AWS
export AWS_PROFILE=your-profile
# Edit infra/terraform/aws/terraform.tfvars

# 3. Deploy infrastructure
make CLOUD=aws ENV=development infra-init
make CLOUD=aws ENV=development infra-plan
make CLOUD=aws ENV=development infra-apply

# 4. Deploy application
make deploy-dev-aws
```

### Deploy to GCP

```bash
# 1. Setup (one-time)
make setup

# 2. Configure GCP
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
# Edit infra/terraform/gcp/terraform.tfvars

# 3. Deploy infrastructure
make CLOUD=gcp ENV=development infra-init
make CLOUD=gcp ENV=development infra-plan
make CLOUD=gcp ENV=development infra-apply

# 4. Deploy application
make deploy-dev-gcp
```

## Detailed Deployment Steps

### Step 1: Prepare Your Environment

#### AWS Setup

1. **Create IAM User/Role** with the following permissions:
   - AmazonEKSClusterPolicy
   - AmazonEKSServicePolicy
   - AmazonEC2FullAccess
   - AmazonRDSFullAccess
   - AmazonElastiCacheFullAccess
   - AmazonS3FullAccess
   - AmazonECRFullAccess

2. **Configure AWS CLI**:
   ```bash
   aws configure
   # Or use SSO:
   aws sso login --profile your-profile
   ```

3. **Create S3 bucket for Terraform state**:
   ```bash
   aws s3 mb s3://optimal-platform-terraform-state --region us-east-1
   aws dynamodb create-table \
     --table-name optimal-terraform-locks \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST
   ```

#### GCP Setup

1. **Create Service Account** with roles:
   - Kubernetes Engine Admin
   - Compute Admin
   - Cloud SQL Admin
   - Storage Admin
   - Service Account User

2. **Enable required APIs**:
   ```bash
   gcloud services enable \
     container.googleapis.com \
     compute.googleapis.com \
     sqladmin.googleapis.com \
     redis.googleapis.com \
     secretmanager.googleapis.com \
     artifactregistry.googleapis.com
   ```

3. **Create GCS bucket for Terraform state**:
   ```bash
   gsutil mb gs://optimal-platform-terraform-state
   ```

### Step 2: Configure Terraform Variables

#### AWS Configuration (`infra/terraform/aws/terraform.tfvars`)

```hcl
# General
aws_region  = "us-east-1"
environment = "production"
owner       = "devops-team"

# Kubernetes
kubernetes_version = "1.28"

# Node configuration (production)
system_node_instance_types = ["m5.large"]
system_node_min_size       = 2
system_node_max_size       = 5
system_node_desired_size   = 3

app_node_instance_types = ["m5.xlarge", "m5.2xlarge"]
app_node_min_size       = 3
app_node_max_size       = 20
app_node_desired_size   = 5

# Database
enable_rds                = true
rds_instance_class        = "db.r5.large"
rds_allocated_storage     = 100
rds_max_allocated_storage = 500

# Cache
enable_elasticache    = true
elasticache_node_type = "cache.r5.large"

# Domain
domain_name = "gooptimal.io"
use_route53 = true
```

#### GCP Configuration (`infra/terraform/gcp/terraform.tfvars`)

```hcl
# General
project_id  = "optimal-platform-prod"
region      = "us-central1"
zones       = ["us-central1-a", "us-central1-b", "us-central1-c"]
environment = "production"

# Kubernetes
kubernetes_version = "1.28"

# Node configuration (production)
system_node_machine_type = "e2-standard-4"
system_node_min_count    = 2
system_node_max_count    = 5

app_node_machine_type = "e2-standard-8"
app_node_min_count    = 3
app_node_max_count    = 20

# Database
enable_cloud_sql = true
cloud_sql_tier   = "db-custom-4-15360"
db_password      = "your-secure-password"

# Cache
enable_memorystore   = true
redis_memory_size_gb = 5

# Domain
domain_name = "gooptimal.io"
```

### Step 3: Deploy Infrastructure

```bash
# Initialize Terraform
make CLOUD=aws infra-init
# or
make CLOUD=gcp infra-init

# Plan changes
make CLOUD=aws ENV=production infra-plan

# Apply changes (15-30 minutes)
make CLOUD=aws ENV=production infra-apply

# Get outputs
make CLOUD=aws infra-output
```

### Step 4: Configure Kubernetes Access

```bash
# AWS
make CLOUD=aws ENV=production kubeconfig

# GCP
make CLOUD=gcp ENV=production kubeconfig

# Verify access
kubectl get nodes
```

### Step 5: Deploy the Platform

```bash
# Deploy to production (AWS)
make deploy-prod-aws

# Or deploy to production (GCP)
make deploy-prod-gcp

# Check deployment status
make status
```

### Step 6: Configure DNS

Point your domain to the Load Balancer:

```bash
# Get Load Balancer address
kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

Create DNS records:
- `portal.gooptimal.io` → Load Balancer
- `api.gooptimal.io` → Load Balancer
- `keycloak.gooptimal.io` → Load Balancer
- `observability.gooptimal.io` → Load Balancer

## Environment Management

### Development
- Auto-deploys on push to `develop` branch
- Smaller resource allocation
- Shorter data retention
- No HA requirements

```bash
make deploy-dev-aws   # or deploy-dev-gcp
```

### Staging
- Auto-deploys on push to `main` branch
- Production-like configuration
- Full integration testing

```bash
make deploy-staging-aws   # or deploy-staging-gcp
```

### Production
- Manual approval required
- Deploys on version tags (v1.0.0)
- Full HA with multiple replicas
- Managed databases recommended

```bash
# Create a release tag
git tag v1.0.0
git push origin v1.0.0

# Manual deploy (with confirmation)
make deploy-prod-aws   # or deploy-prod-gcp
```

## CI/CD Pipeline

### GitHub Actions

The pipeline automatically:
1. **Tests** - Runs linting and unit tests
2. **Security Scan** - Trivy vulnerability scanning
3. **Build** - Builds Docker images for all services
4. **Deploy Dev** - Auto-deploys to development on `develop` branch
5. **Deploy Staging** - Auto-deploys to staging on `main` branch
6. **Deploy Production** - Manual deploy on version tags

### Required Secrets

Set these in GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `GCP_SA_KEY` | GCP service account JSON (base64) |

### Manual Deployment

```bash
# Via GitHub Actions UI
# Go to Actions → Deploy Optimal Platform → Run workflow
# Select environment and cloud provider
```

## Monitoring & Operations

### Access Services

```bash
# Port forward for local access
make port-forward

# Access:
# Portal:      http://localhost:3000
# API Gateway: http://localhost:8000
# Grafana:     http://localhost:3001
```

### View Logs

```bash
# All services
make status

# Specific service logs
make logs SERVICE=portal
make logs SERVICE=api-gateway
```

### Shell Access

```bash
make shell SERVICE=portal
```

### Rollback

```bash
# Rollback to previous release
make helm-rollback

# Check history
make helm-history
```

## Security Best Practices

### Network Security
- All pods use Network Policies
- Internal services not exposed externally
- TLS/SSL for all public endpoints

### Authentication
- Keycloak for SSO/OIDC
- Service-to-service authentication via JWT
- Secrets managed via Kubernetes Secrets (or Vault)

### Container Security
- Non-root containers
- Read-only root filesystem where possible
- Resource limits on all containers
- Regular vulnerability scanning

### Data Security
- Encryption at rest (database, S3/GCS)
- Encryption in transit (TLS)
- Regular automated backups

## Cost Optimization

### Development
- Uses spot/preemptible instances
- Single replica services
- Smaller node types
- Auto-shutdown scripts available

### Production
- Right-sized based on actual usage
- Autoscaling configured
- Reserved instances for predictable workloads

### Estimated Monthly Costs

| Environment | AWS | GCP |
|-------------|-----|-----|
| Development | ~$200-400 | ~$150-350 |
| Staging | ~$500-800 | ~$400-700 |
| Production | ~$2,000-5,000+ | ~$1,800-4,500+ |

*Costs vary based on usage and configuration*

## Troubleshooting

### Common Issues

**Pods not starting:**
```bash
kubectl describe pod <pod-name> -n optimal-system
kubectl logs <pod-name> -n optimal-system
```

**Database connection issues:**
```bash
kubectl exec -it <api-pod> -n optimal-system -- nc -zv <db-host> 5432
```

**Certificate issues:**
```bash
kubectl get certificates -n optimal-system
kubectl describe certificate <cert-name> -n optimal-system
```

### Support

- Documentation: https://docs.gooptimal.io
- GitHub Issues: https://github.com/optimal-platform/optimal-platform/issues
- Email: support@gooptimal.io

## Quick Reference

```bash
# Development
make dev                    # Start local Docker environment
make dev-stop              # Stop local environment
make dev-logs              # View local logs

# Infrastructure
make infra-init            # Initialize Terraform
make infra-plan            # Plan changes
make infra-apply           # Apply changes
make infra-destroy         # Destroy infrastructure (DANGER!)

# Deployment
make deploy-dev-aws        # Deploy dev to AWS
make deploy-staging-aws    # Deploy staging to AWS
make deploy-prod-aws       # Deploy production to AWS (manual)
make deploy-dev-gcp        # Deploy dev to GCP
make deploy-staging-gcp    # Deploy staging to GCP
make deploy-prod-gcp       # Deploy production to GCP (manual)

# Operations
make status                # Check deployment status
make logs SERVICE=portal   # View service logs
make shell SERVICE=portal  # Shell into pod
make port-forward          # Forward ports locally
make helm-rollback         # Rollback to previous release

# Utilities
make doctor                # Check system requirements
make version               # Show version info
make clean                 # Clean up build artifacts
```

