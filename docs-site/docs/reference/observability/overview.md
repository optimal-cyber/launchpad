---
sidebar_position: 1
title: Observability Overview
description: Monitoring and logging stack for Optimal Platform
---

# Observability Overview

Optimal Platform includes a comprehensive observability stack for monitoring, logging, and alerting.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OBSERVABILITY STACK                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐           │
│  │   Applications  │   │   Kubernetes    │   │   Infrastructure│           │
│  │   (Services)    │   │   (Nodes/Pods)  │   │   (Cloud)       │           │
│  └────────┬────────┘   └────────┬────────┘   └────────┬────────┘           │
│           │                     │                     │                     │
│           ▼                     ▼                     ▼                     │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         Collection Layer                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │  │
│  │  │  Prometheus │  │  Promtail   │  │   Falco     │                  │  │
│  │  │  (Metrics)  │  │  (Logs)     │  │  (Events)   │                  │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │  │
│  └─────────┼────────────────┼────────────────┼──────────────────────────┘  │
│            │                │                │                              │
│            ▼                ▼                ▼                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         Storage Layer                                 │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │  │
│  │  │  Prometheus │  │    Loki     │  │  Postgres   │                  │  │
│  │  │   (TSDB)    │  │  (Log Store)│  │  (Events)   │                  │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │  │
│  └─────────┼────────────────┼────────────────┼──────────────────────────┘  │
│            │                │                │                              │
│            └────────────────┼────────────────┘                              │
│                             ▼                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                       Visualization Layer                             │  │
│  │                      ┌─────────────────┐                              │  │
│  │                      │     Grafana     │                              │  │
│  │                      │   (Dashboards)  │                              │  │
│  │                      └─────────────────┘                              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components

### Prometheus (Metrics)

Prometheus collects and stores time-series metrics from all platform components.

**Default Scrape Targets:**
- Kubernetes API server
- Kubernetes nodes (kubelet)
- All platform services
- PostgreSQL exporter
- Redis exporter

**Configuration:**
```yaml
prometheus:
  enabled: true
  retention: 15d
  scrapeInterval: 15s
  evaluationInterval: 15s
```

**Key Metrics:**
| Metric | Description |
|--------|-------------|
| `http_requests_total` | Total HTTP requests |
| `http_request_duration_seconds` | Request latency |
| `sbom_scans_total` | Total SBOM scans |
| `vulnerabilities_detected` | Vulnerabilities found |
| `policy_violations_total` | Kyverno policy violations |

### Loki (Logging)

Loki provides log aggregation with Grafana integration.

**Components:**
- **Loki Server**: Log storage and querying
- **Promtail**: Log collection agent (DaemonSet)

**Log Sources:**
- Container logs (`/var/log/pods`)
- Docker daemon logs
- System logs

**Configuration:**
```yaml
loki:
  enabled: true
  persistence:
    enabled: true
    size: 10Gi

promtail:
  enabled: true
  config:
    positions:
      filename: /run/promtail/positions.yaml
```

### Grafana (Visualization)

Grafana provides dashboards for metrics and logs visualization.

**Pre-configured Dashboards:**
- Platform Overview
- Service Health
- Kubernetes Cluster
- Security Events
- Vulnerability Trends

**Data Sources:**
- Prometheus (metrics)
- Loki (logs)

**Access:**
```
URL: https://observability.gooptimal.io
Default credentials: admin / (from secret)
```

## Alerting

### Alert Rules

Optimal Platform includes pre-configured alerts:

**Critical Alerts:**
- Service down (no healthy pods)
- Database connection failure
- High error rate (greater than 5%)
- Certificate expiring (less than 7 days)

**Warning Alerts:**
- High CPU usage (greater than 80%)
- High memory usage (greater than 80%)
- Disk space low (less than 20%)
- High request latency (greater than 1s p99)

### Alert Channels

Configure alert destinations in Grafana:

- Email
- Slack
- PagerDuty
- Webhook

## Accessing Observability

### Grafana Dashboard

```bash
# Port forward for local access
kubectl port-forward svc/grafana 3001:80 -n monitoring

# Access at http://localhost:3001
```

### Prometheus UI

```bash
# Port forward for local access
kubectl port-forward svc/prometheus 9090:9090 -n monitoring

# Access at http://localhost:9090
```

### Querying Logs

Using Grafana Explore or LogCLI:

```bash
# Install LogCLI
brew install grafana/tap/logcli

# Query logs
logcli query '{namespace="optimal-system"}'

# Filter by service
logcli query '{namespace="optimal-system", app="api-gateway"}'

# Search for errors
logcli query '{namespace="optimal-system"} |= "error"'
```

## Resource Requirements

| Component | CPU Request | Memory Request | Storage |
|-----------|-------------|----------------|---------|
| Prometheus | 500m | 1Gi | 50Gi |
| Loki | 250m | 512Mi | 10Gi |
| Promtail | 100m | 128Mi | - |
| Grafana | 250m | 256Mi | 1Gi |
