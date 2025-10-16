# 🚀 Optimal Platform - Production Setup Guide

## Making Optimal Platform Production-Ready

This guide will help you transform the Optimal Platform from a demo into a real, production-ready system.

## 📋 Prerequisites

### 1. GitLab Integration Setup

**Current Status**: ❌ GitLab token expired

**Action Required**:
1. Go to [GitLab Personal Access Tokens](https://gitlab.com/-/profile/personal_access_tokens)
2. Create a new token with these scopes:
   - `read_api` - Read GitLab API
   - `read_repository` - Read repository data
   - `read_user` - Read user information
3. Update your `.env` file:
   ```bash
   GITLAB_TOKEN=your_new_token_here
   GITLAB_BASE_URL=https://gitlab.com
   ```

**Test the integration**:
```bash
export GITLAB_TOKEN=your_new_token
python3 test-gitlab-integration.py
```

### 2. Kubernetes Cluster Access

**For Runtime Security Agents**:
```bash
# Install kubectl
brew install kubectl

# Configure cluster access
kubectl config get-contexts
kubectl config use-context your-cluster-context

# Test access
kubectl get nodes
kubectl get pods -A
```

### 3. Container Registry Access

**For vulnerability scanning**:
```bash
# Docker Hub
docker login

# Or private registry
docker login your-registry.com
```

## 🔧 Production Deployment Steps

### Step 1: Real GitLab Integration

**Current**: Mock data in API Gateway
**Target**: Real GitLab project data

**Implementation**:
1. Update API Gateway to use real GitLab API
2. Implement proper error handling and rate limiting
3. Add caching for performance
4. Set up webhook integration for real-time updates

**Files to modify**:
- `apps/api-gateway/main.py` - Replace mock data with real GitLab API calls
- `apps/portal/app/launchpad/page.tsx` - Handle real data loading states

### Step 2: Runtime Security Agent Deployment

**Current**: Local Docker container
**Target**: Kubernetes DaemonSet in production clusters

**Implementation**:
```yaml
# Create runtime-agent-daemonset.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: optimal-runtime-agent
  namespace: optimal-platform
spec:
  selector:
    matchLabels:
      app: optimal-runtime-agent
  template:
    metadata:
      labels:
        app: optimal-runtime-agent
    spec:
      serviceAccountName: optimal-runtime-agent
      containers:
      - name: runtime-agent
        image: optimal-platform-runtime-agent:latest
        env:
        - name: API_GATEWAY_URL
          value: "https://your-api-gateway.com"
        - name: CLUSTER_NAME
          value: "production"
        securityContext:
          privileged: true
        volumeMounts:
        - name: docker-sock
          mountPath: /var/run/docker.sock
        - name: proc
          mountPath: /host/proc
          readOnly: true
        - name: sys
          mountPath: /host/sys
          readOnly: true
      volumes:
      - name: docker-sock
        hostPath:
          path: /var/run/docker.sock
      - name: proc
        hostPath:
          path: /proc
      - name: sys
        hostPath:
          path: /sys
```

### Step 3: Real Security Scanning

**Current**: Mock vulnerability data
**Target**: Real Trivy, Syft, and other security scanners

**Implementation**:
1. **Trivy Integration**:
   ```bash
   # Install Trivy
   brew install trivy
   
   # Scan container images
   trivy image your-image:latest
   
   # Scan filesystem
   trivy fs /path/to/scan
   ```

2. **Syft Integration**:
   ```bash
   # Install Syft
   brew install syft
   
   # Generate SBOM
   syft your-image:latest
   ```

3. **Update Runtime Agent**:
   - Integrate real Trivy and Syft binaries
   - Implement proper scanning workflows
   - Add result parsing and reporting

### Step 4: AI Model Discovery

**Current**: Mock AI models
**Target**: Real AI/ML model discovery in production

**Implementation**:
1. **Kubernetes Label Discovery**:
   ```bash
   # Find AI/ML workloads
   kubectl get pods -A -l app=ai,model=llm
   kubectl get deployments -A -l framework=tensorflow
   ```

2. **Container Image Analysis**:
   - Scan container images for AI frameworks
   - Detect model files and endpoints
   - Identify security controls

3. **API Endpoint Discovery**:
   - Scan for common AI model endpoints
   - Test for security vulnerabilities
   - Monitor for prompt injection attempts

### Step 5: Production Database Setup

**Current**: Local PostgreSQL
**Target**: Production database with persistence

**Implementation**:
1. **Database Migration**:
   ```sql
   -- Create production tables
   CREATE TABLE projects (
       id SERIAL PRIMARY KEY,
       gitlab_id INTEGER UNIQUE,
       name VARCHAR(255),
       web_url TEXT,
       created_at TIMESTAMP DEFAULT NOW()
   );
   
   CREATE TABLE vulnerabilities (
       id SERIAL PRIMARY KEY,
       project_id INTEGER REFERENCES projects(id),
       severity VARCHAR(20),
       title TEXT,
       description TEXT,
       created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Data Persistence**:
   - Set up proper database backups
   - Implement data retention policies
   - Add database monitoring

### Step 6: Authentication & Authorization

**Current**: Mock authentication
**Target**: Real authentication system

**Implementation**:
1. **OAuth Integration**:
   - GitLab OAuth for user authentication
   - JWT tokens for API access
   - Role-based access control (RBAC)

2. **Security Features**:
   - Multi-factor authentication
   - Session management
   - API rate limiting

### Step 7: Monitoring & Alerting

**Current**: Basic Prometheus/Grafana
**Target**: Production monitoring

**Implementation**:
1. **Metrics Collection**:
   - Application metrics
   - Infrastructure metrics
   - Security event metrics

2. **Alerting Rules**:
   ```yaml
   # prometheus-alerts.yml
   groups:
   - name: optimal-platform
     rules:
     - alert: HighVulnerabilityCount
       expr: vulnerabilities_total{severity="critical"} > 10
       for: 5m
       labels:
         severity: critical
       annotations:
         summary: "High number of critical vulnerabilities detected"
   ```

## 🚀 Quick Start for Production

### 1. Update GitLab Token
```bash
# Edit .env file
nano .env

# Update GITLAB_TOKEN with your new token
GITLAB_TOKEN=glpat-your-new-token-here

# Test the integration
export GITLAB_TOKEN=$(grep GITLAB_TOKEN .env | cut -d'=' -f2)
python3 test-gitlab-integration.py
```

### 2. Deploy to Kubernetes
```bash
# Create namespace
kubectl create namespace optimal-platform

# Deploy runtime agent
kubectl apply -f runtime-agent-daemonset.yaml

# Check deployment
kubectl get pods -n optimal-platform
```

### 3. Set up Production Database
```bash
# Create production database
docker run -d \
  --name optimal-postgres-prod \
  -e POSTGRES_DB=optimal_platform \
  -e POSTGRES_USER=optimal \
  -e POSTGRES_PASSWORD=secure_password \
  -v optimal-postgres-data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15
```

### 4. Configure Real Security Scanning
```bash
# Update runtime agent with real scanners
docker build -t optimal-platform-runtime-agent:latest \
  -f agents/runtime-security-agent/Dockerfile \
  agents/runtime-security-agent/

# Deploy updated agent
kubectl rollout restart daemonset/optimal-runtime-agent -n optimal-platform
```

## 📊 Production Checklist

- [ ] ✅ GitLab token configured and tested
- [ ] ⏳ Kubernetes cluster access configured
- [ ] ⏳ Runtime security agents deployed
- [ ] ⏳ Real security scanners integrated
- [ ] ⏳ AI model discovery implemented
- [ ] ⏳ Production database set up
- [ ] ⏳ Authentication system implemented
- [ ] ⏳ Monitoring and alerting configured
- [ ] ⏳ Backup and disaster recovery planned
- [ ] ⏳ Security hardening completed

## 🔗 Next Steps

1. **Immediate**: Update GitLab token and test integration
2. **Short-term**: Deploy runtime agents to a test cluster
3. **Medium-term**: Implement real security scanning
4. **Long-term**: Full production deployment with monitoring

## 📞 Support

For questions or issues with production setup:
- Check the logs: `docker compose -f docker-compose.dev.yml logs`
- Test individual components: `python3 test-gitlab-integration.py`
- Review configuration: `cat .env`

---

**Status**: 🟡 Ready for production setup - GitLab token needs renewal
