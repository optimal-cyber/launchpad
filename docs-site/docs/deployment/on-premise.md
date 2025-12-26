---
sidebar_position: 5
title: On-Premise Deployment
description: Deploy Optimal Platform to your own infrastructure
---

# On-Premise Deployment

Deploy Optimal Platform to your own Kubernetes infrastructure for full control over your environment.

## Prerequisites

### Kubernetes Cluster

- Kubernetes 1.27+
- kubectl configured
- Helm 3.x

### Infrastructure Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Control Plane Nodes | 3 | 3 |
| Worker Nodes | 3 | 5+ |
| CPU per Worker | 4 cores | 8 cores |
| RAM per Worker | 16 GB | 32 GB |
| Storage per Worker | 100 GB SSD | 500 GB NVMe |

### Required Components

- **Ingress Controller**: NGINX, Traefik, or HAProxy
- **Storage Provisioner**: Local-path, NFS, Ceph, or Longhorn
- **Load Balancer**: MetalLB or external load balancer
- **DNS**: Internal DNS server or external DNS

## Deployment Steps

### 1. Prepare Cluster

```bash
# Verify cluster is ready
kubectl cluster-info
kubectl get nodes

# Create namespace
kubectl create namespace optimal-system
```

### 2. Install Ingress Controller

If not already installed:

```bash
# NGINX Ingress
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace
```

### 3. Install Storage Provisioner

If not already installed:

```bash
# Longhorn (recommended for bare metal)
helm repo add longhorn https://charts.longhorn.io
helm install longhorn longhorn/longhorn \
  --namespace longhorn-system \
  --create-namespace
```

### 4. Configure Values

Create a custom values file:

```yaml
# values-onprem.yaml
global:
  domain: optimal.internal
  storageClass: longhorn  # or your storage class

ingress:
  enabled: true
  className: nginx
  annotations:
    # Remove cert-manager if using internal certificates
    # cert-manager.io/cluster-issuer: letsencrypt-prod
  tls:
    - secretName: optimal-tls
      hosts:
        - portal.optimal.internal
        - api.optimal.internal

# Use in-cluster databases
postgresql:
  enabled: true
  auth:
    database: optimal
    username: optimal
  primary:
    persistence:
      storageClass: longhorn
      size: 50Gi

redis:
  enabled: true
  architecture: standalone  # or replication
  master:
    persistence:
      storageClass: longhorn
      size: 10Gi

# Observability
prometheus:
  enabled: true
  persistence:
    storageClass: longhorn
    size: 100Gi

grafana:
  enabled: true
  persistence:
    storageClass: longhorn
    size: 10Gi

loki:
  enabled: true
  persistence:
    storageClass: longhorn
    size: 50Gi

# Security
kyverno:
  enabled: true

# Backup (configure with local storage or NFS)
velero:
  enabled: true
  provider: local
  configuration:
    backupStorageLocation:
      bucket: optimal-backups
      config:
        path: /backups
```

### 5. Deploy Platform

```bash
# Add Helm repositories
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Deploy
helm upgrade --install optimal-platform k8s/helm-charts/optimal-platform \
  --namespace optimal-system \
  --create-namespace \
  -f values-onprem.yaml
```

### 6. Configure DNS

Add DNS entries for your services:

```
# Internal DNS or /etc/hosts
192.168.1.100  portal.optimal.internal
192.168.1.100  api.optimal.internal
192.168.1.100  keycloak.optimal.internal
192.168.1.100  grafana.optimal.internal
```

### 7. Configure TLS

Option 1: Self-signed certificates

```bash
# Generate self-signed cert
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout tls.key -out tls.crt \
  -subj "/CN=*.optimal.internal"

# Create secret
kubectl create secret tls optimal-tls \
  --cert=tls.crt \
  --key=tls.key \
  -n optimal-system
```

Option 2: Internal CA

```bash
# Create certificate from internal CA
# ... your CA process ...

kubectl create secret tls optimal-tls \
  --cert=signed.crt \
  --key=private.key \
  -n optimal-system
```

## High Availability

### Database HA

```yaml
postgresql:
  architecture: replication
  readReplicas:
    replicaCount: 2
```

### Pod Distribution

```yaml
portal:
  replicas: 3
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchLabels:
              app: optimal-portal
          topologyKey: kubernetes.io/hostname
```

### External Load Balancer

If using an external load balancer (F5, HAProxy, etc.):

```yaml
ingress:
  enabled: true
  annotations:
    kubernetes.io/ingress.class: external
  # Configure backend servers to point to node ports
```

## Network Configuration

### Network Policies

```yaml
networkPolicies:
  enabled: true
  defaultDeny: true

  # Define allowed traffic
  allowedNamespaces:
    - kube-system
    - ingress-nginx
```

### Proxy Configuration

If behind a corporate proxy:

```yaml
global:
  proxy:
    httpProxy: http://proxy.internal:8080
    httpsProxy: http://proxy.internal:8080
    noProxy: "localhost,127.0.0.1,.internal,.svc"
```

## Air-Gapped Installation

For completely isolated networks, use [Outpost](./outpost/overview) to package and deploy:

```bash
# On connected machine
outpost package create --config outpost.yaml --output optimal-bundle.tar.gz

# Transfer bundle to air-gapped network

# On air-gapped machine
outpost deploy init --bundle optimal-bundle.tar.gz --registry registry.internal:5000
outpost deploy run --bundle optimal-bundle.tar.gz
```

## Maintenance

### Backups

Configure backup location:

```yaml
velero:
  configuration:
    backupStorageLocation:
      bucket: optimal-backups
      config:
        path: /mnt/nfs/backups  # NFS mount
```

Create manual backup:

```bash
velero backup create manual-backup --include-namespaces optimal-system
```

### Updates

```bash
# Update Helm repositories
helm repo update

# Upgrade platform
helm upgrade optimal-platform k8s/helm-charts/optimal-platform \
  --namespace optimal-system \
  -f values-onprem.yaml
```

## Troubleshooting

### Storage Issues

```bash
# Check PVC status
kubectl get pvc -n optimal-system

# Check storage provisioner
kubectl get pods -n longhorn-system
```

### Network Issues

```bash
# Test DNS resolution
kubectl run test --rm -it --image=busybox -- nslookup portal.optimal.internal

# Test service connectivity
kubectl run test --rm -it --image=busybox -- wget -O- http://optimal-portal.optimal-system.svc
```

### Certificate Issues

```bash
# Check certificate
kubectl get secret optimal-tls -n optimal-system -o yaml

# Verify certificate
openssl s_client -connect portal.optimal.internal:443
```
