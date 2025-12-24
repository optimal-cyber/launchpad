# API v1 Reference Guide

**Base URL:** `http://localhost:8000/api/v1`  
**Documentation:** http://localhost:8000/docs (Swagger UI)

## Overview

API v1 provides a clean, versioned REST API with:
- **Consistent Pydantic models** for type safety
- **Deterministic seeded data** for development/testing
- **Single aggregation endpoint** (`/metrics`) to prevent count mismatches
- **Auto-generated OpenAPI docs**

## Quick Start

### Health Check
```bash
curl http://localhost:8000/api/v1/health | jq
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-12T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "gitlab": "healthy",
    "sbom-service": "healthy",
    "vuln-service": "healthy"
  }
}
```

---

## Metrics (Aggregation Endpoint)

**⭐ Primary endpoint for all dashboard counts**

This endpoint provides a single source of truth for metrics across the platform (Command Center, Hub, sidebar badges).

### `GET /api/v1/metrics`

```bash
curl http://localhost:8000/api/v1/metrics | jq
```

**Response:**
```json
{
  "vulnerabilities": {
    "critical": 7,
    "high": 18,
    "medium": 24,
    "low": 7,
    "info": 0,
    "total": 56
  },
  "agents": {
    "total": 3,
    "active": 2,
    "inactive": 1,
    "error": 0
  },
  "sboms": {
    "total": 4,
    "components": 29,
    "projects": 4
  },
  "scans": {
    "total": 147,
    "last_24h": 12,
    "last_scan": "2025-12-12T10:07:00Z"
  },
  "last_updated": "2025-12-12T10:30:00Z"
}
```

---

## Environments

### `GET /api/v1/environments`

List all environments with their status and metrics.

```bash
curl http://localhost:8000/api/v1/environments | jq
```

**Response:**
```json
{
  "environments": [
    {
      "id": "env-prod-1",
      "name": "Production",
      "project": "flask-container-test",
      "status": "warning",
      "version": "v2.3.1",
      "last_deployed": "2025-12-01T14:32:00Z",
      "vulnerability_count": {
        "critical": 2,
        "high": 8,
        "medium": 24,
        "low": 42,
        "info": 0,
        "total": 76
      },
      "sbom_status": "complete",
      "compliance_score": 87,
      "tags": ["production", "critical", "monitored"]
    }
  ],
  "total": 4
}
```

### `GET /api/v1/environments/{env_id}`

Get detailed information about a specific environment.

```bash
curl http://localhost:8000/api/v1/environments/env-prod-1 | jq
```

**Response:**
```json
{
  "environment": { /* ... environment object ... */ },
  "containers": [
    {
      "name": "api-gateway",
      "status": "running",
      "image": "api-gateway:v2.3.1"
    }
  ],
  "recent_deployments": [
    {
      "id": "deploy-1",
      "version": "v2.3.1",
      "deployed_at": "2025-12-01T14:32:00Z",
      "deployed_by": "ryan.gutwein@optimal.io",
      "status": "success"
    }
  ],
  "active_alerts": []
}
```

---

## Vulnerabilities

### `GET /api/v1/vulnerabilities`

List all vulnerabilities with optional environment filtering.

**Query Parameters:**
- `env_id` (optional): Filter by environment ID

```bash
# Get all vulnerabilities
curl http://localhost:8000/api/v1/vulnerabilities | jq

# Filter by environment
curl "http://localhost:8000/api/v1/vulnerabilities?env_id=env-prod-1" | jq
```

**Response:**
```json
{
  "vulnerabilities": [
    {
      "id": "vuln-1",
      "cve_id": "CVE-2024-3094",
      "title": "xz-utils backdoor",
      "description": "Security vulnerability in xz-utils. xz-utils backdoor",
      "severity": "critical",
      "cvss_score": 9.8,
      "package_name": "xz-utils",
      "package_version": "5.6.0",
      "fixed_version": "5.6.1",
      "environment_id": null,
      "discovered_at": "2025-12-12T10:30:00Z",
      "remediation": "Upgrade xz-utils to version 5.6.1 or later",
      "epss_score": 0.95,
      "exploitable": true,
      "status": "open"
    }
  ],
  "total": 56,
  "filtered_by": null
}
```

---

## SBOM (Software Bill of Materials)

### `GET /api/v1/sbom`

Get SBOM components with optional environment filtering.

**Query Parameters:**
- `env_id` (optional): Filter by environment ID

```bash
# Get all SBOM components
curl http://localhost:8000/api/v1/sbom | jq

# Filter by environment
curl "http://localhost:8000/api/v1/sbom?env_id=env-prod-1" | jq
```

**Response:**
```json
{
  "components": [
    {
      "id": "comp-1",
      "name": "Flask",
      "version": "2.3.3",
      "type": "framework",
      "supplier": "Pallets",
      "license": "MIT",
      "purl": "pkg:pypi/flask@2.3.3",
      "cpe": null,
      "environment_id": null,
      "vulnerabilities": 7
    }
  ],
  "total": 29,
  "environment_id": null,
  "generated_at": "2025-12-12T10:30:00Z"
}
```

---

## POA&M (Plan of Action & Milestones)

### `GET /api/v1/poam`

Get POA&M items with optional environment filtering.

**Query Parameters:**
- `env_id` (optional): Filter by environment ID

```bash
# Get all POA&M items
curl http://localhost:8000/api/v1/poam | jq

# Filter by environment
curl "http://localhost:8000/api/v1/poam?env_id=env-prod-1" | jq
```

**Response:**
```json
{
  "items": [
    {
      "id": "poam-1",
      "weakness_name": "CVE-2024-3094 (xz-utils backdoor)",
      "description": "Backdoor discovered in xz-utils 5.6.0-5.6.1 affecting SSH connections",
      "severity": "critical",
      "impact": "Potential remote code execution via compromised SSH daemon",
      "recommendation": "Immediate upgrade to xz-utils 5.6.2 or rollback to 5.4.x",
      "resources_required": "Security team (2 engineers, 40 hours)",
      "scheduled_completion": "2025-12-19T10:30:00Z",
      "milestones": [
        {
          "description": "Initial assessment and risk analysis",
          "due_date": "2025-12-13T10:30:00Z",
          "completed": true,
          "completed_date": "2025-12-13T09:15:00Z"
        },
        {
          "description": "Implement remediation",
          "due_date": "2025-12-17T10:30:00Z",
          "completed": false,
          "completed_date": null
        }
      ],
      "status": "in_progress",
      "environment_id": null,
      "created_at": "2025-11-12T10:30:00Z",
      "updated_at": "2025-12-07T10:30:00Z"
    }
  ],
  "total": 12,
  "environment_id": null
}
```

---

## Agent Runs

### `POST /api/v1/agents/run`

Create a new agent task run (currently stubbed).

**Request Body:**
```json
{
  "task_type": "generate_poam",
  "parameters": {
    "vulnerability_id": "vuln-1"
  },
  "environment_id": "env-prod-1"
}
```

**Task Types:**
- `triage_vulnerabilities` - Triage and prioritize vulnerabilities
- `generate_poam` - Generate POA&M from vulnerability
- `analyze_sbom` - Analyze SBOM for risks
- `compliance_check` - Run compliance checks

```bash
curl -X POST http://localhost:8000/api/v1/agents/run \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "generate_poam",
    "parameters": {"vulnerability_id": "vuln-1"},
    "environment_id": "env-prod-1"
  }' | jq
```

**Response:**
```json
{
  "run_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "task_type": "generate_poam",
  "status": "pending",
  "created_at": "2025-12-12T10:30:00Z",
  "estimated_completion": "2025-12-12T10:35:00Z"
}
```

### `GET /api/v1/agents/runs/{run_id}`

Get status and results of an agent run.

```bash
curl http://localhost:8000/api/v1/agents/runs/{RUN_ID} | jq
```

**Response (after completion):**
```json
{
  "run_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "task_type": "generate_poam",
  "status": "completed",
  "parameters": {
    "vulnerability_id": "vuln-1"
  },
  "result": {
    "items_generated": 1,
    "poam_id": "poam-generated-1",
    "weakness_name": "Outdated dependencies in production",
    "scheduled_completion": "2026-01-11T10:30:00Z"
  },
  "error": null,
  "created_at": "2025-12-12T10:30:00Z",
  "started_at": "2025-12-12T10:30:02Z",
  "completed_at": "2025-12-12T10:30:12Z",
  "progress_percent": 100
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "detail": "Environment env-invalid not found"
}
```

**HTTP Status Codes:**
- `200` - Success
- `404` - Resource not found
- `500` - Internal server error

---

## Development Notes

### Seeded Data
All endpoints return **deterministic seeded data** for development:
- 56 vulnerabilities (7 critical, 18 high, 24 medium, 7 low)
- 4 environments (prod, staging, dev, prod-2)
- 29 SBOM components
- 12 POA&M items
- 3 agents (2 active, 1 inactive)

### Database Integration (Future)
In production, replace seeded data generators with database queries:
```python
# Current (seeded)
vulnerabilities = generate_vulnerabilities()

# Future (database)
vulnerabilities = await db.query(Vulnerability).all()
```

---

## Interactive Documentation

Visit http://localhost:8000/docs for full Swagger UI with:
- Try-it-out functionality
- Request/response schemas
- Validation rules
- Example payloads


