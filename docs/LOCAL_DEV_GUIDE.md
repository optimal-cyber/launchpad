# Local Development Guide

**Quick Start:** Get the Optimal Platform running on your machine in under 5 minutes.

## Prerequisites

- **Docker** (20.10+ with Compose V2)
- **Make** (optional but recommended)
- **curl** (for health checks)
- **8GB RAM** minimum (16GB recommended)
- **20GB disk space**

### Check Prerequisites

```bash
docker --version          # Should be 20.10+
docker compose version    # Should be v2.x
make --version           # Optional but helpful
```

---

## Quick Start (Recommended)

### 1. Copy Environment File

```bash
cp env.development .env
```

**Note:** The default `.env` has sensible defaults that work out-of-the-box. No changes needed for local dev!

### 2. Start All Services

```bash
make dev
```

**What this does:**
- Builds all Docker images
- Starts all containers
- Waits for services to be ready
- Runs health checks
- Shows service URLs

### 3. Access Services

After `make dev` completes, access these URLs:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Portal** (UI) | http://localhost:3000 | N/A |
| **API Gateway** | http://localhost:8000 | N/A |
| **API Docs** (Swagger) | http://localhost:8000/docs | N/A |
| **API v1 Health** | http://localhost:8000/api/v1/health | N/A |
| **Grafana** | http://localhost:3001 | admin / admin |
| **Prometheus** | http://localhost:9090 | N/A |
| **GitLab** *(optional)* | http://localhost:8080 | root / (set on first visit) |

### 4. Verify Everything Works

```bash
make health
```

**Expected output:**
```
Checking service health...

Portal (http://localhost:3000):
  ✅ Healthy

API Gateway (http://localhost:8000):
  ✅ Healthy

API v1 (http://localhost:8000/api/v1/health):
  ✅ Healthy

OpenAPI Docs (http://localhost:8000/docs):
  ✅ Available
```

---

## Alternative: Manual Docker Compose

If you don't have `make` installed:

```bash
# Copy environment file
cp env.development .env

# Start services
docker compose up -d

# View logs
docker compose logs -f

# Check status
docker compose ps

# Run health checks
curl http://localhost:8000/api/v1/health
curl http://localhost:3000
```

---

## Common Commands

### Development Workflow

```bash
# Start services
make dev

# View logs (all services)
make dev-logs

# View logs (specific service)
docker compose logs -f portal
docker compose logs -f api-gateway

# Check health
make health

# Stop services (keeps data)
make dev-stop

# Restart a specific service
docker compose restart portal
docker compose restart api-gateway

# Rebuild and restart
docker compose up -d --build portal

# Reset everything (removes all data!)
make dev-reset
```

### Debugging

```bash
# Check container status
docker compose ps

# Inspect a container
docker compose logs api-gateway --tail=100

# Execute command in container
docker exec -it optimal-api-gateway sh
docker exec -it optimal-portal sh

# Check resource usage
docker stats

# Remove orphaned containers
docker compose down --remove-orphans
```

---

## Project Structure

```
optimal-platform/
├── apps/
│   ├── portal/              # Next.js frontend (port 3000)
│   └── api-gateway/         # FastAPI backend (port 8000)
├── services/
│   ├── sbom-service/        # SBOM management (port 8002)
│   ├── vuln-service/        # Vulnerability tracking (port 8003)
│   └── worker/              # Background tasks
├── integrations/
│   └── gitlab-listener/     # GitLab webhooks (port 8001)
├── agents/
│   └── optimal-scanner/     # Security scanner (optional)
├── env.development          # Local dev environment vars
├── env.example             # Production environment template
├── docker-compose.yml      # Main service definitions
└── Makefile               # Convenient commands
```

---

## Environment Variables

The platform uses `.env` for configuration. For local development, just copy `env.development`:

```bash
cp env.development .env
```

### Key Variables (Auto-configured for local dev)

```bash
# Database (uses Docker service names)
POSTGRES_USER=optimal_user
POSTGRES_PASSWORD=dev_password_123
DATABASE_URL=postgresql://optimal_user:dev_password_123@postgres:5432/optimal_platform

# Redis
REDIS_URL=redis://redis:6379

# API Configuration
NEXT_PUBLIC_API_BASE=http://api-gateway:8000

# GitLab (optional - leave blank to use mock data)
GITLAB_TOKEN=

# Development
NODE_ENV=development
LOG_LEVEL=DEBUG
```

### GitLab Integration (Optional)

To enable real GitLab integration:

1. Create a Personal Access Token at https://gitlab.com/-/user_settings/personal_access_tokens
2. Select scopes: `api`, `read_repository`, `write_repository`
3. Add to `.env`:
   ```bash
   GITLAB_TOKEN=glpat-your-token-here
   GITLAB_PROJECT_ID=your-project-id
   ```

**Note:** GitLab features work with mock/seeded data if `GITLAB_TOKEN` is not set.

---

## API Development

### Testing API Endpoints

The platform exposes a clean REST API at `/api/v1/*`:

```bash
# Health check
curl http://localhost:8000/api/v1/health | jq

# Platform metrics (single aggregation endpoint)
curl http://localhost:8000/api/v1/metrics | jq

# Vulnerabilities
curl http://localhost:8000/api/v1/vulnerabilities | jq

# Environments
curl http://localhost:8000/api/v1/environments | jq

# SBOM components
curl http://localhost:8000/api/v1/sbom | jq

# POA&M items
curl http://localhost:8000/api/v1/poam | jq
```

### Interactive API Documentation

Visit **http://localhost:8000/docs** for:
- Full API reference
- Try-it-out functionality
- Request/response schemas
- Example payloads

---

## Frontend Development

### Hot Reload

The portal container supports hot reload for development:

```bash
# Rebuild with latest code
docker compose up -d --build portal

# Or edit files directly (auto-reloads inside container)
# Changes to apps/portal/* will trigger rebuild
```

### Building Locally

To test production builds:

```bash
cd apps/portal
npm install
npm run build
npm run start
```

---

## Troubleshooting

### Services Not Starting

**Problem:** Containers exit immediately

**Solution:**
```bash
# Check logs
docker compose logs api-gateway
docker compose logs portal

# Rebuild images
docker compose build --no-cache
docker compose up -d
```

### Port Conflicts

**Problem:** "Port already in use"

**Solution:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9

# Or change ports in docker-compose.yml
ports:
  - "3001:3000"  # Use port 3001 instead
```

### Database Connection Errors

**Problem:** "Could not connect to database"

**Solution:**
```bash
# Restart postgres
docker compose restart postgres

# Check postgres logs
docker compose logs postgres

# Verify postgres is healthy
docker compose ps postgres
```

### "Out of Memory" Errors

**Problem:** Docker runs out of memory

**Solution:**
1. Increase Docker Desktop memory (Preferences → Resources → Memory → 8GB+)
2. Or disable optional services:
   ```bash
   # Comment out in docker-compose.yml:
   # - gitlab (large service)
   # - security-scanner (if not needed)
   ```

### Clearing All Data

**Problem:** Need to start fresh

**Solution:**
```bash
# Stop and remove everything (including volumes)
make dev-reset

# Or manually:
docker compose down -v --remove-orphans
docker system prune -a --volumes

# Then start fresh:
make dev
```

---

## Optional: Keycloak SSO

To enable SSO authentication:

```bash
# Start with Keycloak profile
docker compose -f docker-compose.yml -f docker-compose.keycloak.yml up -d

# Access Keycloak admin
open http://localhost:8080  # admin/admin

# Configure realm and clients in Keycloak UI
```

---

## Performance Tips

### Faster Startup

1. **Disable unused services** - Comment out in `docker-compose.yml`:
   - GitLab (if using external GitLab)
   - Security scanner (if not needed)
   
2. **Use cached builds:**
   ```bash
   docker compose up -d  # Uses cached images
   ```

3. **Parallel builds:**
   ```bash
   docker compose build --parallel
   ```

### Reduce Resource Usage

```bash
# Stop services you're not actively using
docker compose stop grafana prometheus gitlab

# Start only what you need
docker compose up -d postgres redis api-gateway portal
```

---

## Next Steps

### For Frontend Development
- Edit files in `apps/portal/`
- Changes auto-reload in container
- See `apps/portal/README.md` for UI components

### For Backend Development
- Edit files in `apps/api-gateway/`
- See API docs: http://localhost:8000/docs
- Add new endpoints in `api_v1_routes.py`

### For Testing
- Run `make test` (when tests are added)
- Check `/docs/API_V1_REFERENCE.md` for API examples

### For Production Deployment
- See `/docs/deployment/QUICK_START.md`
- Configure `.env` with production secrets
- Use `make deploy-aws` or `make deploy-gcp`

---

## Getting Help

- **API Issues:** Check http://localhost:8000/docs
- **UI Issues:** Check browser console and `docker compose logs portal`
- **Database Issues:** Check `docker compose logs postgres`
- **General:** Run `make health` to diagnose

**All working?** You're ready to develop! 🚀

