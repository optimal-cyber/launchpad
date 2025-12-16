from fastapi import FastAPI, HTTPException, Header, Query, File, UploadFile, Form, BackgroundTasks
from pydantic import BaseModel
import json
import logging
import os
import httpx
import zipfile
import io
import re
import gzip
from typing import Optional, Dict, Any, List
import uuid
from datetime import datetime
import asyncpg
import json

# Import GitLab Issues module (legacy - kept for backward compatibility)
from gitlab_issues import (
    GitLabConfig,
    GitLabIssuesClient,
    VulnerabilityIssueRequest,
    MisconfigurationIssueRequest,
    POAMIssueRequest,
    BulkIssueRequest,
    IssueResponse,
    create_vulnerability_issue,
    create_misconfiguration_issue,
    create_poam_issue,
    create_bulk_issues,
    auto_create_issues_from_scan,
    gitlab_issues,
    config as gitlab_config
)

# Import provider-agnostic service (new unified API)
from provider_service import (
    ProviderService,
    get_service,
    close_service,
    auto_create_tickets_from_scan,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="GitLab Integration Service",
    version="1.0.0",
    description="GitLab integration for CI/CD, webhooks, and automated issue management"
)

# Environment variables
GITLAB_BASE_URL = os.getenv("GITLAB_BASE_URL", "https://gitlab.com")
GITLAB_TOKEN = os.getenv("GITLAB_TOKEN")
GITLAB_PROJECT_ID = os.getenv("GITLAB_PROJECT_ID")
SBOM_SERVICE_URL = os.getenv("SBOM_SERVICE_URL", "http://sbom-service:8002")
VULN_SERVICE_URL = os.getenv("VULN_SERVICE_URL", "http://vuln-service:8003")
INGESTION_TOKEN = os.getenv("INGESTION_TOKEN")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:harbor@postgres:5432/optimal_platform")

# Models
class ProjectLink(BaseModel):
    gitlab_project_id: int
    optimal_project_id: str
    default_branch: str

class Database:
    def __init__(self):
        # In MVP, we'll use simple in-memory storage
        self.gitlab_projects = {}
        self.gitlab_jobs = {}
    
    def link_project(self, project_link: ProjectLink):
        """Link a GitLab project to an Optimal project"""
        self.gitlab_projects[project_link.gitlab_project_id] = {
            "gitlab_project_id": project_link.gitlab_project_id,
            "optimal_project_id": project_link.optimal_project_id,
            "default_branch": project_link.default_branch,
            "repo_url": f"{GITLAB_BASE_URL}/r.gutwein/flask-container-test",
            "created_at": datetime.utcnow().isoformat()
        }
        return {"status": "linked", "project_id": project_link.gitlab_project_id}
    
    def get_projects(self):
        """Get all linked projects"""
        return list(self.gitlab_projects.values())

db = Database()

# Database connection
async def get_db_connection():
    """Get database connection"""
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        return conn
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return None

async def store_scan_result(project_id: int, job_id: int, pipeline_id: int, scan_type: str, scan_data: dict, sha: str = "unknown", ref: str = "main"):
    """Store scan result in database"""
    try:
        conn = await get_db_connection()
        if not conn:
            logger.error("Failed to get database connection")
            return False
        
        # Store in gitlab_jobs table
        await conn.execute("""
            INSERT INTO integrations.gitlab_jobs 
            (gitlab_project_id, job_id, pipeline_id, sha, ref, status, artifact_fetched, web_url) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (gitlab_project_id, pipeline_id, job_id) 
            DO UPDATE SET artifact_fetched = $7
        """, project_id, job_id, pipeline_id, sha, ref, "completed", True, f"{GITLAB_BASE_URL}/r.gutwein/flask-container-test/-/jobs/{job_id}")
        
        # Store scan data based on type
        if scan_type == "sast":
            # Store SAST results in vulnerability findings
            vulnerabilities = scan_data.get("vulnerabilities", [])
            for vuln in vulnerabilities:
                await conn.execute("""
                    INSERT INTO vuln.findings 
                    (vuln_id, severity, status, gitlab_project_id, pipeline_id, job_id, sha, grype_data)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """, f"sast-{uuid.uuid4()}", "medium", "OPEN", project_id, pipeline_id, job_id, sha, json.dumps(vuln))
        
        elif scan_type == "secret_detection":
            # Store secret detection results
            vulnerabilities = scan_data.get("vulnerabilities", [])
            for secret in vulnerabilities:
                await conn.execute("""
                    INSERT INTO vuln.findings 
                    (vuln_id, severity, status, gitlab_project_id, pipeline_id, job_id, sha, grype_data)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """, f"secret-{uuid.uuid4()}", "high", "OPEN", project_id, pipeline_id, job_id, sha, json.dumps(secret))
        
        await conn.close()
        logger.info(f"Successfully stored {scan_type} scan result for job {job_id}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to store scan result: {e}")
        return False

def verify_gitlab_webhook(x_gitlab_token: str = Header(None)):
    """Verify GitLab webhook token"""
    if not x_gitlab_token or x_gitlab_token != os.getenv("GITLAB_WEBHOOK_SECRET"):
        raise HTTPException(status_code=401, detail="Invalid GitLab token")
    return x_gitlab_token

def verify_ingestion_token(x_optimal_token: str = Header(None)):
    """Verify ingestion token"""
    if not x_optimal_token or x_optimal_token != INGESTION_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid ingestion token")
    return x_optimal_token

def gl_headers():
    """Get GitLab API headers"""
    return {"PRIVATE-TOKEN": GITLAB_TOKEN}

async def fetch_artifact_file(project_id: str, job_id: str, path: str) -> bytes:
    """Fetch a specific artifact file from GitLab"""
    # Use direct API endpoint for specific files
    url = f"{GITLAB_BASE_URL}/api/v4/projects/{project_id}/jobs/{job_id}/artifacts/{path}"
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.get(url, headers=gl_headers())
        if r.status_code == 200:
            logger.info(f"Successfully fetched {path} from GitLab API")
            return r.content
        
        # If direct file access fails, try to get the artifacts list to see what's available
        logger.info(f"Direct access to {path} failed, checking available artifacts")
        artifacts_url = f"{GITLAB_BASE_URL}/api/v4/projects/{project_id}/jobs/{job_id}/artifacts"
        artifacts_r = await client.get(artifacts_url, headers=gl_headers())
        
        if artifacts_r.status_code == 200:
            logger.info(f"Job {job_id} has artifacts available")
            raise HTTPException(404, f"File {path} not found in job {job_id}")
        else:
            raise HTTPException(404, f"Artifacts not accessible for job {job_id}: {artifacts_r.status_code}")

async def forward_sbom(project_meta: dict, sbom_bytes: bytes):
    """Forward SBOM data to SBOM service"""
    try:
        doc = json.loads(sbom_bytes.decode("utf-8"))
        payload = {
            "format": "cyclonedx",
            "document": doc,
            "project": project_meta,
            "source": project_meta
        }
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(
                f"{SBOM_SERVICE_URL}/api/sboms/ingest",
                json=payload,
                headers={"X-Optimal-Token": INGESTION_TOKEN}
            )
            r.raise_for_status()
            return r.json()
    except Exception as e:
        logger.error(f"Error forwarding SBOM: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to forward SBOM: {str(e)}")

async def forward_vulns(project_meta: dict, grype_bytes: bytes):
    """Forward vulnerability data to vulnerability service"""
    try:
        doc = json.loads(grype_bytes.decode("utf-8"))
        payload = {
            "grype": doc,
            "project": project_meta,
            "source": project_meta
        }
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(
                f"{VULN_SERVICE_URL}/api/vulns/grype",
                json=payload,
                headers={"X-Optimal-Token": INGESTION_TOKEN}
            )
            r.raise_for_status()
            return r.json()
    except Exception as e:
        logger.error(f"Error forwarding vulnerabilities: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to forward vulnerabilities: {str(e)}")

# Routes
@app.post("/link/gitlab-project")
async def link_gitlab_project(project_link: ProjectLink):
    """Link a GitLab project ID to an Optimal project ID"""
    try:
        result = db.link_project(project_link)
        logger.info(f"Linked GitLab project {project_link.gitlab_project_id} to Optimal project {project_link.optimal_project_id}")
        return result
    except Exception as e:
        logger.error(f"Error linking project: {e}")
        raise HTTPException(status_code=500, detail="Failed to link project")

@app.post("/gitlab/webhook")
async def gitlab_webhook(
    payload: Dict[str, Any],
    x_gitlab_token: str = Header(None)
):
    """Handle GitLab webhooks"""
    # Verify webhook token
    if not x_gitlab_token or x_gitlab_token != os.getenv("GITLAB_WEBHOOK_SECRET"):
        raise HTTPException(status_code=401, detail="Invalid webhook token")
    
    try:
        # Log the webhook event
        event_type = payload.get("object_kind")
        project_id = payload.get("project", {}).get("id")
        
        logger.info(f"Received GitLab webhook: {event_type} for project {project_id}")
        
        # In production, this would enqueue worker tasks
        # For MVP, we'll just log the event
        
        return {"status": "webhook_received", "event_type": event_type}
        
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail="Failed to process webhook")

@app.post("/ingest/push")
async def ingest_push(
    sbom: UploadFile = File(...),
    grype: UploadFile = File(...),
    meta: UploadFile = File(...),
    x_optimal_token: str = Header(None)
):
    """Accept direct CI push of artifacts"""
    # Verify ingestion token
    if not x_optimal_token or x_optimal_token != INGESTION_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid ingestion token")
    
    try:
        # Parse metadata
        meta_content = await meta.read()
        meta_data = json.loads(meta_content.decode("utf-8"))
        
        # Read SBOM and vulnerability data
        sbom_content = await sbom.read()
        grype_content = await grype.read()
        
        # Forward to services
        sbom_result = await forward_sbom(meta_data, sbom_content)
        vuln_result = await forward_vulns(meta_data, grype_content)
        
        logger.info(f"Ingested artifacts for pipeline {meta_data.get('pipeline_id')}")
        
        return {
            "status": "ingested",
            "sbom": sbom_result,
            "vulnerabilities": vuln_result
        }
        
    except Exception as e:
        logger.error(f"Error ingesting artifacts: {e}")
        raise HTTPException(status_code=500, detail="Failed to ingest artifacts")

@app.get("/gitlab/test/fetch")
async def test_fetch(
    job_id: str = Query(...),
    project_id: str = Query(GITLAB_PROJECT_ID)
):
    """Test endpoint to fetch artifacts from GitLab and ingest them"""
    if not GITLAB_TOKEN:
        raise HTTPException(status_code=500, detail="GitLab token not configured")
    
    try:
        # Create project metadata
        meta = {
            "gitlab_project_id": int(project_id),
            "job_id": int(job_id),
            "pipeline_id": 1966221398,  # From your pipeline
            "sha": "abc123",
            "ref": "main",
            "image_tag": "latest",
            "web_url": f"{GITLAB_BASE_URL}/r.gutwein/flask-container-test/-/jobs/{job_id}"
        }
        
        results = {}
        
        # First, try to determine what type of job this is by checking available artifacts
        logger.info(f"Analyzing job {job_id} for available artifacts")
        
        # Try to fetch GitLab security artifacts
        try:
            logger.info(f"Checking for GitLab security artifacts in job {job_id}")
            
            # Look for GitLab security artifacts
            security_artifacts = {}
            for artifact_file in ["gl-sast-report.json", "gl-secret-detection-report.json", "gl-container-scanning-report.json", "gl-dependency-scanning-report.json", "gl-sbom.cdx.json", "gl-sbom.cdx.json.gz"]:
                try:
                    artifact_data = await fetch_artifact_file(project_id, job_id, artifact_file)
                    security_artifacts[artifact_file] = artifact_data
                    logger.info(f"Found security artifact: {artifact_file}")
                except Exception as e:
                    logger.info(f"Artifact {artifact_file} not found: {e}")
                    continue
            
            if security_artifacts:
                # Process SAST results
                if "gl-sast-report.json" in security_artifacts:
                    try:
                        sast_data = json.loads(security_artifacts["gl-sast-report.json"].decode())
                        
                        # Store SAST results in database
                        pipeline_id = 1966221398  # From your pipeline
                        await store_scan_result(
                            project_id=int(project_id), 
                            job_id=int(job_id), 
                            pipeline_id=pipeline_id,
                            scan_type="sast",
                            scan_data=sast_data,
                            sha="d6a08cf1",  # From your pipeline
                            ref="main"
                        )
                        
                        results["sast"] = {
                            "status": "success",
                            "message": f"Found {len(sast_data.get('vulnerabilities', []))} SAST vulnerabilities",
                            "data": sast_data,
                            "scan_summary": {
                                "analyzer": sast_data.get('scan', {}).get('analyzer', {}).get('name', 'Unknown'),
                                "scanner": sast_data.get('scan', {}).get('scanner', {}).get('name', 'Unknown'),
                                "status": sast_data.get('scan', {}).get('status', 'Unknown'),
                                "start_time": sast_data.get('scan', {}).get('start_time', 'Unknown'),
                                "end_time": sast_data.get('scan', {}).get('end_time', 'Unknown')
                            }
                        }
                        logger.info(f"Successfully processed and stored SAST results for job {job_id}")
                    except Exception as e:
                        logger.warning(f"Failed to process SAST results: {e}")
                        results["sast"] = {"error": str(e)}
                
                # Process Secret Detection results
                if "gl-secret-detection-report.json" in security_artifacts:
                    try:
                        secret_data = json.loads(security_artifacts["gl-secret-detection-report.json"].decode())
                        
                        # Store secret detection results in database
                        pipeline_id = 1966221398  # From your pipeline
                        await store_scan_result(
                            project_id=int(project_id), 
                            job_id=int(job_id), 
                            pipeline_id=pipeline_id,
                            scan_type="secret_detection",
                            scan_data=secret_data,
                            sha="d6a08cf1",  # From your pipeline
                            ref="main"
                        )
                        
                        results["secret_detection"] = {
                            "status": "success",
                            "message": f"Found {len(secret_data.get('vulnerabilities', []))} secrets",
                            "data": secret_data
                        }
                        logger.info(f"Successfully processed and stored secret detection results for job {job_id}")
                    except Exception as e:
                        logger.warning(f"Failed to process secret detection results: {e}")
                        results["secret_detection"] = {"error": str(e)}
                
                # Process Container Scanning results
                if "gl-container-scanning-report.json" in security_artifacts:
                    try:
                        container_data = json.loads(security_artifacts["gl-container-scanning-report.json"].decode())
                        
                        # Store container scanning results in database
                        pipeline_id = 1966221398  # From your pipeline
                        await store_scan_result(
                            project_id=int(project_id), 
                            job_id=int(job_id), 
                            pipeline_id=pipeline_id,
                            scan_type="container_scanning",
                            scan_data=container_data,
                            sha="d6a08cf1",  # From your pipeline
                            ref="main"
                        )
                        
                        vuln_res = await forward_vulns(meta, security_artifacts["gl-container-scanning-report.json"])
                        results["container_scanning"] = {
                            "status": "success",
                            "message": f"Found {len(container_data.get('vulnerabilities', []))} container vulnerabilities",
                            "data": container_data,
                            "forwarded": vuln_res
                        }
                        logger.info(f"Successfully processed and stored container scanning results for job {job_id}")
                    except Exception as e:
                        logger.warning(f"Failed to process container scanning results: {e}")
                        results["container_scanning"] = {"error": str(e)}
                
                # Process Dependency Scanning results
                if "gl-dependency-scanning-report.json" in security_artifacts:
                    try:
                        dep_data = json.loads(security_artifacts["gl-dependency-scanning-report.json"].decode())
                        vuln_res = await forward_vulns(meta, security_artifacts["gl-dependency-scanning-report.json"])
                        results["dependency_scanning"] = vuln_res
                        logger.info(f"Successfully ingested dependency scanning results for job {job_id}")
                    except Exception as e:
                        logger.warning(f"Failed to process dependency scanning results: {e}")
                        results["dependency_scanning"] = {"error": str(e)}
                
                # Process SBOM results
                if "gl-sbom.cdx.json" in security_artifacts or "gl-sbom.cdx.json.gz" in security_artifacts:
                    try:
                        sbom_file = "gl-sbom.cdx.json" if "gl-sbom.cdx.json" in security_artifacts else "gl-sbom.cdx.json.gz"
                        sbom_data = security_artifacts[sbom_file]
                        
                        # Handle compressed SBOM if needed
                        if sbom_file.endswith('.gz'):
                            sbom_content = gzip.decompress(sbom_data)
                        else:
                            sbom_content = sbom_data
                        
                        sbom_json = json.loads(sbom_content.decode())
                        sbom_res = await forward_sbom(meta, sbom_content)
                        results["sbom"] = sbom_res
                        logger.info(f"Successfully ingested SBOM results for job {job_id}")
                    except Exception as e:
                        logger.warning(f"Failed to process SBOM results: {e}")
                        results["sbom"] = {"error": str(e)}
                
            else:
                logger.info(f"No GitLab security artifacts found for job {job_id}")
                results["security_artifacts"] = {"message": "No GitLab security artifacts found"}
                
        except Exception as e:
            logger.warning(f"Failed to fetch/process GitLab security artifacts: {e}")
            results["security_artifacts"] = {"error": str(e)}
        
        logger.info(f"Completed artifact processing for job {job_id}")
        
        return {
            "status": "success",
            "job_id": job_id,
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Error in test fetch: {e}")
        raise HTTPException(status_code=500, detail=f"Test fetch failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    gitlab_status = await gitlab_issues.test_connection() if gitlab_config.is_configured else {"connected": False}
    return {
        "status": "healthy",
        "service": "gitlab-listener",
        "gitlab_issues_configured": gitlab_config.is_configured,
        "gitlab_connected": gitlab_status.get("connected", False)
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "GitLab Integration Service", "version": "1.0.0"}


# =============================================================================
# GitLab Issues API Routes
# =============================================================================

@app.get("/api/issues/status")
async def issues_status():
    """Get GitLab Issues integration status"""
    if not gitlab_config.is_configured:
        return {
            "configured": False,
            "message": "GitLab is not configured. Set GITLAB_BASE_URL and GITLAB_TOKEN environment variables."
        }

    connection = await gitlab_issues.test_connection()
    return {
        "configured": True,
        "connected": connection.get("connected", False),
        "user": connection.get("user"),
        "base_url": gitlab_config.base_url,
        "default_project": gitlab_config.project_id,
        "sla_days": {
            "critical": gitlab_config.sla_critical,
            "high": gitlab_config.sla_high,
            "medium": gitlab_config.sla_medium,
            "low": gitlab_config.sla_low
        }
    }


@app.post("/api/issues/vulnerability", response_model=IssueResponse)
async def create_vuln_issue(request: VulnerabilityIssueRequest):
    """Create a GitLab issue from a vulnerability finding"""
    return await create_vulnerability_issue(request)


@app.post("/api/issues/misconfiguration", response_model=IssueResponse)
async def create_misconfig_issue(request: MisconfigurationIssueRequest):
    """Create a GitLab issue from a misconfiguration finding"""
    return await create_misconfiguration_issue(request)


@app.post("/api/issues/poam", response_model=IssueResponse)
async def create_poam(request: POAMIssueRequest):
    """Create or update a POA&M issue in GitLab"""
    return await create_poam_issue(request)


@app.post("/api/issues/bulk")
async def create_issues_bulk(request: BulkIssueRequest, background_tasks: BackgroundTasks):
    """Create multiple issues in bulk"""
    total = len(request.vulnerabilities or []) + len(request.misconfigurations or [])

    if total == 0:
        raise HTTPException(status_code=400, detail="No issues to create")

    if total > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 issues per bulk request")

    # For large batches, process in background
    if total > 10:
        job_id = str(uuid.uuid4())

        async def process_bulk():
            results = await create_bulk_issues(request)
            logger.info(f"Bulk job {job_id} completed: {results['summary']}")

        background_tasks.add_task(process_bulk)

        return {
            "job_id": job_id,
            "status": "processing",
            "total_issues": total,
            "message": f"Processing {total} issues in background"
        }

    # Small batches processed immediately
    return await create_bulk_issues(request)


@app.post("/api/issues/auto-create")
async def auto_create_from_scan(
    scan_results: Dict[str, Any],
    project_id: int = Query(...),
    environment: str = Query(...),
    severity_threshold: str = Query(default="high")
):
    """
    Automatically create issues from scan results.
    Only creates issues for findings at or above the severity threshold.
    """
    if severity_threshold.lower() not in ["critical", "high", "medium", "low", "informational"]:
        raise HTTPException(status_code=400, detail="Invalid severity threshold")

    return await auto_create_issues_from_scan(
        scan_results=scan_results,
        project_id=project_id,
        environment=environment,
        severity_threshold=severity_threshold
    )


@app.get("/api/issues/{project_id}/{issue_iid}")
async def get_issue(project_id: int, issue_iid: int):
    """Get issue details from GitLab"""
    if not gitlab_config.is_configured:
        raise HTTPException(status_code=503, detail="GitLab is not configured")

    issue = await gitlab_issues.get_issue(project_id, issue_iid)
    if issue:
        return issue
    else:
        raise HTTPException(status_code=404, detail=f"Issue #{issue_iid} not found")


@app.get("/api/issues/{project_id}")
async def search_issues(
    project_id: int,
    labels: str = Query(None, description="Comma-separated labels"),
    state: str = Query(None, description="Issue state (opened, closed, all)"),
    search: str = Query(None, description="Search in title and description"),
    per_page: int = Query(50, le=100)
):
    """Search issues in a project"""
    if not gitlab_config.is_configured:
        raise HTTPException(status_code=503, detail="GitLab is not configured")

    label_list = labels.split(",") if labels else None

    issues = await gitlab_issues.search_issues(
        project_id=project_id,
        labels=label_list,
        state=state,
        search=search,
        per_page=per_page
    )

    return {
        "project_id": project_id,
        "total": len(issues),
        "issues": issues
    }


@app.post("/api/issues/{project_id}/{issue_iid}/comment")
async def add_issue_comment(project_id: int, issue_iid: int, body: str):
    """Add a comment to an issue"""
    if not gitlab_config.is_configured:
        raise HTTPException(status_code=503, detail="GitLab is not configured")

    result = await gitlab_issues.add_comment(project_id, issue_iid, body)

    if result.get("success"):
        return result
    else:
        raise HTTPException(status_code=400, detail=result.get("error"))


@app.post("/api/issues/{project_id}/{issue_iid}/close")
async def close_issue(project_id: int, issue_iid: int):
    """Close an issue"""
    if not gitlab_config.is_configured:
        raise HTTPException(status_code=503, detail="GitLab is not configured")

    result = await gitlab_issues.close_issue(project_id, issue_iid)

    if result.get("success"):
        return {"status": "closed", "issue_iid": issue_iid}
    else:
        raise HTTPException(status_code=400, detail=result.get("error"))


@app.post("/api/issues/{project_id}/{issue_iid}/reopen")
async def reopen_issue(project_id: int, issue_iid: int):
    """Reopen an issue"""
    if not gitlab_config.is_configured:
        raise HTTPException(status_code=503, detail="GitLab is not configured")

    result = await gitlab_issues.reopen_issue(project_id, issue_iid)

    if result.get("success"):
        return {"status": "reopened", "issue_iid": issue_iid}
    else:
        raise HTTPException(status_code=400, detail=result.get("error"))


# =============================================================================
# Provider-Agnostic API Routes (v2)
# =============================================================================
# These routes work with any configured provider (GitLab, GitHub, etc.)
# Provider is auto-detected from OPTIMAL_PROVIDER env var or token presence

class TicketRequest(BaseModel):
    """Generic ticket creation request"""
    project_id: str
    title: str
    description: str
    severity: str = "medium"
    labels: List[str] = []
    assignee: str = None
    # Optional fields for vulnerability tickets
    vulnerability_id: str = None
    cve_id: str = None
    affected_component: str = None
    # Optional fields for misconfiguration tickets
    finding_id: str = None
    resource_type: str = None
    resource_name: str = None
    compliance_frameworks: List[str] = []
    # Optional fields for POA&M tickets
    poam_id: str = None
    weakness_name: str = None
    controls: List[str] = []
    milestones: List[Dict] = []
    scheduled_completion: str = None
    # Common
    environment: str = None


@app.get("/api/v2/provider/status")
async def get_provider_status():
    """Get current provider status and configuration"""
    try:
        service = get_service()
        connection = await service.test_connection()

        return {
            "provider": service.provider_type.value,
            "connected": connection.get("connected", False),
            "supports": {
                "tickets": service.supports_tickets,
                "ci": service.supports_ci,
                "scm": service.supports_scm,
            },
            "user": connection.get("user"),
        }
    except Exception as e:
        logger.error(f"Error getting provider status: {e}")
        return {
            "provider": "unknown",
            "connected": False,
            "error": str(e),
        }


@app.post("/api/v2/tickets/vulnerability")
async def create_vuln_ticket_v2(request: TicketRequest):
    """Create a vulnerability ticket (provider-agnostic)"""
    try:
        service = get_service()

        if not service.supports_tickets:
            raise HTTPException(
                status_code=503,
                detail=f"Provider {service.provider_type.value} does not support tickets"
            )

        result = await service.create_vulnerability_ticket(
            project_id=request.project_id,
            vulnerability_id=request.vulnerability_id or f"vuln-{uuid.uuid4().hex[:8]}",
            title=request.title,
            severity=request.severity,
            description=request.description,
            cve_id=request.cve_id,
            affected_component=request.affected_component,
            environment=request.environment,
            assignee=request.assignee,
            labels=request.labels,
        )

        return result

    except Exception as e:
        logger.error(f"Error creating vulnerability ticket: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v2/tickets/misconfiguration")
async def create_misconfig_ticket_v2(request: TicketRequest):
    """Create a misconfiguration ticket (provider-agnostic)"""
    try:
        service = get_service()

        if not service.supports_tickets:
            raise HTTPException(
                status_code=503,
                detail=f"Provider {service.provider_type.value} does not support tickets"
            )

        result = await service.create_misconfiguration_ticket(
            project_id=request.project_id,
            finding_id=request.finding_id or f"misconfig-{uuid.uuid4().hex[:8]}",
            title=request.title,
            severity=request.severity,
            description=request.description,
            resource_type=request.resource_type,
            resource_name=request.resource_name,
            compliance_frameworks=request.compliance_frameworks,
            environment=request.environment,
            assignee=request.assignee,
            labels=request.labels,
        )

        return result

    except Exception as e:
        logger.error(f"Error creating misconfiguration ticket: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v2/tickets/poam")
async def create_poam_ticket_v2(request: TicketRequest):
    """Create a POA&M ticket (provider-agnostic)"""
    try:
        service = get_service()

        if not service.supports_tickets:
            raise HTTPException(
                status_code=503,
                detail=f"Provider {service.provider_type.value} does not support tickets"
            )

        result = await service.create_poam_ticket(
            project_id=request.project_id,
            poam_id=request.poam_id or f"poam-{uuid.uuid4().hex[:8]}",
            title=request.title,
            description=request.description,
            weakness_name=request.weakness_name,
            controls=request.controls,
            milestones=request.milestones,
            scheduled_completion=request.scheduled_completion,
            assignee=request.assignee,
            labels=request.labels,
        )

        return result

    except Exception as e:
        logger.error(f"Error creating POA&M ticket: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v2/tickets/{project_id}/{ticket_id}")
async def get_ticket_v2(project_id: str, ticket_id: str):
    """Get a ticket by ID (provider-agnostic)"""
    try:
        service = get_service()

        if not service.supports_tickets:
            raise HTTPException(
                status_code=503,
                detail=f"Provider {service.provider_type.value} does not support tickets"
            )

        ticket = await service.get_ticket(project_id, ticket_id)

        if ticket:
            return ticket
        else:
            raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting ticket: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v2/tickets/{project_id}")
async def search_tickets_v2(
    project_id: str,
    labels: str = Query(None, description="Comma-separated labels"),
    status: str = Query(None, description="Ticket status"),
    search: str = Query(None, description="Search term"),
):
    """Search tickets (provider-agnostic)"""
    try:
        service = get_service()

        if not service.supports_tickets:
            raise HTTPException(
                status_code=503,
                detail=f"Provider {service.provider_type.value} does not support tickets"
            )

        label_list = labels.split(",") if labels else None

        tickets = await service.search_tickets(
            project_id=project_id,
            labels=label_list,
            status=status,
            search=search,
        )

        return {
            "project_id": project_id,
            "provider": service.provider_type.value,
            "total": len(tickets),
            "tickets": tickets,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching tickets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v2/tickets/{project_id}/{ticket_id}/comment")
async def add_comment_v2(project_id: str, ticket_id: str, body: str):
    """Add a comment to a ticket (provider-agnostic)"""
    try:
        service = get_service()

        if not service.supports_tickets:
            raise HTTPException(
                status_code=503,
                detail=f"Provider {service.provider_type.value} does not support tickets"
            )

        result = await service.add_comment(project_id, ticket_id, body)
        return result

    except Exception as e:
        logger.error(f"Error adding comment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v2/tickets/{project_id}/{ticket_id}/close")
async def close_ticket_v2(project_id: str, ticket_id: str):
    """Close a ticket (provider-agnostic)"""
    try:
        service = get_service()

        if not service.supports_tickets:
            raise HTTPException(
                status_code=503,
                detail=f"Provider {service.provider_type.value} does not support tickets"
            )

        result = await service.close_ticket(project_id, ticket_id)
        return {"status": "closed", "ticket_id": ticket_id, **result}

    except Exception as e:
        logger.error(f"Error closing ticket: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v2/tickets/auto-create")
async def auto_create_tickets_v2(
    scan_results: Dict[str, Any],
    project_id: str = Query(...),
    environment: str = Query(...),
    severity_threshold: str = Query(default="high"),
):
    """
    Automatically create tickets from scan results (provider-agnostic).

    Works with any configured provider (GitLab, GitHub, etc.)
    """
    try:
        service = get_service()

        if not service.supports_tickets:
            raise HTTPException(
                status_code=503,
                detail=f"Provider {service.provider_type.value} does not support tickets"
            )

        if severity_threshold.lower() not in ["critical", "high", "medium", "low", "informational"]:
            raise HTTPException(status_code=400, detail="Invalid severity threshold")

        result = await auto_create_tickets_from_scan(
            service=service,
            project_id=project_id,
            scan_results=scan_results,
            environment=environment,
            severity_threshold=severity_threshold,
        )

        result["provider"] = service.provider_type.value
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error auto-creating tickets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Lifecycle Events
# =============================================================================

@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown"""
    await gitlab_issues.close()
    await close_service()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
