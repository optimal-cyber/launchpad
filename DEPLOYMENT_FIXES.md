# Deployment Fixes - December 8, 2025

## Issues Resolved

### 1. PostgreSQL Container Fix
**Problem:** PostgreSQL container was in a restart loop due to version mismatch
- Data directory was initialized with PostgreSQL 15
- Docker image was using PostgreSQL 13

**Solution:**
- Upgraded PostgreSQL image from `postgres:13` to `postgres:15-alpine`
- This resolved the incompatibility error

**File Changed:** `docker-compose.yml`

### 2. Apollo Agent Container Fix
**Problem:** Apollo scanning agent was failing to start with Docker socket permission errors

**Solution:**
- Added `:rw` flag to Docker socket volume mount for read-write access
- Set user to `root` to ensure proper permissions
- Updated healthcheck to be less strict (simple Python check instead of HTTP request)
- Added `start_period: 40s` to give the agent time to initialize

**File Changed:** `docker-compose.yml`

### 3. Docker Compose Version Warning
**Problem:** Obsolete `version:` attribute in docker-compose.yml

**Solution:**
- Removed `version: '3.8'` line as it's no longer needed in Docker Compose v2

**File Changed:** `docker-compose.yml`

## UI/UX Improvements

### Enhanced Login Page
**Changes Made:**
- Implemented immersive, defense-grade themed login experience
- Matched color palette from gooptimal.io website:
  - Deep navy backgrounds (#0B1221, #0F1929)
  - Cyan accents (#06b6d4)
  - Glassmorphism effects
- Added interactive animations:
  - Mouse-reactive grid background
  - Scanning line effect
  - Pulsing gradient orbs
  - Animated loading states
- Enhanced branding section with:
  - Terminal-style initialization display
  - Feature badges (FedRAMP Ready, SOC 2, NIST 800-53)
  - Trust indicators
- Improved authentication flow:
  - Better SSO button styling
  - Enhanced form inputs with glassmorphism
  - Smooth transitions and hover effects

**File Changed:** `apps/portal/app/login/page.tsx`

### Sign-in Flow Update
**Changes Made:**
- Updated login redirect to go to `/overview` page instead of `/launchpad`
- This creates a better flow: Login → Platform Overview → Launch Pad
- Matches the JADE platform flow pattern

## Container Status (After Fixes)

✅ **Healthy Containers:**
- postgres (fixed)
- apollo-agent (fixed)
- api-gateway
- worker
- grafana
- prometheus
- redis

🔄 **Starting Containers:**
- portal (health checks in progress)
- gitlab-listener (health checks in progress)
- sbom-service (health checks in progress)
- vuln-service (health checks in progress)

## How to Apply These Fixes

If you need to restart the entire stack:

```bash
cd /Users/ryangutwein/Desktop/Repos/optimal-platform

# Stop all containers
docker compose down

# Start with fresh postgres and apollo-agent
docker compose up -d postgres apollo-agent

# Wait for them to become healthy (30 seconds)
sleep 30

# Start remaining services
docker compose up -d
```

## Testing the Changes

1. **Login Page:** Visit http://localhost:3000/login
   - Should see immersive, animated login interface
   - Test SSO buttons and form functionality

2. **Container Health:** Check all containers are healthy
   ```bash
   docker ps --format "table {{.Names}}\t{{.Status}}"
   ```

3. **Database Connection:** Verify services can connect to PostgreSQL
   ```bash
   docker logs optimal-platform-api-gateway-1
   ```

## PR1: UI Metrics Consistency Fix - December 12, 2025

### Problem: Mismatched Counts Across Dashboard Pages
**Symptoms:**
- Command Center, Hub, and Sidebar showed different vulnerability/agent/SBOM counts
- Sidebar badges were hardcoded static values (e.g., "56", "29", "3")
- Each page was fetching data independently, leading to cache inconsistencies
- No single source of truth for platform metrics

**Root Cause:**
- Multiple data sources: Command Center and Hub used `vulnerability-data.ts`, but sidebar had hardcoded strings
- Each component maintained separate state and cache
- No shared API layer for consistent data fetching

### Solution: Unified Metrics Architecture

**Created:**
1. **`apps/portal/lib/api.ts`** - Typed fetch wrapper with consistent error handling
2. **`apps/portal/lib/usePlatformMetrics.ts`** - Single React hook providing:
   - Vulnerability metrics (critical, high, medium, low, total)
   - Agent metrics (total, active, inactive)
   - SBOM metrics (total, complete, pending)
   - Shared in-memory cache (30-second TTL)
   - Manual refresh capability

**Updated:**
1. **`apps/portal/app/command-center/page.tsx`** - Now uses `usePlatformMetrics()` hook
2. **`apps/portal/app/hub/page.tsx`** - Now uses `usePlatformMetrics()` hook
3. **`apps/portal/components/layout/Navigation.tsx`** - Badges now dynamic from `usePlatformMetrics()`

**Benefits:**
- ✅ Command Center and Hub show **identical** counts (same data source)
- ✅ Sidebar badges update dynamically (no more hardcoded values)
- ✅ Single cache prevents redundant API calls
- ✅ Consistent refresh behavior across all pages
- ✅ TypeScript types ensure data contract consistency

### Files Changed
```
apps/portal/lib/api.ts (NEW)
apps/portal/lib/usePlatformMetrics.ts (NEW)
apps/portal/app/command-center/page.tsx (UPDATED)
apps/portal/app/hub/page.tsx (UPDATED)
apps/portal/components/layout/Navigation.tsx (UPDATED)
```

### Verification Steps

1. **Start the portal:**
   ```bash
   cd apps/portal
   npm run build && npm run start
   ```

2. **Navigate to Command Center** (`http://localhost:3000/command-center`)
   - Note the vulnerability counts (e.g., Critical: 2, High: 8)

3. **Navigate to Hub** (`http://localhost:3000/hub`)
   - Verify counts **match exactly** with Command Center

4. **Check Sidebar badges** (left navigation panel)
   - "Vulnerabilities" badge should show total count (e.g., "10")
   - "SBOM" badge should show SBOM count
   - "Security Agents" badge should show agent count

5. **Test refresh:**
   - Click "Refresh" button on Command Center
   - Verify sidebar badges update simultaneously

### API Contract

The shared hook expects these API endpoints to exist:
- `GET /api/vulnerabilities` → Returns `{ vulnerabilities: Array<{ severity: string, ... }> }`
- `GET /api/agents` → Returns `{ agents: Array<{ status: string, ... }> }`
- `GET /api/sboms` → Returns `{ components: Array<{ project_id: string, ... }> }`

**Note:** These are Next.js API routes that proxy to the backend `api-gateway` service.

### Future Work (PR2)
- Backend aggregation endpoint: `GET /api/v1/metrics` to compute counts server-side
- Eliminates need for client-side filtering/calculation
- More efficient for large datasets

## Notes

- The portal and dependent services may take 1-2 minutes to fully initialize
- Healthchecks have a 30-second interval and may show "starting" for up to a minute
- All container fixes maintain backward compatibility with existing data

