---
sidebar_position: 1
title: Outpost Overview
description: Airgap deployment with Optimal Outpost
---

# Outpost - Airgap Deployment

Outpost is Optimal Platform's solution for deploying to disconnected, airgapped, or egress-limited environments. It packages all required components into a portable bundle that can be transferred and deployed without internet connectivity.

## What is Outpost?

Outpost enables "airplane mode" for your Optimal Platform deployment. It:

- **Packages everything** - Container images, Helm charts, configurations
- **Generates SBOMs** - Automatic Software Bill of Materials for compliance
- **Works offline** - No internet required after initial packaging
- **Supports updates** - Incremental updates to reduce transfer size

## Use Cases

### Disconnected Environments
- Air-gapped data centers
- Classified networks (IL4/IL5/IL6)
- Submarines, aircraft, spacecraft
- Underground/underwater facilities

### Limited Connectivity
- Remote edge locations
- Intermittent satellite connections
- Bandwidth-constrained environments

### Compliance Requirements
- FedRAMP High environments
- DoD Impact Levels
- Environments requiring known-good software packages

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONNECTED ENVIRONMENT                                │
│                                                                              │
│   ┌───────────────┐    ┌───────────────┐    ┌───────────────┐              │
│   │   Source      │───▶│   Outpost     │───▶│   Bundle      │              │
│   │   Registries  │    │   CLI         │    │   (.tar.gz)   │              │
│   └───────────────┘    └───────────────┘    └───────────────┘              │
│                                                      │                       │
└──────────────────────────────────────────────────────┼───────────────────────┘
                                                       │
                                          Physical Transfer
                                          (USB, DVD, etc.)
                                                       │
┌──────────────────────────────────────────────────────┼───────────────────────┐
│                         AIRGAP ENVIRONMENT           ▼                       │
│                                                                              │
│   ┌───────────────┐    ┌───────────────┐    ┌───────────────┐              │
│   │   Bundle      │───▶│   Outpost     │───▶│   Local       │              │
│   │   (.tar.gz)   │    │   CLI         │    │   Registry    │              │
│   └───────────────┘    └───────────────┘    └───────────────┘              │
│                                                      │                       │
│                                                      ▼                       │
│                                              ┌───────────────┐              │
│                                              │  Kubernetes   │              │
│                                              │   Cluster     │              │
│                                              └───────────────┘              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Bundle Contents

An Outpost bundle contains:

| Component | Description |
|-----------|-------------|
| Container Images | All images required for deployment |
| Helm Charts | Packaged charts with dependencies |
| Manifests | Kubernetes manifests for bootstrap |
| SBOM | Software Bill of Materials (SPDX/CycloneDX) |
| Signatures | Image signatures for verification |
| Checksums | SHA256 checksums for integrity |
| Metadata | Version info, dependencies, requirements |

## Workflow

### 1. Package (Connected Environment)

```bash
# Create bundle on connected machine
outpost package create \
  --config outpost.yaml \
  --output optimal-v1.0.0.tar.gz

# Verify bundle
outpost package verify optimal-v1.0.0.tar.gz

# View contents
outpost package inspect optimal-v1.0.0.tar.gz
```

### 2. Transfer

Transfer the bundle to the airgap environment using approved methods:
- USB drive
- DVD/Blu-ray
- Secure file transfer (if available)
- Data diode

### 3. Deploy (Airgap Environment)

```bash
# Load bundle into local registry
outpost deploy init \
  --bundle optimal-v1.0.0.tar.gz \
  --registry harbor.internal:5000

# Deploy to Kubernetes
outpost deploy run \
  --bundle optimal-v1.0.0.tar.gz \
  --kubeconfig /path/to/kubeconfig
```

## Outpost CLI

### Installation

```bash
# Download for your platform
curl -LO https://github.com/optimal-platform/outpost/releases/latest/download/outpost-linux-amd64
chmod +x outpost-linux-amd64
sudo mv outpost-linux-amd64 /usr/local/bin/outpost

# Verify installation
outpost version
```

### Commands

| Command | Description |
|---------|-------------|
| `outpost package create` | Create a deployment bundle |
| `outpost package verify` | Verify bundle integrity |
| `outpost package inspect` | View bundle contents |
| `outpost package diff` | Compare two bundles |
| `outpost deploy init` | Initialize airgap environment |
| `outpost deploy run` | Deploy to Kubernetes |
| `outpost sbom export` | Export SBOM from bundle |

## Configuration

### outpost.yaml

```yaml
apiVersion: outpost.gooptimal.io/v1
kind: OutpostPackage
metadata:
  name: optimal-platform
  version: 1.0.0

spec:
  # Images to include
  images:
    - ghcr.io/optimal-platform/portal:latest
    - ghcr.io/optimal-platform/api-gateway:latest
    - ghcr.io/optimal-platform/sbom-service:latest
    - ghcr.io/optimal-platform/vuln-service:latest
    - quay.io/keycloak/keycloak:23.0
    - docker.io/bitnami/postgresql:15
    - docker.io/bitnami/redis:7.2
    - grafana/grafana:10.2.0
    - grafana/loki:2.9.0
    - prom/prometheus:v2.47.0
    - velero/velero:v1.12.0
    - ghcr.io/kyverno/kyverno:v1.11.0
    - falcosecurity/falco:0.36.0

  # Helm charts to include
  charts:
    - name: optimal-platform
      path: ./k8s/helm-charts/optimal-platform
    - name: kyverno
      repo: https://kyverno.github.io/kyverno/
      version: 3.1.0
    - name: falco
      repo: https://falcosecurity.github.io/charts
      version: 4.0.0

  # Generate SBOM
  sbom:
    enabled: true
    format: spdx-json  # or cyclonedx-json

  # Sign images
  signing:
    enabled: true
    keyPath: ./cosign.key

  # Compression
  compression: gzip  # or zstd for better compression
```

## Registry Configuration

### Using Harbor (Recommended)

```yaml
# Harbor configuration for airgap
registry:
  type: harbor
  url: https://harbor.internal
  project: optimal
  credentials:
    username: admin
    passwordSecret: harbor-credentials
```

### Using Docker Registry

```yaml
# Simple Docker registry
registry:
  type: docker-registry
  url: https://registry.internal:5000
  insecure: false
```

## SBOM Generation

Outpost automatically generates SBOMs for all packaged images:

```bash
# Export SBOM after packaging
outpost sbom export \
  --bundle optimal-v1.0.0.tar.gz \
  --format spdx-json \
  --output sbom.json

# View vulnerability summary
outpost sbom scan \
  --bundle optimal-v1.0.0.tar.gz
```

## Size Optimization

### Incremental Updates

```bash
# Create differential bundle (only changed images)
outpost package create \
  --config outpost.yaml \
  --base-bundle optimal-v1.0.0.tar.gz \
  --output optimal-v1.0.1-diff.tar.gz
```

### Compression Options

| Format | Compression | Speed | Size |
|--------|-------------|-------|------|
| gzip | Good | Fast | ~40% reduction |
| zstd | Better | Fast | ~50% reduction |
| xz | Best | Slow | ~55% reduction |

## Next Steps

- [Packaging Guide](./packaging) - Create your first bundle
- [Registry Setup](./registry) - Configure airgap registry
- [Deployment Guide](./deployment) - Deploy in airgap environment
