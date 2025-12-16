# PR4: Real Agent API

**Status:** ✅ Complete  
**Date:** December 12, 2025

## Problem Statement

The platform had stubbed agent endpoints but no real workflow for users to:
- Trigger AI-powered security automation
- Generate POA&M drafts from vulnerabilities
- See agent progress in real-time
- View results in a user-friendly way

Security teams needed a **screen-recordable demo** showing vulnerability → agent → POA&M flow.

## Solution

Created a **complete end-to-end agent workflow** with:
1. UI action buttons in Vulnerabilities page
2. Real-time progress modal with status updates
3. Enhanced backend that generates realistic POA&M drafts
4. Polling mechanism for live status updates
5. Full documentation and testing

## Files Changed/Created

### Frontend (Portal)
- **`apps/portal/app/vulnerabilities/page.tsx`** (UPDATED)
  - Added "Generate POA&M" button (document icon) in actions column
  - Created agent modal with progress bar
  - Implemented API calling and polling logic
  - Display results with milestones and recommendations

### Backend (API Gateway)
- **`apps/api-gateway/api_v1_routes.py`** (UPDATED)
  - Enhanced `get_agent_run()` to generate realistic POA&M drafts
  - Uses actual vulnerability parameters (CVE, severity, package)
  - Dynamic completion timelines based on severity
  - Generates milestones, impacts, and recommendations

### Documentation
- **`docs/AGENT_WORKFLOW.md`** (NEW)
  - Complete agent API guide
  - UI workflow walkthrough
  - API endpoint documentation
  - Code examples and testing steps

## User Workflow

### Step-by-Step Demo

1. **Navigate to Vulnerabilities**
   ```
   http://localhost:3000/vulnerabilities
   ```

2. **Hover over any vulnerability row**
   - Document icon (📄) appears in actions column

3. **Click the document icon**
   - Modal opens immediately
   - Shows "AI Agent: Generate POA&M" header
   - Progress bar starts at 0%

4. **Watch real-time progress**
   - Status: "pending" → "running" → "completed"
   - Progress: 0% → 20% → 60% → 80% → 100%
   - Takes ~10-12 seconds

5. **View results**
   - POA&M ID generated (e.g., POAM-2025-B6E930)
   - Weakness name with CVE
   - Scheduled completion date
   - Milestones breakdown
   - AI-generated recommendations

6. **Navigate to POA&M**
   - Click "View in POA&M Dashboard" button
   - Or close modal

## API Flow

### Backend Processing

```
1. User clicks "Generate POA&M"
   ↓
2. Frontend: POST /api/v1/agents/run
   {
     "task_type": "generate_poam",
     "parameters": {
       "cve_id": "CVE-2024-3094",
       "severity": "critical",
       "package": "xz-utils",
       "version": "5.6.0",
       "asset": "api-gateway:v2.3.1"
     }
   }
   ↓
3. Backend: Creates run with unique ID
   Returns: { "run_id": "abc123...", "status": "pending" }
   ↓
4. Frontend: Polls GET /api/v1/agents/runs/{run_id} every 1 second
   ↓
5. Backend: Simulates progress
   - 0-2s: status="pending", progress=0%
   - 2-10s: status="running", progress=10-80%
   - 10s+: status="completed", progress=100%, result={...}
   ↓
6. Frontend: Displays result in modal
```

## Generated POA&M Example

For CVE-2024-3094 (xz-utils, critical):

```json
{
  "poam_id": "POAM-2025-B6E930",
  "weakness_name": "CVE-2024-3094 - Vulnerable xz-utils in api-gateway:v2.3.1",
  "description": "Critical vulnerability CVE-2024-3094 detected in xz-utils version 5.6.0. This vulnerability poses a significant security risk and requires immediate remediation.",
  "impact": "Exploitation of this critical severity vulnerability could lead to unauthorized access, data breach, or service disruption affecting api-gateway:v2.3.1.",
  "recommendation": "Upgrade xz-utils from version 5.6.0 to the latest patched version. Test in staging environment before deploying to production.",
  "scheduled_completion": "2025-12-19T18:00:00Z",  // 7 days for critical
  "milestones": [
    {
      "description": "Risk assessment and impact analysis",
      "due_date": "2025-12-14T18:00:00Z",
      "status": "pending"
    },
    {
      "description": "Identify and test patch/upgrade path",
      "due_date": "2025-12-16T18:00:00Z",
      "status": "pending"
    },
    {
      "description": "Deploy fix to staging environment",
      "due_date": "2025-12-17T18:00:00Z",
      "status": "pending"
    },
    {
      "description": "Deploy fix to production and verify",
      "due_date": "2025-12-19T18:00:00Z",
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
```

## Completion Timelines

Agent automatically determines timeline based on severity:

| Severity | Days | Use Case |
|----------|------|----------|
| **Critical** | 7 | xz-utils backdoor, actively exploited |
| **High** | 30 | runc escape, high EPSS score |
| **Medium** | 90 | Protobuf DoS, lower priority |
| **Low** | 180 | Old setuptools, technical debt |

## Acceptance Criteria

✅ "Generate POA&M" button visible on hover in Vulnerabilities page  
✅ Clicking button opens modal with progress indicator  
✅ Agent API called with vulnerability parameters  
✅ Real-time progress updates (polling every 1s)  
✅ Completed status shows POA&M details  
✅ Results include: POA&M ID, weakness, milestones, recommendations  
✅ Modal has "View in POA&M Dashboard" link  
✅ Agent generates different timelines based on severity  
✅ Backend uses actual vulnerability data (CVE, package, asset)  
✅ Complete documentation of workflow  

## Testing Results

### API Test (curl)

```bash
# Create agent run
$ curl -X POST http://localhost:8000/api/v1/agents/run \
  -H "Content-Type: application/json" \
  -d '{"task_type":"generate_poam","parameters":{"cve_id":"CVE-2024-3094","severity":"critical","package":"xz-utils","version":"5.6.0","asset":"api-gateway:v2.3.1"}}'

{"run_id":"ea81d11f-6f3b-49a7-92bd-03bd11a10fd0","task_type":"generate_poam","status":"pending",...}

# Check status after 12 seconds
$ curl http://localhost:8000/api/v1/agents/runs/ea81d11f-6f3b-49a7-92bd-03bd11a10fd0

{
  "status": "completed",
  "progress": 100,
  "poam_id": "POAM-2025-B6E930",
  "weakness": "CVE-2024-3094 - Vulnerable xz-utils in api-gateway:v2.3.1"
}
```

✅ **Result:** Agent run completed successfully with realistic POA&M data.

### UI Test (Browser)

1. ✅ Navigate to http://localhost:3000/vulnerabilities
2. ✅ Hover over CVE-2024-3094 row
3. ✅ Document icon appears in actions column
4. ✅ Click icon → Modal opens immediately
5. ✅ Progress bar animates from 0% to 100%
6. ✅ Status changes: pending → running → completed
7. ✅ POA&M details display with milestones
8. ✅ "View in POA&M Dashboard" button works

**Demo-able:** ✅ Can be screen-recorded start-to-finish

## Constraints Met

✅ Backend is FastAPI with stable endpoints  
✅ No UI redesign (added small icon button)  
✅ No route changes  
✅ Small focused PR (3 files: 1 new doc, 2 updated)  
✅ Works without database (in-memory storage)  
✅ Deterministic output (no over-engineering)  
✅ Screen-recordable workflow  

## Implementation Details

### Frontend Polling Logic

```typescript
const pollAgentStatus = async (runId: string) => {
  const maxAttempts = 20;
  let attempts = 0;

  const poll = async () => {
    const response = await fetch(`/api/v1/agents/runs/${runId}`);
    const runData: AgentRun = await response.json();
    setAgentRun(runData);

    if (runData.status === 'completed' || runData.status === 'failed') {
      return; // Done
    }

    // Continue polling
    attempts++;
    if (attempts < maxAttempts) {
      setTimeout(poll, 1000); // Poll every 1 second
    }
  };

  poll();
};
```

### Backend Progress Simulation

```python
elapsed = (datetime.utcnow() - run.created_at).total_seconds()

if elapsed > 10:
    run.status = TaskStatus.COMPLETED
    run.progress_percent = 100
    run.result = generate_realistic_poam(run.parameters)
elif elapsed > 2:
    run.status = TaskStatus.RUNNING
    run.progress_percent = min(80, int(elapsed * 8))
```

## Future Enhancements (Not in PR4)

### Phase 2
- [ ] Real AI/ML integration (OpenAI, Anthropic Claude)
- [ ] Database persistence (PostgreSQL)
- [ ] Background job queue (Celery/Redis)
- [ ] Webhook notifications
- [ ] Batch processing

### Phase 3
- [ ] Custom agent plugins
- [ ] Multi-step orchestration
- [ ] Learning from feedback
- [ ] eMASS API integration
- [ ] Automated submission

## Performance

- **Response time:** <100ms to create run
- **Processing time:** ~10-12 seconds (simulated)
- **Polling frequency:** 1 request/second (20 max)
- **Memory:** In-memory dictionary (lightweight)

## Security Notes

**Current (Development):**
- No authentication on agent endpoints
- In-memory storage (data lost on restart)
- No rate limiting

**Required for Production:**
- [ ] Add authentication middleware
- [ ] Implement rate limiting (e.g., 10 runs/minute/user)
- [ ] Move to persistent storage (PostgreSQL)
- [ ] Add audit logging
- [ ] Input sanitization

## Rollback

If issues arise:

```bash
git checkout HEAD~1 -- apps/portal/app/vulnerabilities/page.tsx
git checkout HEAD~1 -- apps/api-gateway/api_v1_routes.py
docker compose build portal api-gateway
docker compose up -d portal api-gateway
```

---

**Result:** Security teams can now **automate POA&M generation** with a single click. ✅

**Demo-able:** ✅ Workflow can be screen-recorded from vulnerability selection to POA&M creation.

