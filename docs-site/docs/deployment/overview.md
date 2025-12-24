---
sidebar_position: 1
title: Deployment Overview
description: Deployment options for Optimal Platform
---

# Deployment Overview

Optimal Platform supports multiple deployment targets to meet your infrastructure requirements.

## Deployment Options

| Option | Best For | Complexity |
|--------|----------|------------|
| [Local (Kind)](#local-development) | Development, demos | Low |
| [Cloud (AWS/GCP/Azure)](#cloud-deployment) | Production, enterprise | Medium |
| [On-Premise](#on-premise) | Private infrastructure | Medium-High |
| [Airgap (Outpost)](#airgap-outpost) | Disconnected environments | High |

## Local Development

Deploy to a local Kind cluster for development and testing.

```bash
# Create cluster
kind create cluster --name optimal-local --config k8s/kind-config.yaml

# Deploy platform
make deploy-local

# Access at http://localhost:3000
```

**Requirements:**
- Docker Desktop
- 8GB RAM minimum
- 20GB disk space

See [Local Development](./local) for details.

## Cloud Deployment

### AWS (EKS)

```bash
# Deploy infrastructure
cd infra/terraform/aws
terraform init && terraform apply

# Deploy platform
make deploy-prod-aws
```

**Features:**
- EKS managed Kubernetes
- RDS PostgreSQL
- ElastiCache Redis
- S3 storage
- Route53 DNS

See [AWS Deployment](./cloud/aws) for details.

### GCP (GKE)

```bash
# Deploy infrastructure
cd infra/terraform/gcp
terraform init && terraform apply

# Deploy platform
make deploy-prod-gcp
```

**Features:**
- GKE Autopilot or Standard
- CloudSQL PostgreSQL
- Memorystore Redis
- Cloud Storage
- Cloud DNS

See [GCP Deployment](./cloud/gcp) for details.

### Azure (AKS)

```bash
# Deploy infrastructure
cd infra/terraform/azure
terraform init && terraform apply

# Deploy platform
make deploy-prod-azure
```

**Features:**
- AKS managed Kubernetes
- Azure PostgreSQL
- Azure Cache for Redis
- Blob Storage
- Azure DNS

See [Azure Deployment](./cloud/azure) for details.

## On-Premise

Deploy to your own Kubernetes cluster.

**Requirements:**
- Kubernetes 1.27+
- Storage provisioner
- LoadBalancer (or MetalLB)
- DNS resolution

```bash
# Configure kubeconfig
export KUBECONFIG=/path/to/kubeconfig

# Deploy with Helm
helm upgrade --install optimal-platform k8s/helm-charts/optimal-platform \
  --namespace optimal-system \
  --create-namespace \
  -f values-production.yaml
```

See [On-Premise Deployment](./on-premise) for details.

## Airgap (Outpost)

For disconnected environments without internet access.

### Package Creation (Connected)

```bash
# Create bundle with all dependencies
outpost package create \
  --config outpost.yaml \
  --output optimal-v1.0.0.tar.gz
```

### Deployment (Disconnected)

```bash
# Load into local registry
outpost deploy init --bundle optimal-v1.0.0.tar.gz

# Deploy to cluster
outpost deploy run --bundle optimal-v1.0.0.tar.gz
```

See [Outpost Overview](./outpost/overview) for details.

## Architecture Comparison

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT ARCHITECTURES                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LOCAL (Kind)                    CLOUD (AWS/GCP/Azure)                      │
│  ┌─────────────────┐            ┌─────────────────────────────────────┐    │
│  │ Single Node     │            │  Multi-AZ / Region                  │    │
│  │ Docker          │            │  Managed Services                   │    │
│  │ Local Storage   │            │  Auto-scaling                       │    │
│  │ Port Forwarding │            │  Load Balancer                      │    │
│  └─────────────────┘            └─────────────────────────────────────┘    │
│                                                                              │
│  ON-PREMISE                      AIRGAP (Outpost)                           │
│  ┌─────────────────┐            ┌─────────────────────────────────────┐    │
│  │ Your K8s        │            │  Bundled Dependencies               │    │
│  │ Your Storage    │            │  Local Registry                     │    │
│  │ Your Network    │            │  No Internet Required               │    │
│  │ Full Control    │            │  SBOM Included                      │    │
│  └─────────────────┘            └─────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Resource Requirements

### Minimum (Development)

| Resource | Requirement |
|----------|-------------|
| Nodes | 1 |
| CPU | 4 cores |
| Memory | 8 GB |
| Storage | 50 GB |

### Recommended (Production)

| Resource | Requirement |
|----------|-------------|
| Nodes | 3+ (HA) |
| CPU | 8 cores per node |
| Memory | 16 GB per node |
| Storage | 100 GB SSD per node |

### Enterprise (High Availability)

| Resource | Requirement |
|----------|-------------|
| Control Plane | 3 nodes |
| Worker Nodes | 5-20 (auto-scaling) |
| CPU | 16 cores per worker |
| Memory | 32 GB per worker |
| Storage | 500 GB NVMe per node |

## Next Steps

Choose your deployment path:

- [Local Development](./local) - Start developing locally
- [Cloud Deployment](./cloud/aws) - Deploy to AWS, GCP, or Azure
- [On-Premise](./on-premise) - Deploy to your infrastructure
- [Outpost](./outpost/overview) - Airgap deployment
