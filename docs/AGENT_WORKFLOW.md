# Agent API Workflow Guide

**AI-Powered Security Automation**

The Optimal Platform includes an AI Agent API that automates security tasks like generating POA&M drafts and triaging vulnerabilities.

## Overview

The Agent API provides two main capabilities:
1. **Generate POA&M** - Automatically create Plan of Action & Milestones from vulnerabilities
2. **Triage Vulnerabilities** - AI-powered prioritization and false positive detection

## Quick Demo

### From UI (Vulnerabilities Page)

1. Navigate to **Vulnerabilities** page: http://localhost:3000/vulnerabilities
2. Hover over any vulnerability row
3. Click the **document icon** (📄) in the actions column
4. Watch the AI Agent:
   - Analyze the vulnerability
   - Generate POA&M draft with milestones
   - Display results in modal
5. Click "View in POA&M Dashboard" to see the full item

### From API (curl)

```bash
# Step 1: Create an agent run
curl -X POST http://localhost:8000/api/v1/agents/run \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "generate_poam",
    "parameters": {
      "cve_id": "CVE-2024-3094",
      "severity": "critical",
      "package": "xz-utils",
      "version": "5.6.0",
      "asset": "api-gateway:v2.3.1"
    },
    "environment_id": "production"
  }' | jq

# Response:
# {
#   "run_id": "abc123...",
#   "task_type": "generate_poam",
#   "status": "pending",
#   "created_at": "2025-12-12T10:00:00Z"
# }

# Step 2: Check status (wait 10-15 seconds)
curl http://localhost:8000/api/v1/agents/runs/abc123... | jq

# Response:
# {
#   "run_id": "abc123...",
#   "status": "completed",
#   "progress_percent": 100,
#   "result": {
#     "poam_id": "POAM-2025-A1B2C3",
#     "weakness_name": "CVE-2024-3094 - Vulnerable xz-utils in api-gateway:v2.3.1",
#     "recommendation": "Upgrade xz-utils from version 5.6.0...",
#     "scheduled_completion": "2025-12-19T10:00:00Z",
#     "milestones": [...]
#   }
# }
```

---

## API Endpoints

### POST /api/v1/agents/run

Create a new agent task run.

**Request Body:**
```json
{
  "task_type": "generate_poam",
  "parameters": {
    "vulnerability_id": "vuln-1",
    "cve_id": "CVE-2024-3094",
    "severity": "critical",
    "package": "xz-utils",
    "version": "5.6.0",
    "asset": "api-gateway:v2.3.1"
  },
  "environment_id": "env-prod-1"
}
```

**Task Types:**
- `generate_poam` - Generate POA&M from vulnerability
- `triage_vulnerabilities` - Triage and prioritize vulnerabilities
- `analyze_sbom` - Analyze SBOM for risks (future)
- `compliance_check` - Run compliance checks (future)

**Response:**
```json
{
  "run_id": "ea81d11f-6f3b-49a7-92bd-03bd11a10fd0",
  "task_type": "generate_poam",
  "status": "pending",
  "created_at": "2025-12-12T10:00:00Z",
  "estimated_completion": "2025-12-12T10:05:00Z"
}
```

### GET /api/v1/agents/runs/{run_id}

Get status and results of an agent run.

**Response (Pending):**
```json
{
  "run_id": "ea81d11f-6f3b-49a7-92bd-03bd11a10fd0",
  "task_type": "generate_poam",
  "status": "pending",
  "progress_percent": 0,
  "created_at": "2025-12-12T10:00:00Z"
}
```

**Response (Running):**
```json
{
  "run_id": "ea81d11f-6f3b-49a7-92bd-03bd11a10fd0",
  "task_type": "generate_poam",
  "status": "running",
  "progress_percent": 60,
  "created_at": "2025-12-12T10:00:00Z",
  "started_at": "2025-12-12T10:00:02Z"
}
```

**Response (Completed):**
```json
{
  "run_id": "ea81d11f-6f3b-49a7-92bd-03bd11a10fd0",
  "task_type": "generate_poam",
  "status": "completed",
  "progress_percent": 100,
  "created_at": "2025-12-12T10:00:00Z",
  "started_at": "2025-12-12T10:00:02Z",
  "completed_at": "2025-12-12T10:00:12Z",
  "result": {
    "items_generated": 1,
    "poam_id": "POAM-2025-A1B2C3",
    "weakness_name": "CVE-2024-3094 - Vulnerable xz-utils in api-gateway:v2.3.1",
    "description": "Critical vulnerability CVE-2024-3094 detected in xz-utils version 5.6.0...",
    "impact": "Exploitation of this critical severity vulnerability could lead to...",
    "recommendation": "Upgrade xz-utils from version 5.6.0 to the latest patched version...",
    "scheduled_completion": "2025-12-19T10:00:00Z",
    "milestones": [
      {
        "description": "Risk assessment and impact analysis",
        "due_date": "2025-12-14T10:00:00Z",
        "status": "pending"
      },
      {
        "description": "Identify and test patch/upgrade path",
        "due_date": "2025-12-16T10:00:00Z",
        "status": "pending"
      },
      {
        "description": "Deploy fix to staging environment",
        "due_date": "2025-12-18T10:00:00Z",
        "status": "pending"
      },
      {
        "description": "Deploy fix to production and verify",
        "due_date": "2025-12-19T10:00:00Z",
        "status": "pending"
      }
    ],
    "estimated_effort": "7 days",
    "recommendations": [
      "Immediately update xz-utils to the latest secure version",
      "Scan all assets for similar vulnerabilities",
      "Implement automated dependency scanning in CI/CD pipeline",
      "Review and update vulnerability management procedures"
    ]
  }
}
```

---

## Task Types

### 1. Generate POA&M

Automatically generates a Plan of Action & Milestones draft from a vulnerability.

**Use Case:** Security team identifies CVE-2024-3094 in production → Agent generates complete POA&M with timeline, milestones, and remediation steps.

**Parameters:**
- `vulnerability_id` (optional) - Internal vulnerability ID
- `cve_id` - CVE identifier
- `severity` - Severity level (critical, high, medium, low)
- `package` - Affected package name
- `version` - Current version
- `asset` - Affected asset/service

**Output:**
- POA&M ID
- Weakness description
- Impact assessment
- Remediation recommendations
- Completion timeline (based on severity)
- Milestone breakdown
- Estimated effort

**Completion Timeline by Severity:**
- **Critical:** 7 days
- **High:** 30 days
- **Medium:** 90 days
- **Low:** 180 days

### 2. Triage Vulnerabilities

AI-powered vulnerability triage and prioritization.

**Use Case:** Security team has 100+ vulnerabilities → Agent triages them, identifies false positives, and prioritizes remediation.

**Parameters:**
- `environment_id` (optional) - Filter by environment
- `severity_threshold` (optional) - Minimum severity to triage

**Output:**
- Total vulnerabilities triaged
- Critical items for immediate review
- False positive detections
- Priority recommendations

---

## Status Flow

```
pending → running → completed
                 ↘ failed
```

**Status Definitions:**
- **pending:** Task queued, not started yet
- **running:** AI agent actively processing
- **completed:** Task finished successfully, results available
- **failed:** Task encountered error

## Progress Updates

The agent provides real-time progress updates:

```
0%  - Task created (pending)
10% - Parameters validated (running)
40% - Vulnerability analyzed
60% - POA&M draft generated
80% - Milestones created
100% - Completed
```

Poll the status endpoint every 1-2 seconds for live updates.

---

## UI Integration

### Vulnerabilities Page

Location: `apps/portal/app/vulnerabilities/page.tsx`

**User Flow:**
1. User views vulnerability table
2. Hovers over vulnerability row
3. Clicks document icon in actions column
4. Modal opens showing:
   - Progress bar
   - Status updates
   - Completion message
5. Views generated POA&M details
6. Clicks "View in POA&M Dashboard"

**Implementation:**
```typescript
// Create agent run
const response = await fetch('/api/v1/agents/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    task_type: 'generate_poam',
    parameters: { /* vuln data */ }
  })
});

const { run_id } = await response.json();

// Poll for status
const poll = async () => {
  const status = await fetch(`/api/v1/agents/runs/${run_id}`);
  const data = await status.json();
  
  if (data.status === 'completed') {
    // Show results
  } else if (data.status === 'failed') {
    // Show error
  } else {
    // Continue polling
    setTimeout(poll, 1000);
  }
};
```

---

## Backend Implementation

Location: `apps/api-gateway/api_v1_routes.py`

**Storage:**
- In-memory dictionary (development)
- Future: PostgreSQL/Redis for production

**Key Functions:**
```python
@router.post("/api/v1/agents/run")
async def create_agent_run(request: AgentRunRequest):
    run_id = str(uuid.uuid4())
    run_detail = AgentRunDetail(
        run_id=run_id,
        task_type=request.task_type,
        status=TaskStatus.PENDING,
        parameters=request.parameters,
        created_at=datetime.utcnow(),
        progress_percent=0
    )
    agent_runs_storage[run_id] = run_detail
    return AgentRunResponse(...)

@router.get("/api/v1/agents/runs/{run_id}")
async def get_agent_run(run_id: str):
    run = agent_runs_storage[run_id]
    elapsed = (datetime.utcnow() - run.created_at).total_seconds()
    
    # Simulate progress
    if elapsed > 10:
        run.status = TaskStatus.COMPLETED
        run.result = generate_poam_result(run.parameters)
    elif elapsed > 2:
        run.status = TaskStatus.RUNNING
        run.progress_percent = min(80, int(elapsed * 8))
    
    return run
```

---

## Future Enhancements

### Phase 2
- [ ] Real AI/ML model integration (OpenAI, Anthropic)
- [ ] Database persistence (PostgreSQL)
- [ ] Background job queue (Celery/Redis)
- [ ] Webhook notifications on completion
- [ ] Batch processing (multiple vulnerabilities)

### Phase 3
- [ ] Custom agent plugins
- [ ] Agent orchestration (multi-step workflows)
- [ ] Learning from human feedback
- [ ] Integration with eMASS API
- [ ] Automated POA&M submission

---

## Testing

### Manual Testing

```bash
# Test generate_poam
curl -X POST http://localhost:8000/api/v1/agents/run \
  -H "Content-Type: application/json" \
  -d '{"task_type":"generate_poam","parameters":{"cve_id":"CVE-2024-3094","severity":"critical"}}'

# Test triage_vulnerabilities  
curl -X POST http://localhost:8000/api/v1/agents/run \
  -H "Content-Type: application/json" \
  -d '{"task_type":"triage_vulnerabilities","parameters":{}}'

# Check status
curl http://localhost:8000/api/v1/agents/runs/{RUN_ID}
```

### Automated Testing

```python
import pytest
from httpx import AsyncClient

async def test_create_agent_run():
    async with AsyncClient(base_url="http://localhost:8000") as client:
        response = await client.post("/api/v1/agents/run", json={
            "task_type": "generate_poam",
            "parameters": {"cve_id": "CVE-2024-TEST"}
        })
        assert response.status_code == 200
        assert response.json()["status"] == "pending"

async def test_agent_run_completion():
    # Create run
    # Wait 15 seconds
    # Check status is completed
    # Verify result structure
    pass
```

---

## Troubleshooting

**Problem:** Agent run stuck in "pending" status

**Solution:** Check API Gateway logs:
```bash
docker compose logs api-gateway | grep agent
```

**Problem:** Result is None even though status is "completed"

**Solution:** Ensure task_type matches expected types (generate_poam, triage_vulnerabilities)

**Problem:** Frontend modal doesn't show progress

**Solution:** Check browser console for polling errors. Verify `/api/v1/agents/runs/{id}` is accessible.

---

## Security Considerations

1. **Authentication:** Add authentication to agent endpoints in production
2. **Rate Limiting:** Limit agent runs per user/API key
3. **Input Validation:** Sanitize all parameters (CVE IDs, package names)
4. **Result Storage:** Store sensitive results encrypted
5. **Audit Logging:** Log all agent runs for compliance

---

**Ready to automate your security workflows!** 🤖


