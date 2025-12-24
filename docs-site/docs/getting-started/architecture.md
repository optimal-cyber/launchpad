---
sidebar_position: 4
title: Architecture
description: Deep dive into Optimal Platform architecture
---

# Architecture Overview

Optimal Platform follows a layered architecture designed for security, scalability, and operational flexibility.

## Namespace Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          KUBERNETES CLUSTER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         INGRESS LAYER                                 │  │
│  │   ingress-nginx          Handles external traffic routing             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────┼───────────────────────────────────┐  │
│  │                         CORE SERVICES                                 │  │
│  │                                                                       │  │
│  │   keycloak              Identity & Access Management (SSO/OIDC)       │  │
│  │   monitoring            Prometheus, Grafana, Alertmanager             │  │
│  │   logging               Loki for centralized logging                  │  │
│  │   velero                Backup and disaster recovery                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────┼───────────────────────────────────┐  │
│  │                      SECURITY & POLICY                                │  │
│  │                                                                       │  │
│  │   kyverno               Policy engine (validating/mutating webhooks)  │  │
│  │   falco                 Runtime security & threat detection           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────┼───────────────────────────────────┐  │
│  │                      APPLICATION LAYER                                │  │
│  │                                                                       │  │
│  │   optimal-system        Portal, API Gateway, Services                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────┼───────────────────────────────────┐  │
│  │                         DATA LAYER                                    │  │
│  │                                                                       │  │
│  │   PostgreSQL            Primary database                              │  │
│  │   Redis                 Caching and session storage                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Details

### Ingress Layer

| Component | Purpose | Technology |
|-----------|---------|------------|
| Ingress Controller | Route external traffic | NGINX Ingress |
| TLS Termination | SSL/TLS certificates | cert-manager |
| Rate Limiting | DDoS protection | NGINX annotations |

### Core Services

#### Identity & Access Management
- **Keycloak**: Enterprise SSO with OIDC/SAML support
- **Realm per tenant**: Multi-tenant isolation
- **Identity providers**: Google, Azure AD, Okta, LDAP

#### Observability Stack
- **Prometheus**: Metrics collection and storage
- **Grafana**: Dashboards and visualization
- **Loki**: Log aggregation
- **Alertmanager**: Alert routing and notification

#### Backup & Recovery
- **Velero**: Kubernetes-native backup
- **Scheduled backups**: Automated daily/weekly
- **Disaster recovery**: Cross-region restore capability

### Security Layer

#### Kyverno Policy Engine
```yaml
# Example: Require resource limits
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-limits
spec:
  validationFailureAction: Enforce
  rules:
    - name: require-cpu-memory-limits
      match:
        resources:
          kinds:
            - Pod
      validate:
        message: "CPU and memory limits are required"
        pattern:
          spec:
            containers:
              - resources:
                  limits:
                    memory: "?*"
                    cpu: "?*"
```

#### Falco Runtime Security
- Syscall monitoring
- Container escape detection
- Cryptomining detection
- Anomalous network activity alerts

### Application Layer

```
┌─────────────────────────────────────────────────────────────────┐
│                    optimal-system namespace                      │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Portal     │───▶│ API Gateway  │───▶│   Services   │      │
│  │  (Next.js)   │    │  (FastAPI)   │    │              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                             │                    │               │
│                             ▼                    ▼               │
│                      ┌─────────────────────────────────┐        │
│                      │        Microservices            │        │
│                      │  ┌────────┐  ┌────────┐        │        │
│                      │  │  SBOM  │  │  Vuln  │        │        │
│                      │  │Service │  │Service │        │        │
│                      │  └────────┘  └────────┘        │        │
│                      └─────────────────────────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Authentication Flow

```
User → Portal → Keycloak → Identity Provider (Google/Azure/Okta)
                    ↓
              JWT Token
                    ↓
Portal ← API Gateway ← Validated Request
```

### Scan Ingestion Flow

```
GitLab CI/CD → Webhook → API Gateway → SBOM Service → PostgreSQL
                              ↓
                        Vuln Service → NVD Enrichment
                              ↓
                        Notification → Alerting
```

### Metrics Flow

```
Pods → Prometheus (scrape) → Grafana (visualize)
                ↓
         Alertmanager → Slack/Email/PagerDuty
```

### Logging Flow

```
Pods → Loki (aggregate) → Grafana (query)
              ↓
       Long-term Storage (S3/GCS)
```

## High Availability

### Control Plane HA

```yaml
# Production configuration
apiGateway:
  replicaCount: 3
  podAntiAffinity: required

portal:
  replicaCount: 3
  podAntiAffinity: required

# Pod Disruption Budget
pdb:
  minAvailable: 2
```

### Database HA

- **Cloud Managed**: RDS Multi-AZ, CloudSQL HA, Azure PostgreSQL
- **Self-Managed**: PostgreSQL with Patroni for automatic failover

### Cross-Region DR

```
Primary Region (us-east-1)          DR Region (us-west-2)
┌─────────────────────┐            ┌─────────────────────┐
│  Active Cluster     │───Velero──▶│  Standby Cluster    │
│  Primary Database   │───Replica─▶│  Read Replica       │
└─────────────────────┘            └─────────────────────┘
```

## Network Security

### Network Policies

All namespaces implement deny-by-default network policies:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

### Service Mesh (Optional)

For enhanced security, Istio can be deployed for:
- Mutual TLS between services
- Fine-grained authorization policies
- Traffic management and observability

## Airgap Architecture (Outpost)

For disconnected environments:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AIRGAP ENVIRONMENT                            │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Outpost    │───▶│    Local     │───▶│  Kubernetes  │      │
│  │   Bundle     │    │   Registry   │    │   Cluster    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                  │
│  Bundle contains:                                                │
│  - All container images                                          │
│  - Helm charts                                                   │
│  - SBOM for compliance                                           │
│  - Deployment manifests                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Next Steps

- [Quick Start](./quickstart) - Deploy your first environment
- [Security Reference](../reference/security/overview) - Deep dive into security
- [Outpost Deployment](../deployment/outpost/overview) - Airgap deployment guide
