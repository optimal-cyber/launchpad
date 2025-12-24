# Outpost - Airgap Deployment Tool

Outpost is Optimal Platform's solution for deploying to disconnected, airgapped, or egress-limited environments. It packages all required components into a portable bundle that can be transferred and deployed without internet connectivity.

## Features

- **Complete Packaging**: Bundles all container images, Helm charts, and manifests
- **SBOM Generation**: Automatic Software Bill of Materials for compliance
- **Offline Deployment**: No internet required after initial packaging
- **Incremental Updates**: Differential bundles to reduce transfer size
- **Image Verification**: Optional cosign signature verification

## Installation

### From Releases

```bash
# Linux (amd64)
curl -LO https://github.com/optimal-platform/optimal-platform/releases/latest/download/outpost-linux-amd64
chmod +x outpost-linux-amd64
sudo mv outpost-linux-amd64 /usr/local/bin/outpost

# macOS (arm64)
curl -LO https://github.com/optimal-platform/optimal-platform/releases/latest/download/outpost-darwin-arm64
chmod +x outpost-darwin-arm64
sudo mv outpost-darwin-arm64 /usr/local/bin/outpost

# Verify installation
outpost version
```

### From Source

```bash
cd tools/outpost
go build -o outpost ./cmd/outpost
sudo mv outpost /usr/local/bin/
```

## Quick Start

### 1. Create a Package (Connected Environment)

```bash
# Navigate to optimal-platform root
cd /path/to/optimal-platform

# Create the airgap bundle
outpost package create \
  --config tools/outpost/outpost.yaml \
  --output optimal-v1.0.0.tar.gz

# Verify the bundle
outpost package verify optimal-v1.0.0.tar.gz

# Inspect contents
outpost package inspect optimal-v1.0.0.tar.gz
```

### 2. Transfer to Airgap Environment

Transfer the bundle using approved methods:
- USB drive
- DVD/Blu-ray
- Secure file transfer
- Data diode

### 3. Deploy (Airgap Environment)

```bash
# Initialize local registry with images
outpost deploy init \
  --bundle optimal-v1.0.0.tar.gz \
  --registry registry.local:5000

# Deploy to Kubernetes cluster
outpost deploy run \
  --bundle optimal-v1.0.0.tar.gz \
  --kubeconfig /path/to/kubeconfig \
  --values custom-values.yaml
```

## Commands

### Package Commands

| Command | Description |
|---------|-------------|
| `outpost package create` | Create a deployment bundle |
| `outpost package verify` | Verify bundle integrity and signatures |
| `outpost package inspect` | View bundle contents |
| `outpost package diff` | Compare two bundles (for incremental updates) |

### Deploy Commands

| Command | Description |
|---------|-------------|
| `outpost deploy init` | Initialize airgap environment (load images to registry) |
| `outpost deploy run` | Deploy platform to Kubernetes |
| `outpost deploy status` | Check deployment status |

### SBOM Commands

| Command | Description |
|---------|-------------|
| `outpost sbom export` | Export SBOM from bundle |
| `outpost sbom scan` | Scan bundle for vulnerabilities |

### Registry Commands

| Command | Description |
|---------|-------------|
| `outpost registry push` | Push images from bundle to registry |
| `outpost registry list` | List images in bundle |

## Configuration

### outpost.yaml

```yaml
apiVersion: outpost.gooptimal.io/v1
kind: OutpostPackage
metadata:
  name: optimal-platform
  version: 1.0.0

spec:
  images:
    - name: portal
      image: ghcr.io/optimal-platform/portal:latest
    # ... more images

  charts:
    - name: optimal-platform
      path: ./k8s/helm-charts/optimal-platform

  sbom:
    enabled: true
    format: spdx-json

  bundle:
    compression: gzip
```

## Bundle Contents

An Outpost bundle contains:

```
optimal-v1.0.0.tar.gz
├── images/                  # Container images (OCI format)
│   ├── portal.tar
│   ├── api-gateway.tar
│   └── ...
├── charts/                  # Helm charts
│   ├── optimal-platform/
│   └── optimal-agent/
├── manifests/               # Kubernetes manifests
│   └── *.yaml
├── sbom/                    # Software Bill of Materials
│   ├── sbom.spdx.json
│   └── sbom.cyclonedx.json
├── checksums.sha256         # File checksums
├── signatures/              # Image signatures (optional)
│   └── *.sig
└── metadata.json            # Bundle metadata
```

## Incremental Updates

Create smaller update bundles that only include changed images:

```bash
# Create differential bundle
outpost package create \
  --config outpost.yaml \
  --base-bundle optimal-v1.0.0.tar.gz \
  --output optimal-v1.0.1-diff.tar.gz
```

## SBOM Generation

Outpost automatically generates SBOMs for compliance:

```bash
# Export SBOM after packaging
outpost sbom export \
  --bundle optimal-v1.0.0.tar.gz \
  --format spdx-json \
  --output sbom.json

# Scan for vulnerabilities (requires grype)
outpost sbom scan --bundle optimal-v1.0.0.tar.gz
```

## Registry Setup

### Using Harbor (Recommended)

```bash
# Push to Harbor
outpost registry push \
  --bundle optimal-v1.0.0.tar.gz \
  --registry https://harbor.internal \
  --project optimal \
  --username admin \
  --password-file /path/to/password
```

### Using Docker Registry

```bash
# Push to simple registry
outpost registry push \
  --bundle optimal-v1.0.0.tar.gz \
  --registry registry.local:5000 \
  --insecure
```

## Security Considerations

1. **Bundle Integrity**: Always verify bundles before deployment
2. **Image Signatures**: Enable signing for production deployments
3. **SBOM Review**: Review SBOMs for known vulnerabilities
4. **Registry Security**: Use TLS and authentication for registries

## Troubleshooting

### Bundle creation fails

```bash
# Check Docker is running
docker info

# Verify images are accessible
docker pull ghcr.io/optimal-platform/portal:latest
```

### Registry push fails

```bash
# Test registry connectivity
curl -v https://registry.local:5000/v2/

# For insecure registries, configure Docker daemon
# /etc/docker/daemon.json
{
  "insecure-registries": ["registry.local:5000"]
}
```

### Deployment fails

```bash
# Check cluster access
kubectl cluster-info

# Verify images in registry
curl https://registry.local:5000/v2/_catalog
```

## Support

- Documentation: https://launchpad.gooptimal.io/docs/deployment/outpost
- Issues: https://github.com/optimal-platform/optimal-platform/issues
- Email: support@gooptimal.io
