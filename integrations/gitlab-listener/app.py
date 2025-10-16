from fastapi import FastAPI, HTTPException, Header, Query, File, UploadFile, Form
from pydantic import BaseModel
import json
import logging
import os
import httpx
import zipfile
import io
import re
import gzip
from typing import Optional, Dict, Any
import uuid
from datetime import datetime
import asyncpg
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="GitLab Integration Service", version="1.0.0")

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
    return {"status": "healthy", "service": "gitlab-listener"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "GitLab Integration Service", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
