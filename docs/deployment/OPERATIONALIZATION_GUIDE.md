# Optimal Platform - Operationalization Guide

**Production Deployment Across Cloud Environments**

This guide covers deploying Optimal Platform to production across **Google Cloud Platform (GCP)**, **Amazon Web Services (AWS)**, and **Microsoft Azure**.

---

## Table of Contents

1. [Overview](#overview)
2. [Cloud Architecture Comparison](#cloud-architecture-comparison)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [GCP Deployment (Primary)](#gcp-deployment-primary)
5. [AWS Deployment](#aws-deployment)
6. [Azure Deployment](#azure-deployment)
7. [Multi-Cloud Strategy](#multi-cloud-strategy)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Monitoring & Observability](#monitoring--observability)
10. [Security Hardening](#security-hardening)
11. [Disaster Recovery](#disaster-recovery)
12. [Cost Management](#cost-management)
13. [Operational Runbook](#operational-runbook)

---

## Overview

### Deployment Philosophy

The Optimal Platform uses a **cloud-agnostic Kubernetes-first** approach:

- **Kubernetes (K8s)** as the orchestration layer
- **Helm** for application deployment
- **Terraform** for infrastructure provisioning
- **Cloud-native services** for databases, caching, and storage

### Infrastructure Components

| Component | GCP | AWS | Azure |
|-----------|-----|-----|-------|
| **Kubernetes** | GKE | EKS | AKS |
| **Database** | Cloud SQL (PostgreSQL) | RDS (PostgreSQL) | Azure Database for PostgreSQL |
| **Cache** | Memorystore (Redis) | ElastiCache (Redis) | Azure Cache for Redis |
| **Storage** | Cloud Storage (GCS) | S3 | Azure Blob Storage |
| **Container Registry** | Artifact Registry | ECR | ACR |
| **Secrets** | Secret Manager | Secrets Manager | Key Vault |
| **Monitoring** | Cloud Monitoring | CloudWatch | Azure Monitor |
| **DNS** | Cloud DNS | Route 53 | Azure DNS |

---

## Cloud Architecture Comparison

### Resource Sizing by Environment

| Environment | K8s Nodes | DB Size | Redis | Monthly Cost (Estimated) |
|-------------|-----------|---------|-------|--------------------------|
| **Development** | 3-5 (small) | Small | 1GB | $200-400 |
| **Staging** | 4-8 (medium) | Medium | 2GB | $500-800 |
| **Production** | 6-20+ (large) | Large + HA | 5GB+ | $2,000-5,000+ |

### Kubernetes Node Types

| Cloud | Development | Staging | Production |
|-------|-------------|---------|------------|
| **GCP** | e2-medium | e2-standard-4 | e2-standard-8 |
| **AWS** | m5.large | m5.xlarge | m5.2xlarge |
| **Azure** | Standard_D2s_v5 | Standard_D4s_v5 | Standard_D8s_v5 |

---

## Pre-Deployment Checklist

### Required Tools

```bash
# Verify all tools are installed
make doctor

# Expected output:
# ✅ Docker
# ✅ kubectl
# ✅ Helm
# ✅ Terraform
# ✅ gcloud CLI (for GCP)
# ✅ AWS CLI (for AWS)
# ✅ Azure CLI (for Azure)
```

### Required Permissions

**GCP:**
- Kubernetes Engine Admin
- Compute Admin
- Cloud SQL Admin
- Storage Admin
- Secret Manager Admin

**AWS:**
- AmazonEKSClusterPolicy
- AmazonEC2FullAccess
- AmazonRDSFullAccess
- AmazonS3FullAccess

**Azure:**
- Contributor on Resource Group
- AKS Cluster Admin
- Key Vault Administrator

### DNS & Domain Setup

1. Register domain (e.g., `gooptimal.io`)
2. Create hosted zone in cloud DNS
3. Plan subdomains:
   - `portal.gooptimal.io` - Web UI
   - `api.gooptimal.io` - API Gateway
   - `auth.gooptimal.io` - Keycloak (if used)
   - `grafana.gooptimal.io` - Monitoring

---

## GCP Deployment (Primary)

GCP is the primary deployment target with full-featured Terraform configuration.

### Step 1: Initial Setup

```bash
# Authenticate with GCP
gcloud auth login
gcloud auth application-default login

# Set your project
export GCP_PROJECT="your-project-id"
gcloud config set project $GCP_PROJECT

# Enable required APIs
gcloud services enable \
  container.googleapis.com \
  compute.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com

# Create Terraform state bucket
gsutil mb gs://${GCP_PROJECT}-terraform-state
```

### Step 2: Configure Terraform

```bash
cd infra/terraform/gcp

# Copy and edit variables
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
vim terraform.tfvars
```

**Key variables to set:**

```hcl
# terraform.tfvars
project_id  = "your-project-id"
region      = "us-central1"
environment = "production"
domain_name = "gooptimal.io"

# Database password (use strong password!)
db_password = "STRONG_PASSWORD_HERE"
```

### Step 3: Deploy Infrastructure

```bash
# Initialize Terraform
make CLOUD=gcp infra-init

# Plan changes (review carefully!)
make CLOUD=gcp ENV=production infra-plan

# Apply infrastructure (15-30 minutes)
make CLOUD=gcp ENV=production infra-apply

# Get outputs
make CLOUD=gcp infra-output
```

### Step 4: Configure kubectl

```bash
# Get cluster credentials
make CLOUD=gcp ENV=production kubeconfig

# Verify access
kubectl get nodes
kubectl get namespaces
```

### Step 5: Deploy Application

```bash
# Build and push images
make build
make CLOUD=gcp push

# Deploy with Helm
make deploy-prod-gcp

# Check status
make status
```

### Step 6: Configure DNS

```bash
# Get the Load Balancer IP
kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

# Create DNS records in Cloud DNS:
# - portal.gooptimal.io → [LB_IP]
# - api.gooptimal.io → [LB_IP]
```

---

## AWS Deployment

### Step 1: Initial Setup

```bash
# Configure AWS CLI
aws configure
# Or use SSO:
aws sso login --profile your-profile

export AWS_PROFILE=your-profile
export AWS_REGION=us-east-1

# Create Terraform state bucket and DynamoDB table
aws s3 mb s3://optimal-platform-terraform-state --region $AWS_REGION

aws dynamodb create-table \
  --table-name optimal-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

### Step 2: Configure Terraform

```bash
cd infra/terraform/aws
cp terraform.tfvars.example terraform.tfvars
vim terraform.tfvars
```

**Key variables:**

```hcl
# terraform.tfvars
aws_region  = "us-east-1"
environment = "production"
domain_name = "gooptimal.io"
use_route53 = true
```

### Step 3: Deploy

```bash
make CLOUD=aws infra-init
make CLOUD=aws ENV=production infra-plan
make CLOUD=aws ENV=production infra-apply
make CLOUD=aws ENV=production kubeconfig
make deploy-prod-aws
```

---

## Azure Deployment

### Step 1: Initial Setup

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "Your Subscription Name"

# Create resource group for Terraform state
az group create --name optimal-platform-tfstate --location eastus

# Create storage account for state
az storage account create \
  --name optimalplatformtfstate \
  --resource-group optimal-platform-tfstate \
  --sku Standard_LRS

# Create container
az storage container create \
  --name tfstate \
  --account-name optimalplatformtfstate
```

### Step 2: Configure Terraform

```bash
cd infra/terraform/azure
cp terraform.tfvars.example terraform.tfvars
vim terraform.tfvars
```

**Key variables:**

```hcl
# terraform.tfvars
subscription_id = "00000000-0000-0000-0000-000000000000"
location        = "eastus"
environment     = "production"
db_password     = "STRONG_PASSWORD_HERE"

# Azure AD admin group for cluster access
admin_group_object_ids = ["group-object-id"]
```

### Step 3: Deploy

```bash
make CLOUD=azure infra-init
make CLOUD=azure ENV=production infra-plan
make CLOUD=azure ENV=production infra-apply
make CLOUD=azure ENV=production kubeconfig
make deploy-prod-azure
```

---

## Multi-Cloud Strategy

### When to Use Each Cloud

| Scenario | Recommended Cloud | Reason |
|----------|-------------------|--------|
| **Default/Primary** | GCP | Best Kubernetes experience, cost-effective |
| **AWS-heavy organization** | AWS | Integration with existing AWS services |
| **Azure AD/M365 integration** | Azure | Native Azure AD integration |
| **Government/FedRAMP** | AWS GovCloud or Azure Gov | Compliance requirements |
| **Disaster Recovery** | Different cloud | Geographic/provider diversity |

### Cross-Cloud Considerations

1. **Container Images**: Push to all registries before deployment
2. **Secrets**: Use cloud-native secrets managers (synced via CI/CD)
3. **DNS**: Use a global DNS provider (Cloudflare, etc.) or cloud-native
4. **Monitoring**: Consider cloud-agnostic tools (Prometheus/Grafana)

### Multi-Cloud CI/CD Example

```yaml
# .github/workflows/deploy-multi-cloud.yml
name: Multi-Cloud Deploy

on:
  push:
    tags: ['v*']

jobs:
  deploy:
    strategy:
      matrix:
        cloud: [gcp, aws, azure]
        environment: [production]
    
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to ${{ matrix.cloud }}
        run: |
          make CLOUD=${{ matrix.cloud }} ENV=${{ matrix.environment }} deploy
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

The platform uses GitHub Actions for CI/CD with the following stages:

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Build   │───▶│  Test    │───▶│ Security │───▶│  Deploy  │
│ & Lint   │    │          │    │   Scan   │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `GCP_SA_KEY` | GCP service account key (base64) |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AZURE_CREDENTIALS` | Azure service principal JSON |

### Deployment Triggers

| Branch/Tag | Environment | Auto-Deploy |
|------------|-------------|-------------|
| `develop` | Development | ✅ Yes |
| `main` | Staging | ✅ Yes |
| `v*.*.*` | Production | ❌ Manual |

---

## Monitoring & Observability

### Prometheus + Grafana Stack

The platform deploys with a monitoring stack:

```bash
# Access Grafana locally
kubectl port-forward svc/grafana 3001:80 -n monitoring

# Default credentials: admin / admin
```

### Key Dashboards

1. **Kubernetes Overview** - Node/pod health
2. **Application Metrics** - Request rates, latencies
3. **Database Metrics** - Query performance
4. **Security Metrics** - Vulnerability counts, scan status

### Alerting Rules

| Alert | Threshold | Severity |
|-------|-----------|----------|
| Pod not ready | > 5 minutes | Warning |
| High CPU | > 80% for 5m | Warning |
| High Memory | > 85% for 5m | Warning |
| API errors | > 1% error rate | Critical |
| Database connection failed | Any | Critical |

---

## Security Hardening

### Network Security

- ✅ Private Kubernetes nodes (no public IPs)
- ✅ Network policies enabled
- ✅ Ingress through load balancer only
- ✅ TLS/SSL on all endpoints
- ✅ Private database/Redis endpoints

### Authentication & Authorization

- ✅ OIDC integration (Keycloak/Azure AD)
- ✅ RBAC enabled on Kubernetes
- ✅ Service accounts with least privilege
- ✅ Secrets in cloud secret managers

### Container Security

```bash
# Scan images before deployment
make security-scan
```

- ✅ Non-root containers
- ✅ Read-only root filesystem
- ✅ Resource limits on all pods
- ✅ Image scanning in CI/CD

### Compliance Considerations

| Standard | Supported | Notes |
|----------|-----------|-------|
| SOC 2 | ✅ | Audit logging, access controls |
| FedRAMP | ⚠️ | Requires GovCloud deployment |
| HIPAA | ⚠️ | BAA with cloud provider needed |
| PCI-DSS | ⚠️ | Additional network segmentation |

---

## Disaster Recovery

### Backup Strategy

| Component | Backup Method | Frequency | Retention |
|-----------|---------------|-----------|-----------|
| Database | Automated snapshots | Daily | 30 days |
| Kubernetes | Velero backup | Daily | 14 days |
| Secrets | Vault/Secret Manager | Continuous | N/A |
| Artifacts | Versioned storage | On push | 90 days |

### RTO/RPO Targets

| Environment | RTO | RPO |
|-------------|-----|-----|
| Development | 4 hours | 24 hours |
| Staging | 2 hours | 4 hours |
| Production | 30 minutes | 1 hour |

### Failover Procedure

1. **Detect** - Monitoring alerts on failure
2. **Assess** - Determine scope of outage
3. **Decide** - Manual or automatic failover
4. **Execute** - Switch DNS to backup region/cloud
5. **Verify** - Confirm services operational
6. **Communicate** - Status page update

---

## Cost Management

### Cost Optimization Strategies

1. **Use Spot/Preemptible instances** for non-production
2. **Right-size nodes** based on actual usage
3. **Enable autoscaling** with appropriate limits
4. **Schedule dev/staging** shutdown after hours
5. **Use reserved instances** for production

### Estimated Monthly Costs

| Environment | GCP | AWS | Azure |
|-------------|-----|-----|-------|
| Development | $200-400 | $250-450 | $220-400 |
| Staging | $500-800 | $600-900 | $550-850 |
| Production | $2,000-5,000+ | $2,500-5,500+ | $2,200-5,200+ |

### Cost Monitoring

```bash
# GCP
gcloud billing accounts list

# AWS
aws ce get-cost-and-usage ...

# Azure
az consumption usage list ...
```

---

## Operational Runbook

### Daily Operations

| Time | Task | Command |
|------|------|---------|
| 9:00 AM | Check cluster health | `make status` |
| 9:00 AM | Review alerts | Check Grafana/PagerDuty |
| 5:00 PM | Review deployments | `helm history optimal-platform` |

### Common Tasks

#### Scale Application

```bash
# Scale portal replicas
kubectl scale deployment optimal-portal -n optimal-system --replicas=5

# Or update values and redeploy
helm upgrade optimal-platform ./k8s/helm-charts/optimal-platform \
  --set portal.replicas=5
```

#### View Logs

```bash
# All portal logs
make logs SERVICE=portal

# Specific pod
kubectl logs -f pod/optimal-portal-xxx -n optimal-system
```

#### Restart Service

```bash
# Rolling restart
kubectl rollout restart deployment/optimal-portal -n optimal-system

# Check status
kubectl rollout status deployment/optimal-portal -n optimal-system
```

#### Database Maintenance

```bash
# GCP Cloud SQL
gcloud sql instances restart optimal-production-postgres

# AWS RDS
aws rds reboot-db-instance --db-instance-identifier optimal-production-postgres
```

#### Rollback Deployment

```bash
# View history
make helm-history

# Rollback to previous
make helm-rollback

# Rollback to specific revision
helm rollback optimal-platform 3 -n optimal-system
```

### Incident Response

#### Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| **P1** | Complete outage | 15 minutes | Portal down |
| **P2** | Partial outage | 1 hour | API slow |
| **P3** | Degraded | 4 hours | Single pod crash |
| **P4** | Minor | 24 hours | Log error spike |

#### Incident Checklist

1. [ ] Acknowledge alert
2. [ ] Join incident channel
3. [ ] Assess scope and impact
4. [ ] Implement mitigation (rollback if needed)
5. [ ] Communicate status
6. [ ] Perform root cause analysis
7. [ ] Document in post-mortem

---

## Quick Reference

### Makefile Commands

```bash
# Development
make dev                    # Start local environment
make health                 # Check service health

# Infrastructure
make CLOUD=gcp infra-init   # Initialize Terraform
make CLOUD=gcp infra-plan   # Plan changes
make CLOUD=gcp infra-apply  # Apply changes

# Deployment
make deploy-dev-gcp         # Deploy to GCP dev
make deploy-staging-gcp     # Deploy to GCP staging
make deploy-prod-gcp        # Deploy to GCP production

make deploy-dev-aws         # Deploy to AWS dev
make deploy-prod-aws        # Deploy to AWS production

make deploy-dev-azure       # Deploy to Azure dev
make deploy-prod-azure      # Deploy to Azure production

# Operations
make status                 # Show deployment status
make logs SERVICE=portal    # View service logs
make helm-rollback          # Rollback to previous
```

### Key URLs (Production)

| Service | URL |
|---------|-----|
| Portal | https://portal.gooptimal.io |
| API | https://api.gooptimal.io |
| API Docs | https://api.gooptimal.io/docs |
| Grafana | https://grafana.gooptimal.io |
| Keycloak | https://auth.gooptimal.io |

### Emergency Contacts

| Role | Contact |
|------|---------|
| On-Call Engineer | PagerDuty |
| Platform Team | #optimal-platform (Slack) |
| Security | security@gooptimal.io |

---

## Next Steps

1. **Complete infrastructure setup** for your primary cloud
2. **Configure CI/CD secrets** in GitHub
3. **Set up monitoring alerts** in Grafana/PagerDuty
4. **Document runbooks** for your team
5. **Schedule DR testing** quarterly

---

**Need help?** Check the following resources:

- [Local Development Guide](../LOCAL_DEV_GUIDE.md)
- [API v1 Reference](../API_V1_REFERENCE.md)
- [Agent Workflow Guide](../AGENT_WORKFLOW.md)
- [Enterprise Deployment](./ENTERPRISE_DEPLOYMENT.md)

