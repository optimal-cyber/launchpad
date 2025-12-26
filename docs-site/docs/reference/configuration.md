---
sidebar_position: 2
title: Configuration Reference
description: Complete configuration options for Optimal Platform
---

# Configuration Reference

This page documents all configuration options for Optimal Platform components.

## Environment Variables

### Portal (Frontend)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE` | API Gateway URL | `http://localhost:8000` |
| `NEXT_PUBLIC_KEYCLOAK_URL` | Keycloak server URL | `https://keycloak.gooptimal.io` |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | Keycloak realm | `optimal` |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | OIDC client ID | `optimal-portal` |

### API Gateway

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `KEYCLOAK_URL` | Keycloak server URL | - |
| `SBOM_SERVICE_URL` | SBOM service endpoint | `http://sbom-service:8001` |
| `VULN_SERVICE_URL` | Vulnerability service endpoint | `http://vuln-service:8002` |

### Services

#### SBOM Service

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | - |
| `REDIS_URL` | Redis connection | - |
| `STORAGE_BACKEND` | Storage type (s3, gcs, local) | `local` |

#### Vulnerability Service

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | - |
| `NVD_API_KEY` | NIST NVD API key (optional) | - |
| `SCAN_INTERVAL` | Default scan interval (seconds) | `3600` |

## Helm Values

### Core Platform Settings

```yaml
# values.yaml
global:
  domain: gooptimal.io
  storageClass: standard

portal:
  replicas: 2
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 100m
      memory: 256Mi

apiGateway:
  replicas: 2
  resources:
    limits:
      cpu: 1000m
      memory: 1Gi
    requests:
      cpu: 200m
      memory: 512Mi
```

### Database Configuration

```yaml
postgresql:
  enabled: true
  auth:
    database: optimal
    username: optimal
    existingSecret: optimal-db-credentials
  primary:
    persistence:
      size: 20Gi
  metrics:
    enabled: true
```

### Redis Configuration

```yaml
redis:
  enabled: true
  architecture: replication
  auth:
    enabled: true
    existingSecret: optimal-redis-credentials
  master:
    persistence:
      size: 5Gi
  replica:
    replicaCount: 1
    persistence:
      size: 5Gi
```

### Ingress Configuration

```yaml
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: portal.gooptimal.io
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: portal-tls
      hosts:
        - portal.gooptimal.io
```

### Multi-Tenancy Configuration

```yaml
multiTenancy:
  enabled: true
  database:
    isolation: database  # database or schema
    autoProvisioning: true
    nameTemplate: "optimal_tenant_{TenantID}"
    connectionPool: 10
  keycloak:
    autoProvisionRealm: true
    realmTemplate: "optimal-{TenantID}"
  subdomain:
    enabled: true
    baseDomain: gooptimal.io
```

## Security Configuration

### Kyverno Policies

```yaml
kyverno:
  enabled: true
  policies:
    podSecurity:
      enabled: true
      level: restricted  # baseline, restricted
    resourceLimits:
      enabled: true
    imageRegistry:
      enabled: true
      allowedRegistries:
        - ghcr.io/optimal-platform/*
        - docker.io/bitnami/*
        - quay.io/*
```

### Network Policies

```yaml
networkPolicies:
  enabled: true
  defaultDeny: true
```

## Observability Configuration

### Prometheus

```yaml
prometheus:
  enabled: true
  retention: 15d
  resources:
    limits:
      cpu: 1000m
      memory: 2Gi
```

### Grafana

```yaml
grafana:
  enabled: true
  ingress:
    enabled: true
    hosts:
      - observability.gooptimal.io
```

### Loki

```yaml
loki:
  enabled: true
  persistence:
    size: 10Gi
```

## Backup Configuration

### Velero

```yaml
velero:
  enabled: true
  provider: aws  # aws, gcp, azure
  bucket: optimal-backups
  schedules:
    daily:
      schedule: "0 2 * * *"
      ttl: 168h  # 7 days
    weekly:
      schedule: "0 3 * * 0"
      ttl: 720h  # 30 days
```

## Agent Configuration

### Optimal Agent (Tenant-Side)

```yaml
# optimal-agent values.yaml
agent:
  platformUrl: https://api.gooptimal.io
  apiKey: ""  # Set via secret

  scanning:
    enabled: true
    interval: 3600
    severityThreshold: medium

  runtime:
    enabled: true

  compliance:
    enabled: true
    frameworks:
      - nist-800-53
      - cis-kubernetes
```
