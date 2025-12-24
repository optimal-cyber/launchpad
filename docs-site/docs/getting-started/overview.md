---
sidebar_position: 1
title: Overview
description: Introduction to Optimal Platform - Enterprise DevSecOps Platform
---

# Optimal Platform Overview

Optimal Platform is an enterprise-grade DevSecOps platform that provides a secure baseline for cloud-native systems. It combines security, compliance, and operational capabilities into a unified deployment package.

## What is Optimal Platform?

Optimal Platform is a collection of integrated applications combined into Kubernetes-native packages that establish a secure foundation for your software delivery pipeline. It provides:

- **Identity & Access Management (IAM)** - Keycloak-based authentication with SSO support
- **Service Mesh** - Traffic management, mTLS, and service-to-service security
- **Observability Stack** - Prometheus, Grafana, and Loki for metrics, dashboards, and logging
- **Runtime Security** - Falco for threat detection and Kyverno for policy enforcement
- **Backup & Restore** - Velero for disaster recovery
- **Airgap Deployment** - Outpost packaging for disconnected environments

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     OPTIMAL PLATFORM (Kubernetes Cluster)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Ingress / Service Mesh                          │   │
│  │    [External Tenant Gateway]  [External Admin Gateway]               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Core Services Layer                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│   │
│  │  │  Keycloak   │  │  Grafana    │  │    Loki     │  │  Prometheus ││   │
│  │  │  (IAM/SSO)  │  │(Dashboards) │  │  (Logging)  │  │  (Metrics)  ││   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Policy & Security Layer                          │   │
│  │  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────────┐ │   │
│  │  │     Kyverno       │  │  Kyverno Policies │  │     Falco       │ │   │
│  │  │  (Policy Engine)  │  │  (Validating/     │  │(Runtime Security│ │   │
│  │  │                   │  │   Mutating)       │  │    Detection)   │ │   │
│  │  └───────────────────┘  └───────────────────┘  └─────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Optimal Application Layer                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│   │
│  │  │   Portal    │  │ API Gateway │  │    SBOM     │  │    Vuln     ││   │
│  │  │ (Next.js)   │  │ (FastAPI)   │  │   Service   │  │   Service   ││   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Data & Backup Layer                              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│   │
│  │  │ PostgreSQL  │  │    Redis    │  │   Velero    │  │  Object     ││   │
│  │  │ (Database)  │  │   (Cache)   │  │  (Backup)   │  │  Storage    ││   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Features

### Security First
- Built-in vulnerability scanning and SBOM management
- Compliance tracking with eMASS integration
- Runtime threat detection with Falco
- Policy enforcement with Kyverno

### Deploy Anywhere
- Cloud deployments (AWS, GCP, Azure)
- On-premise Kubernetes clusters
- Airgap deployments with Outpost packaging
- Local development with Kind

### Observability
- Real-time metrics with Prometheus
- Log aggregation with Loki
- Pre-built Grafana dashboards
- Intelligent alerting

### Enterprise Ready
- Multi-tenant architecture
- SSO with major identity providers
- High availability configurations
- Disaster recovery with Velero

## Getting Started

1. [Check Prerequisites](./prerequisites) - Ensure your environment is ready
2. [Quick Start](./quickstart) - Deploy in 5 minutes
3. [Architecture Deep Dive](./architecture) - Understand the components

## Support

- **Documentation**: https://launchpad.gooptimal.io
- **GitHub Issues**: https://github.com/optimal-platform/optimal-platform/issues
- **Email**: support@gooptimal.io
