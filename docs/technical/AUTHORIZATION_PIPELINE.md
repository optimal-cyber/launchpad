# Authorization Pipeline & Component Assurance

## Overview

The Optimal Platform implements a comprehensive authorization pipeline that ensures all scanned components meet security, compliance, and operational requirements before being approved for deployment. This document outlines how components are verified, authorized, and continuously monitored.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     GitLab CI/CD Pipeline                           │
│  (flask-container-test, ci-cd-templates)                           │
└────────────────┬────────────────────────────────────────────────────┘
                 │
                 │ Webhook / API Ingestion
                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Optimal Platform - Ingestion Layer                     │
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │
│  │   GitLab    │───▶│  Artifact   │───▶│ Validation  │           │
│  │  Listener   │    │  Processor  │    │   Engine    │           │
│  └─────────────┘    └─────────────┘    └─────────────┘           │
└────────────────┬────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│           Authorization & Compliance Engine                         │
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────┐               │
│  │  Security Scorecard  │  │  Compliance Matrix   │               │
│  │  - SAST Results      │  │  - NIST 800-53       │               │
│  │  - Container Scan    │  │  - OWASP Top 10      │               │
│  │  - Secret Detection  │  │  - CIS Benchmarks    │               │
│  │  - Dependency Scan   │  │  - FedRAMP Controls  │               │
│  └──────────────────────┘  └──────────────────────┘               │
│                 │                      │                            │
│                 └──────────┬───────────┘                            │
│                            ▼                                        │
│                 ┌──────────────────────┐                           │
│                 │ Authorization Engine │                           │
│                 │  - Risk Scoring      │                           │
│                 │  - Policy Evaluation │                           │
│                 │  - ATO Decision      │                           │
│                 └──────────────────────┘                           │
└────────────────┬────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Authorization Outputs                             │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │   ATO       │  │  Dashboard  │  │  Artifacts  │               │
│  │  Decision   │  │  & Reports  │  │  & Evidence │               │
│  └─────────────┘  └─────────────┘  └─────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

## CI/CD Pipeline Integration

### GitLab CI/CD Template Structure

Your `default.yml` template from ci-cd-templates defines the complete security pipeline:

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
```

### Artifact Collection Points

The Optimal Platform ingests results from each stage:

1. **Build Stage**
   - Container image metadata
   - Build logs and timestamps
   - Registry push information

2. **SAST Stage** (`Security/SAST.gitlab-ci.yml`)
   - Static code analysis results
   - Code quality metrics
   - Security hotspots

3. **Dependency Scanning** (`Security/Dependency-Scanning.gitlab-ci.yml`)
   - Known vulnerable dependencies
   - License compliance issues
   - Supply chain risks

4. **Secret Detection** (`Security/Secret-Detection.gitlab-ci.yml`)
   - Exposed credentials
   - API keys and tokens
   - Sensitive data patterns

5. **Container Scanning** (`Jobs/Container-Scanning.gitlab-ci.yml`)
   - Trivy scan results
   - OS package vulnerabilities
   - Configuration issues

6. **SBOM Generation**
   - CycloneDX format SBOM
   - Component inventory
   - License information

7. **Compliance Checks** (`/shared/compliance-trivy.yml`)
   - Policy violations
   - Compliance framework mapping
   - Risk assessment

8. **Scorecard** (`/shared/scorecard.yml`)
   - Overall security posture
   - Best practices adherence
   - Supply chain security metrics

## Authorization Flow

### 1. Ingestion Phase

```
GitLab Pipeline → Webhook → GitLab Listener → Artifact Download
```

**Implementation:**
- GitLab webhook triggers on pipeline completion
- `gitlab-listener` service receives webhook payload
- Downloads artifacts from GitLab API using job IDs
- Validates artifact integrity and format

### 2. Processing Phase

```
Artifacts → Parsers → Normalized Data → Database Storage
```

**Components:**
- SBOM parser (CycloneDX/SPDX)
- Vulnerability scanner results parser (Trivy JSON)
- SAST results parser (GitLab Security Report format)
- Compliance results parser (Trivy compliance JSON)

### 3. Authorization Decision

```
Stored Results → Risk Scoring → Policy Evaluation → Authorization Status
```

**Decision Criteria:**

| Component | Weight | Pass Threshold |
|-----------|--------|----------------|
| Critical CVEs | 40% | 0 critical vulnerabilities |
| High CVEs | 25% | < 5 high vulnerabilities |
| SAST Issues | 15% | 0 high severity issues |
| Secret Detection | 10% | 0 secrets exposed |
| Compliance Score | 10% | > 80% compliance |

**Authorization Levels:**

- ✅ **AUTHORIZED** - All criteria met, approved for production
- ⚠️ **CONDITIONAL** - Minor issues, approved with exceptions
- 🔴 **NOT AUTHORIZED** - Critical issues, blocked from production
- 🔄 **PENDING** - Awaiting manual review

### 4. Continuous Monitoring

```
Deployed Components → Runtime Scanning → Re-authorization → ATO Updates
```

## Integration with Flask Container Test

### Pipeline Example: #1989745898

Based on your pipeline at `https://gitlab.com/r.gutwein/flask-container-test/-/pipelines/1989745898`:

**Jobs Executed:**
1. `build` - Container image build ✓
2. `container_scanning` - Trivy vulnerability scan ✓
3. `secret_detection` - Secret scanning ✓
4. `semgrep-sast` - SAST analysis ✓
5. `sbom_syft` - SBOM generation ✓
6. `compliance_trivy` - Compliance checks ⚠️
7. `scorecard` - Security scorecard ⚠️

### Ingestion Configuration

**GitLab Listener Configuration:**

```python
# /integrations/gitlab-listener/app.py

ARTIFACT_MAPPINGS = {
    'sbom_syft': {
        'artifact_name': 'sbom.cdx.json',
        'destination': 'sbom',
        'parser': 'cyclonedx'
    },
    'container_scanning': {
        'artifact_name': 'trivy-misconfig.sarif',
        'destination': 'vulnerabilities',
        'parser': 'trivy_json'
    },
    'compliance_trivy': {
        'artifact_name': 'trivy-compliance.json',
        'destination': 'compliance',
        'parser': 'trivy_compliance'
    },
    'semgrep-sast': {
        'artifact_name': 'gl-sast-report.json',
        'destination': 'sast',
        'parser': 'gitlab_security'
    },
    'secret_detection': {
        'artifact_name': 'gl-secret-detection-report.json',
        'destination': 'secrets',
        'parser': 'gitlab_security'
    },
    'scorecard': {
        'artifact_name': 'scorecard.json',
        'destination': 'scorecard',
        'parser': 'scorecard'
    }
}
```

### Webhook Configuration

**GitLab Project Settings:**

```bash
# Set up webhook in GitLab project
# URL: https://optimal.yourdomain.com/api/gitlab/webhook
# Trigger: Pipeline events, Job events
# Secret Token: [GITLAB_WEBHOOK_SECRET]
```

**Webhook Handler:**

```python
@app.route('/webhook', methods=['POST'])
async def handle_webhook():
    """
    Receives GitLab webhook for pipeline/job completion
    Validates signature, downloads artifacts, processes results
    """
    payload = request.json
    
    if payload['object_kind'] == 'pipeline':
        pipeline_id = payload['object_attributes']['id']
        project_id = payload['project']['id']
        
        # Download artifacts from completed jobs
        for job in payload['builds']:
            if job['status'] == 'success' and job['artifacts_file']:
                await download_and_process_artifact(
                    project_id, 
                    job['id'], 
                    job['name']
                )
```

## Authorization Dashboard

### Component Status View

```
┌─────────────────────────────────────────────────────────────┐
│ flask-container-test:latest                                 │
│ Authorization Status: ⚠️ CONDITIONAL                        │
├─────────────────────────────────────────────────────────────┤
│ Security Metrics:                                           │
│   Critical CVEs:     0  ✓                                   │
│   High CVEs:         3  ⚠️                                   │
│   Medium CVEs:      23                                      │
│   Low CVEs:        109                                      │
│                                                             │
│ SAST Issues:         0  ✓                                   │
│ Secrets Detected:    0  ✓                                   │
│ Compliance Score:   85% ✓                                   │
│ Scorecard:          7.8/10                                  │
├─────────────────────────────────────────────────────────────┤
│ Authorization Details:                                      │
│   Status: CONDITIONAL                                       │
│   Reason: 3 high severity vulnerabilities present           │
│   Action: Approved with remediation plan required           │
│   Reviewer: Security Team                                   │
│   Date: 2025-12-08                                          │
│   ATO Expiration: 2025-12-22 (14 days)                     │
├─────────────────────────────────────────────────────────────┤
│ Required Actions:                                           │
│   □ Remediate CVE-2024-XXXXX (High)                        │
│   □ Update dependency: package@1.2.3                        │
│   □ Document risk acceptance                                │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Ingest Pipeline Results

```bash
POST /api/scans/ingest
Content-Type: application/json

{
  "source": "gitlab",
  "project_id": 12345,
  "pipeline_id": 1989745898,
  "ref": "main",
  "sha": "abc123...",
  "artifacts": {
    "sbom": "https://gitlab.com/.../artifacts/sbom.cdx.json",
    "vulnerabilities": "https://gitlab.com/.../artifacts/trivy-report.json",
    "compliance": "https://gitlab.com/.../artifacts/trivy-compliance.json"
  }
}
```

### Check Authorization Status

```bash
GET /api/authorization/status/{component_id}

Response:
{
  "component": "flask-container-test:latest",
  "status": "CONDITIONAL",
  "risk_score": 42,
  "authorization": {
    "level": "conditional",
    "granted_by": "security-team",
    "granted_at": "2025-12-08T12:00:00Z",
    "expires_at": "2025-12-22T12:00:00Z",
    "conditions": [
      "Remediate 3 high CVEs within 14 days",
      "Document risk acceptance for dependency XYZ"
    ]
  },
  "metrics": {
    "critical_cves": 0,
    "high_cves": 3,
    "sast_issues": 0,
    "secrets": 0,
    "compliance_score": 85
  }
}
```

## Evidence Collection

### Compliance Evidence Package

For each authorized component, the platform generates:

1. **Security Assessment Report**
   - Vulnerability scan results
   - SAST findings
   - Secret detection results
   - Dependency analysis

2. **SBOM Attestation**
   - Complete component inventory
   - License compliance matrix
   - Supply chain verification

3. **Compliance Mappings**
   - NIST 800-53 control satisfaction
   - FedRAMP baseline coverage
   - CIS benchmark results

4. **Authorization Decision**
   - Risk scoring methodology
   - Policy evaluation results
   - Approval chain documentation
   - Conditions and exceptions

### Export Formats

```bash
# Generate evidence package
GET /api/authorization/evidence/{component_id}?format=pdf

# Export compliance report
GET /api/compliance/report/{component_id}?framework=nist-800-53

# Download SBOM
GET /api/sbom/{component_id}?format=cyclonedx-json
```

## Continuous Authorization

### Re-authorization Triggers

Components must be re-authorized when:

- ⏰ ATO expiration (typically 90 days)
- 🆕 New vulnerabilities discovered
- 🔄 Component updates or changes
- 📋 Compliance framework updates
- 🚨 Security incidents

### Automated Monitoring

```python
# Continuous monitoring scheduler
@scheduler.scheduled_job('interval', hours=24)
async def check_component_authorization():
    """
    Daily check of all authorized components
    - Scan for new vulnerabilities
    - Verify compliance status
    - Alert on authorization expiration
    """
    for component in get_authorized_components():
        # Re-scan for vulnerabilities
        vulns = await scan_component(component)
        
        # Check if authorization should be revoked
        if has_new_critical_vulns(vulns):
            revoke_authorization(component)
            notify_security_team(component)
        
        # Alert on expiring ATO
        if ato_expires_soon(component, days=7):
            notify_component_owner(component)
```

## Integration Setup

### 1. Configure GitLab Webhook

```bash
# Add webhook to your GitLab project
curl --request POST \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --url "https://gitlab.com/api/v4/projects/YOUR_PROJECT_ID/hooks" \
  --data "url=https://optimal.yourdomain.com/api/gitlab/webhook" \
  --data "pipeline_events=true" \
  --data "job_events=true" \
  --data "token=$WEBHOOK_SECRET"
```

### 2. Configure Optimal Platform

```bash
# Set environment variables
export GITLAB_TOKEN="your-gitlab-token"
export GITLAB_WEBHOOK_SECRET="your-webhook-secret"
export GITLAB_BASE_URL="https://gitlab.com"

# Restart GitLab listener
docker compose restart gitlab-listener
```

### 3. Test Integration

```bash
# Trigger a pipeline in flask-container-test
curl --request POST \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --url "https://gitlab.com/api/v4/projects/r.gutwein%2Fflask-container-test/pipeline" \
  --data "ref=main"

# Check Optimal platform for ingested results
curl http://localhost:8000/api/scans | jq '.[] | select(.project=="flask-container-test")'
```

## Next Steps

1. ✅ Rename apollo-agent to security-scanner
2. 🔧 Enhance GitLab listener to handle all artifact types
3. 📊 Build authorization decision engine
4. 🎨 Create authorization dashboard UI
5. 📝 Generate compliance evidence packages
6. 🔔 Implement alerting for authorization status changes

## References

- [NIST 800-53 Controls](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final)
- [FedRAMP Authorization Process](https://www.fedramp.gov/ato-process/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
