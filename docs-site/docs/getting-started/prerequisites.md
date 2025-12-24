---
sidebar_position: 2
title: Prerequisites
description: System requirements and prerequisites for Optimal Platform
---

# Prerequisites

Before deploying Optimal Platform, ensure your environment meets the following requirements.

## Required Tools

| Tool | Minimum Version | Purpose |
|------|----------------|---------|
| Docker | 24.0+ | Container runtime |
| kubectl | 1.28+ | Kubernetes CLI |
| Helm | 3.13+ | Kubernetes package manager |
| Terraform | 1.6+ | Infrastructure as code |

### Cloud-Specific CLIs

Depending on your deployment target:

| Cloud | CLI | Installation |
|-------|-----|--------------|
| AWS | aws-cli | `brew install awscli` |
| GCP | gcloud | `brew install google-cloud-sdk` |
| Azure | az | `brew install azure-cli` |

## Verify Installation

Run the doctor command to verify all prerequisites:

```bash
make doctor
```

Expected output:
```
✓ Docker version 24.0.7
✓ kubectl version v1.29.0
✓ Helm version v3.14.0
✓ Terraform version v1.7.0
✓ All prerequisites met!
```

## Kubernetes Requirements

### Cluster Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Kubernetes Version | 1.27+ | 1.29+ |
| Nodes | 3 | 5+ |
| CPU per node | 4 cores | 8 cores |
| Memory per node | 8 GB | 16 GB |
| Storage | 100 GB | 500 GB |

### Required Cluster Features

- RBAC enabled
- Network Policy support (Calico, Cilium, or similar)
- Storage provisioner (for PersistentVolumeClaims)
- LoadBalancer support (or MetalLB for bare metal)

## Network Requirements

### Outbound Connectivity (Connected Environments)

The following endpoints need to be accessible:

| Endpoint | Purpose |
|----------|---------|
| `ghcr.io` | Container images |
| `charts.bitnami.com` | Helm charts |
| `registry.k8s.io` | Kubernetes images |
| `docker.io` | Docker Hub images |

### Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| 80 | TCP | HTTP ingress |
| 443 | TCP | HTTPS ingress |
| 6443 | TCP | Kubernetes API |
| 10250 | TCP | Kubelet API |

## Airgap Requirements (Outpost)

For disconnected environments using Outpost:

- Outpost CLI installed
- Portable storage device (USB, external drive)
- Local container registry (Harbor, Docker Registry)
- 50+ GB storage for package bundle

See [Outpost Deployment](../deployment/outpost/overview) for details.

## Resource Estimates

### Development Environment

```yaml
# Minimal resources for local development
CPU: 4 cores
Memory: 8 GB
Storage: 50 GB
```

### Production Environment

```yaml
# Recommended for production workloads
Control Plane:
  Nodes: 3
  CPU: 4 cores each
  Memory: 8 GB each

Worker Nodes:
  Nodes: 3-10 (autoscaling)
  CPU: 8 cores each
  Memory: 16 GB each
  Storage: 100 GB SSD each

Database:
  Type: Managed (RDS, CloudSQL, Azure PostgreSQL)
  Size: db.r5.large or equivalent
  Storage: 100 GB (autoscaling)

Cache:
  Type: Managed (ElastiCache, Memorystore, Azure Cache)
  Size: cache.r5.large or equivalent
```

## Next Steps

Once prerequisites are met:

1. [Quick Start](./quickstart) - Deploy your first environment
2. [Architecture](./architecture) - Understand the platform design
