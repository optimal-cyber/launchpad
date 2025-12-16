# PR2: Backend API v1 Endpoints

**Status:** ✅ Complete  
**Date:** December 12, 2025

## Problem Statement

The frontend was calling various backend endpoints (`/api/vulnerabilities`, `/api/agents`, `/api/sboms`) and performing client-side aggregation, which:
- Required multiple API calls
- Increased latency
- Performed computation on the client
- Made it harder to maintain consistent data contracts

## Solution

Created a **clean, versioned REST API** at `/api/v1/*` with:
1. Single aggregation endpoint (`/api/v1/metrics`) for all dashboard counts
2. Consistent Pydantic models with proper validation
3. Deterministic seeded data for development
4. Auto-generated OpenAPI documentation
5. Server-side computation for efficiency

## Files Created

### Backend (API Gateway)
- `apps/api-gateway/api_v1_models.py` - Pydantic models for all v1 responses
- `apps/api-gateway/api_v1_routes.py` - All v1 endpoint implementations
- `apps/api-gateway/main.py` - Updated to mount v1 router

### Frontend (Portal)
- `apps/portal/app/api/v1/metrics/route.ts` - Next.js proxy to v1 metrics
- `apps/portal/lib/usePlatformMetrics.ts` - Updated to use `/api/v1/metrics`

### Documentation
- `docs/API_V1_REFERENCE.md` - Complete API reference with curl examples

## API v1 Endpoints

All endpoints return consistent Pydantic models with proper validation.

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Service health check |
| `/api/v1/metrics` | GET | **Aggregated platform metrics** (primary) |
| `/api/v1/environments` | GET | List all environments |
| `/api/v1/environments/{id}` | GET | Environment details |
| `/api/v1/vulnerabilities` | GET | List vulnerabilities (filterable) |
| `/api/v1/sbom` | GET | SBOM components (filterable) |
| `/api/v1/poam` | GET | POA&M items (filterable) |
| `/api/v1/agents/run` | POST | Create agent task run |
| `/api/v1/agents/runs/{id}` | GET | Get agent run status |

### Metrics Endpoint (Primary)

The `/api/v1/metrics` endpoint is the **single source of truth** for all counts:

```bash
curl http://localhost:8000/api/v1/metrics | jq
```

**Returns:**
```json
{
  "vulnerabilities": { "critical": 7, "high": 18, "medium": 24, "low": 7, "total": 56 },
  "agents": { "total": 3, "active": 2, "inactive": 1, "error": 0 },
  "sboms": { "total": 4, "components": 29, "projects": 4 },
  "scans": { "total": 147, "last_24h": 12, "last_scan": "2025-12-12T10:07:00Z" }
}
```

## Seeded Data (Development)

All endpoints return **deterministic seeded data** for development/testing:

- **56 vulnerabilities** (7 critical, 18 high, 24 medium, 7 low)
  - Includes real CVEs: CVE-2024-3094 (xz-utils), CVE-2024-21626 (runc), etc.
  - CVSS scores, EPSS scores, remediation guidance
- **4 environments** (Production, Staging, Development, Production-2)
  - Different health statuses (healthy, warning, critical)
  - Compliance scores (62-96%)
- **29 SBOM components** (Flask, requests, numpy, pandas, fastapi, etc.)
  - Package metadata, licenses, suppliers
- **12 POA&M items** with milestones and remediation plans
- **3 agents** (2 active, 1 inactive)

## Acceptance Criteria

✅ `/api/v1/health` returns service status  
✅ `/api/v1/metrics` returns aggregated platform metrics  
✅ `/api/v1/environments` returns 4 seeded environments  
✅ `/api/v1/vulnerabilities` returns 56 seeded vulnerabilities  
✅ `/api/v1/sbom` returns 29 seeded components  
✅ `/api/v1/poam` returns 12 seeded POA&M items  
✅ `/api/v1/agents/run` creates task and returns run ID  
✅ `/api/v1/agents/runs/{id}` shows task progress/results  
✅ OpenAPI docs auto-generated at `/docs`  
✅ Portal updated to use `/api/v1/metrics`  
✅ All containers build and run successfully  

## Testing

### Backend API
```bash
# Health check
curl http://localhost:8000/api/v1/health | jq

# Metrics (primary endpoint)
curl http://localhost:8000/api/v1/metrics | jq

# Environments
curl http://localhost:8000/api/v1/environments | jq '.total'

# Vulnerabilities
curl http://localhost:8000/api/v1/vulnerabilities | jq '.total'

# SBOM
curl http://localhost:8000/api/v1/sbom | jq '.total'

# POA&M
curl http://localhost:8000/api/v1/poam | jq '.total'

# Agent run (create)
curl -X POST http://localhost:8000/api/v1/agents/run \
  -H "Content-Type: application/json" \
  -d '{"task_type": "generate_poam", "parameters": {}}' | jq

# Agent run (check status after 15 seconds)
curl http://localhost:8000/api/v1/agents/runs/{RUN_ID} | jq
```

### Frontend Integration
```bash
# Portal proxy to metrics
curl http://localhost:3000/api/v1/metrics | jq

# Command Center page
open http://localhost:3000/command-center

# Hub page
open http://localhost:3000/hub
```

### OpenAPI Documentation
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Verification Results

**Backend:**
- ✅ Health: `"healthy"`
- ✅ Metrics: `56 vulnerabilities, 3 agents, 4 SBOMs`
- ✅ Environments: `4 total, first is "Production"`
- ✅ OpenAPI docs: Available at `/docs`

**Frontend:**
- ✅ Command Center: Renders 5 metric cards
- ✅ Hub: Renders with environment data
- ✅ Portal builds: No errors, 26 static pages

## Constraints Met

✅ Backend is FastAPI with stable `/api/v1/*` endpoints  
✅ Single aggregation endpoint (`/metrics`) prevents count mismatches  
✅ Small focused PR (3 new files, 2 updated files)  
✅ Documentation updated (API_V1_REFERENCE.md)  
✅ Minimal tests (manual curl verification)  

## Next Steps (PR3)

**Local dev environment improvements:**
1. Update `docker-compose.yml` for better DX
2. Create `.env.example` and `.env.development`
3. Add `make dev` target for one-command startup
4. Document health check process
5. Ensure Keycloak optional profile works

**PR3 will focus on:** Making local development reproducible with clear setup instructions.

## Database Migration Path (Future)

Currently uses seeded data. To migrate to real database:

```python
# Current (api_v1_routes.py)
vulnerabilities = generate_vulnerabilities()

# Future (with database)
from database import get_db
async def get_vulnerabilities(db = Depends(get_db)):
    return await db.query(Vulnerability).all()
```

## Notes

- Agent runs are stubbed (return pending → running → completed states)
- In production, replace seeded data generators with database queries
- Metrics endpoint caches on client (30-second TTL) to reduce load
- All Pydantic models include validation and examples for OpenAPI

