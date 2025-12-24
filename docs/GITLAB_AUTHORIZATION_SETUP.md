# GitLab Authorization Pipeline Setup

## Overview

The Optimal Platform provides **continuous authorization** through automated security and compliance validation. This guide shows how to configure GitLab CI/CD to send pipeline results to the platform for authorization tracking.

## Architecture

```
GitLab Pipeline → Webhook → Optimal Platform → Authorization Dashboard
       ↓
[Build, SAST, Container Scan, SBOM, Compliance] → Evidence Collection
```

## Your Pipeline Template

Based on your `flask-container-test` project, you're already using the security pipeline template:

```yaml
stages:
  - build
  - sast
  - dependency_scanning
  - secret_detection
  - container_scanning
  - sbom
  - compliance
  - scorecard

include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Dependency-Scanning.gitlab-ci.yml
  - template: Security/Secret-Detection.gitlab-ci.yml
  - template: Jobs/Container-Scanning.gitlab-ci.yml
  - local: /shared/compliance-trivy.yml
  - local: /shared/scorecard.yml
```

## GitLab Webhook Configuration

### 1. Create Webhook in GitLab

1. Go to your project: https://gitlab.com/r.gutwein/flask-container-test
2. Navigate to **Settings → Webhooks**
3. Add a new webhook:
   - **URL**: `https://your-platform.gooptimal.io/gitlab/webhook`
   - **Secret Token**: Generate a strong token and save it
   - **Trigger Events**:
     - ✅ Pipeline events
     - ✅ Job events
   - **Enable SSL verification**: ✅ Enabled

### 2. Configure Platform Webhook Secret

Add the webhook secret to your platform configuration:

```bash
# In your docker-compose.yml or environment
GITLAB_WEBHOOK_SECRET=your_generated_token_here
```

### 3. Test the Webhook

After creating the webhook, GitLab will send a test ping. You should see:
- ✅ HTTP 200 response
- Event logged in platform

## Authorization Evidence Collection

### What Gets Collected

For each pipeline run, the platform collects:

#### Security Scans
- **Container Scanning** (`gl-container-scanning-report.json`)
  - Container vulnerabilities
  - Base image issues
  - Layer-specific findings

- **SAST** (`gl-sast-report.json`)
  - Static code analysis
  - Security anti-patterns
  - Code quality issues

- **Secret Detection** (`gl-secret-detection-report.json`)
  - Hardcoded secrets
  - API keys
  - Credentials

- **Dependency Scanning** (`gl-dependency-scanning-report.json`)
  - Vulnerable dependencies
  - License compliance
  - Supply chain risks

#### Compliance Artifacts
- **SBOM** (`gl-sbom.cdx.json`)
  - Complete component inventory
  - CycloneDX format
  - EO 14028 compliance

- **Compliance Reports** (Trivy)
  - Policy violations
  - Configuration issues
  - Best practice adherence

- **Security Scorecard**
  - OSSF Scorecard results
  - Repository health metrics
  - Security posture score

### Authorization Decision Logic

Components are **AUTHORIZED** when:
- ✅ All security scans complete successfully
- ✅ No critical vulnerabilities found
- ✅ SBOM generated
- ✅ Compliance checks pass (or have documented exceptions)
- ✅ Scorecard meets minimum threshold (configurable)

Components are **PENDING** when:
- ⚠️  Non-critical findings exist with remediation plans
- ⚠️  Compliance warnings (not failures)
- ⚠️  Manual review required

Components are **REJECTED** when:
- ❌ Critical vulnerabilities without fixes
- ❌ Security scan failures
- ❌ Missing required artifacts
- ❌ Compliance violations

## Viewing Authorization Status

### Authorization Dashboard

Visit: `https://your-platform.gooptimal.io/authorization`

You'll see:
- Real-time pipeline status
- Authorization decisions
- Compliance scores
- Evidence artifacts
- Direct links to GitLab pipelines

### Example Authorization Record

```json
{
  "component": "flask-container-test",
  "project": "r.gutwein/flask-container-test",
  "pipeline_id": "1989745898",
  "commit": "d6a08cf1",
  "status": "authorized",
  "compliance_score": 94,
  "timestamp": "2024-12-08T16:00:00Z",
  "stages": [
    {
      "name": "build",
      "status": "passed",
      "jobs": [{"name": "build", "status": "passed", "duration": "08:02"}]
    },
    {
      "name": "test",
      "status": "passed",
      "jobs": [
        {"name": "container_scanning", "status": "passed", "findings": 0},
        {"name": "secret_detection", "status": "passed", "findings": 0},
        {"name": "semgrep-sast", "status": "passed", "findings": 2}
      ]
    },
    {
      "name": "sbom",
      "status": "passed",
      "jobs": [{"name": "sbom_syft", "status": "passed"}]
    },
    {
      "name": "compliance",
      "status": "warning",
      "jobs": [{"name": "compliance_trivy", "status": "warning", "findings": 3}]
    },
    {
      "name": "scorecard",
      "status": "warning",
      "jobs": [{"name": "scorecard", "status": "warning"}]
    }
  ],
  "artifacts": {
    "sbom": true,
    "vulnerabilities": true,
    "secrets": true,
    "compliance": true,
    "scorecard": true
  }
}
```

## API Endpoints

### Webhook Endpoint
```
POST /gitlab/webhook
Headers:
  X-Gitlab-Token: <webhook_secret>
Body: GitLab pipeline webhook payload
```

### Fetch Pipeline Results
```
GET /gitlab/test/fetch?job_id=<job_id>&project_id=<project_id>
```

This endpoint manually fetches artifacts from a specific job.

### Authorization Evidence API
```
GET /api/authorization/evidence
POST /api/authorization/evidence
```

## Continuous Authorization Benefits

1. **Automated Evidence Collection**
   - No manual artifact gathering
   - Automatic compliance documentation
   - Real-time authorization status

2. **Risk-Based Deployment**
   - Only authorized components deploy
   - Clear authorization criteria
   - Audit trail for compliance

3. **Continuous Compliance**
   - Always up-to-date security posture
   - Automated policy enforcement
   - Proactive risk management

4. **DevSecOps Integration**
   - Security in the pipeline
   - Fast feedback loops
   - No deployment delays

## Your Current Pipeline Results

Based on pipeline #1989745898:
- ✅ Build: Passed
- ✅ Container Scanning: Passed (0 findings)
- ✅ Secret Detection: Passed (0 findings)
- ✅ SAST (Semgrep): Passed (2 findings)
- ✅ SBOM Generation: Passed
- ⚠️  Compliance (Trivy): Warning (3 findings)
- ⚠️  Scorecard: Warning

**Authorization Status**: AUTHORIZED with warnings

**Compliance Score**: 94%

**Recommendation**: Review compliance warnings and scorecard results to achieve 100% authorization.

## Troubleshooting

### Webhook Not Receiving Events

1. Check GitLab webhook logs:
   - Go to Settings → Webhooks
   - Click "Edit" on your webhook
   - Scroll to "Recent Deliveries"
   - Check for errors

2. Verify webhook secret matches

3. Check platform logs:
```bash
docker logs optimal-platform-gitlab-listener-1 -f
```

### Missing Artifacts

Artifacts must be configured in `.gitlab-ci.yml`:

```yaml
job_name:
  artifacts:
    reports:
      sast: gl-sast-report.json
      secret_detection: gl-secret-detection-report.json
      container_scanning: gl-container-scanning-report.json
      dependency_scanning: gl-dependency-scanning-report.json
      cyclonedx: gl-sbom.cdx.json
```

### Authorization Not Updating

1. Check if webhook is configured correctly
2. Verify pipeline completed successfully
3. Check that artifacts are being generated
4. Review platform logs for ingestion errors

## Next Steps

1. ✅ Configure GitLab webhook (if not already done)
2. ✅ Run a pipeline and verify webhook delivery
3. ✅ View authorization evidence in the dashboard
4. ✅ Set up deployment gates based on authorization status
5. ✅ Configure compliance thresholds for auto-approval

## Support

For issues or questions:
- Documentation: https://docs.gooptimal.io
- Support: support@gooptimal.io
- GitLab Issues: https://gitlab.com/optimal-platform/optimal/-/issues



