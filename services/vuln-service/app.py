from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import json
import logging
import time
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Vulnerability Service", version="1.0.0")

# Enhanced Models for JADE-like CVE Management
class ProjectInfo(BaseModel):
    gitlab_project_id: int

class SourceInfo(BaseModel):
    pipeline_id: int
    job_id: int
    sha: str

class VulnIngestRequest(BaseModel):
    grype: Dict[str, Any]
    project: ProjectInfo
    source: SourceInfo

class Finding(BaseModel):
    vuln_id: str
    severity: Optional[str] = None
    epss_score: Optional[float] = None
    epss_percentile: Optional[float] = None
    status: str = "OPEN"
    gitlab_project_id: int
    pipeline_id: int
    job_id: int
    sha: str
    image_digest: Optional[str] = None
    image_tag: Optional[str] = None
    source_url: Optional[str] = None
    grype_data: Dict[str, Any]

class CVEDetails(BaseModel):
    id: str
    vuln_id: str
    severity: str
    status: str
    cvss_raw: Optional[float] = None
    cvss_version: Optional[str] = None
    cvss_vector: Optional[str] = None
    description: Optional[str] = None
    reference_links: Optional[List[str]] = None
    location: Optional[str] = None
    solution: Optional[str] = None
    package_affected: Optional[str] = None
    package_version: Optional[str] = None
    gitlab_project_id: Optional[int] = None
    pipeline_id: Optional[int] = None
    job_id: Optional[int] = None
    sha: Optional[str] = None
    image_digest: Optional[str] = None
    image_tag: Optional[str] = None
    source_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class DeveloperInput(BaseModel):
    id: str
    cve_id: str
    comment: str
    author: str
    created_at: datetime
    status: str = "PENDING"

class Milestone(BaseModel):
    id: str
    cve_id: str
    milestone_complete_date: Optional[datetime] = None
    scheduled_complete_date: Optional[datetime] = None
    milestone_changes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class CyberAcceptance(BaseModel):
    id: str
    cve_id: str
    cyber_comments: Optional[str] = None
    status: str = "PENDING"
    accepted_by: Optional[str] = None
    accepted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class RiskCalculator(BaseModel):
    id: str
    cve_id: str
    base_score: float
    impact_subscore: float
    exploitability_subscore: float
    temporal_score: Optional[float] = None
    environmental_score: Optional[float] = None
    overall_score: float
    attack_vector: str
    attack_complexity: str
    privileges_required: str
    user_interaction: str
    scope: str
    confidentiality_impact: str
    integrity_impact: str
    availability_impact: str
    created_at: datetime
    updated_at: datetime

# Database models (simplified for MVP)
class Database:
    def __init__(self):
        # In MVP, we'll use simple in-memory storage
        # In production, this would be PostgreSQL
        self.findings = {}
        self.cve_details = {}
        self.developer_inputs = {}
        self.milestones = {}
        self.cyber_acceptance = {}
        self.risk_calculators = {}
    
    def upsert_findings(self, grype_data: dict, project_info: ProjectInfo, source_info: SourceInfo):
        """Process Grype results and store findings"""
        findings = []
        
        # Extract matches from Grype output
        matches = grype_data.get("matches", [])
        
        for match in matches:
            # Generate unique ID for the finding
            finding_id = str(uuid.uuid4())
            
            # Extract vulnerability information
            vuln = match.get("vulnerability", {})
            artifact = match.get("artifact", {})
            
            finding = Finding(
                vuln_id=vuln.get("id", "unknown"),
                severity=vuln.get("severity"),
                status="OPEN",  # Default status
                gitlab_project_id=project_info.gitlab_project_id,
                pipeline_id=source_info.pipeline_id,
                job_id=source_info.job_id,
                sha=source_info.sha,
                grype_data=match
            )
            
            # Store finding
            finding_record = {
                "id": finding_id,
                "vuln_id": finding.vuln_id,
                "severity": finding.severity,
                "epss_score": finding.epss_score,
                "epss_percentile": finding.epss_percentile,
                "status": finding.status,
                "gitlab_project_id": finding.gitlab_project_id,
                "pipeline_id": finding.pipeline_id,
                "job_id": finding.job_id,
                "sha": finding.sha,
                "image_digest": finding.image_digest,
                "image_tag": finding.image_tag,
                "source_url": finding.source_url,
                "grype_data": finding.grype_data,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            self.findings[finding_id] = finding_record
            
            # Create CVE details
            cve_id = str(uuid.uuid4())
            cve_record = {
                "id": cve_id,
                "vuln_id": finding.vuln_id,
                "severity": finding.severity,
                "status": "OPEN",
                "cvss_raw": self._extract_cvss_score(vuln),
                "cvss_version": "3.1",
                "cvss_vector": vuln.get("cvss", {}).get("vector"),
                "description": vuln.get("description"),
                "reference_links": vuln.get("urls", []),
                "location": artifact.get("location"),
                "solution": "",
                "package_affected": artifact.get("name"),
                "package_version": artifact.get("version"),
                "gitlab_project_id": finding.gitlab_project_id,
                "pipeline_id": finding.pipeline_id,
                "job_id": finding.job_id,
                "sha": finding.sha,
                "image_digest": finding.image_digest,
                "image_tag": finding.image_tag,
                "source_url": finding.source_url,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            self.cve_details[cve_id] = cve_record
            
            # Create risk calculator entry
            risk_id = str(uuid.uuid4())
            risk_record = self._calculate_cvss_risk(vuln, cve_record["cvss_raw"])
            risk_record["id"] = risk_id
            risk_record["cve_id"] = cve_id
            risk_record["created_at"] = datetime.utcnow().isoformat()
            risk_record["updated_at"] = datetime.utcnow().isoformat()
            
            self.risk_calculators[risk_id] = risk_record
            
            findings.append(finding_record)
        
        logger.info(f"Stored {len(findings)} vulnerability findings for pipeline {source_info.pipeline_id}")
        return {"findings_count": len(findings), "findings": findings}
    
    def _extract_cvss_score(self, vuln: dict) -> Optional[float]:
        """Extract CVSS score from vulnerability data"""
        cvss_data = vuln.get("cvss", {})
        if cvss_data:
            return cvss_data.get("score")
        return None
    
    def _calculate_cvss_risk(self, vuln: dict, cvss_score: Optional[float]) -> Dict[str, Any]:
        """Calculate CVSS risk metrics"""
        # Default values for MVP
        return {
            "base_score": cvss_score or 0.0,
            "impact_subscore": 0.0,
            "exploitability_subscore": 0.0,
            "temporal_score": 0.0,
            "environmental_score": 0.0,
            "overall_score": cvss_score or 0.0,
            "attack_vector": "NETWORK",
            "attack_complexity": "LOW",
            "privileges_required": "NONE",
            "user_interaction": "REQUIRED",
            "scope": "UNCHANGED",
            "confidentiality_impact": "NONE",
            "integrity_impact": "NONE",
            "availability_impact": "HIGH"
        }
    
    def get_findings_by_project(self, gitlab_project_id: int) -> List[dict]:
        """Get all findings for a specific GitLab project"""
        return [
            finding for finding in self.findings.values()
            if finding["gitlab_project_id"] == gitlab_project_id
        ]
    
    def get_findings_by_pipeline(self, gitlab_project_id: int, pipeline_id: int) -> List[dict]:
        """Get findings for a specific pipeline"""
        return [
            finding for finding in self.findings.values()
            if (finding["gitlab_project_id"] == gitlab_project_id and 
                finding["pipeline_id"] == pipeline_id)
        ]
    
    def get_findings_by_vuln_id(self, vuln_id: str) -> List[dict]:
        """Get all findings for a specific vulnerability ID"""
        return [
            finding for finding in self.findings.values()
            if finding["vuln_id"] == vuln_id
        ]
    
    def get_cve_details(self, cve_id: str) -> Optional[dict]:
        """Get detailed CVE information"""
        return self.cve_details.get(cve_id)
    
    def update_finding_status(self, finding_id: str, status: str):
        """Update the status of a finding"""
        if finding_id in self.findings:
            self.findings[finding_id]["status"] = status
            self.findings[finding_id]["updated_at"] = datetime.utcnow().isoformat()
            return {"status": "updated", "finding_id": finding_id}
        else:
            raise ValueError("Finding not found")
    
    def add_developer_input(self, cve_id: str, comment: str, author: str) -> dict:
        """Add developer input for a CVE"""
        input_id = str(uuid.uuid4())
        input_record = {
            "id": input_id,
            "cve_id": cve_id,
            "comment": comment,
            "author": author,
            "status": "PENDING",
            "created_at": datetime.utcnow().isoformat()
        }
        self.developer_inputs[input_id] = input_record
        return input_record
    
    def update_milestone(self, cve_id: str, milestone_data: dict) -> dict:
        """Update milestone information for a CVE"""
        if cve_id in self.milestones:
            self.milestones[cve_id].update(milestone_data)
            self.milestones[cve_id]["updated_at"] = datetime.utcnow().isoformat()
        else:
            milestone_id = str(uuid.uuid4())
            self.milestones[cve_id] = {
                "id": milestone_id,
                "cve_id": cve_id,
                **milestone_data,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
        return self.milestones[cve_id]
    
    def update_cyber_acceptance(self, cve_id: str, acceptance_data: dict) -> dict:
        """Update cyber acceptance for a CVE"""
        if cve_id in self.cyber_acceptance:
            self.cyber_acceptance[cve_id].update(acceptance_data)
            self.cyber_acceptance[cve_id]["updated_at"] = datetime.utcnow().isoformat()
        else:
            acceptance_id = str(uuid.uuid4())
            self.cyber_acceptance[cve_id] = {
                "id": acceptance_id,
                "cve_id": cve_id,
                **acceptance_data,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
        return self.cyber_acceptance[cve_id]

db = Database()

# Routes
@app.get("/api/vulns")
async def get_all_vulnerabilities():
    """Get all vulnerabilities"""
    try:
        # Return all vulnerability findings
        findings = list(db.findings.values())
        return findings
    except Exception as e:
        logger.error(f"Error retrieving all vulnerabilities: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve vulnerabilities")

@app.get("/api/vulns/monitors")
async def get_vulnerability_monitors():
    """Get vulnerability monitoring configurations"""
    try:
        monitors = [
            {
                "id": "monitor-001",
                "name": "Critical Vulnerabilities Monitor",
                "description": "Monitors for critical severity vulnerabilities",
                "severity_threshold": "critical",
                "enabled": True,
                "alert_channels": ["email", "slack"],
                "created_at": "2024-01-15T09:00:00Z",
                "last_triggered": "2024-01-15T10:30:00Z",
                "trigger_count": 5
            },
            {
                "id": "monitor-002",
                "name": "New Package Vulnerabilities",
                "description": "Alerts when new vulnerabilities are found in monitored packages",
                "severity_threshold": "high",
                "enabled": True,
                "alert_channels": ["email"],
                "created_at": "2024-01-15T09:15:00Z",
                "last_triggered": "2024-01-15T11:00:00Z",
                "trigger_count": 12
            }
        ]
        return {"monitors": monitors, "total": len(monitors)}
    except Exception as e:
        logger.error(f"Error getting monitors: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/vulns/events")
async def get_vulnerability_events():
    """Get vulnerability events and timeline"""
    try:
        events = [
            {
                "id": "event-001",
                "type": "vulnerability_detected",
                "title": "New High Severity Vulnerability Detected",
                "description": "CVE-2024-1234 was detected in flask-sqlalchemy 2.5.1",
                "severity": "high",
                "timestamp": "2024-01-15T10:30:00Z",
                "vulnerability_id": "vuln-001",
                "user": "security.scanner@company.com"
            },
            {
                "id": "event-002",
                "type": "vulnerability_assigned",
                "title": "Vulnerability Assigned",
                "description": "CVE-2024-1234 assigned to john.doe@company.com",
                "severity": "info",
                "timestamp": "2024-01-15T10:35:00Z",
                "vulnerability_id": "vuln-001",
                "user": "security.team@company.com"
            },
            {
                "id": "event-003",
                "type": "comment_added",
                "title": "Comment Added",
                "description": "Security team added a comment to CVE-2024-1234",
                "severity": "info",
                "timestamp": "2024-01-15T10:35:00Z",
                "vulnerability_id": "vuln-001",
                "user": "security.team@company.com"
            }
        ]
        return {"events": events, "total": len(events)}
    except Exception as e:
        logger.error(f"Error getting events: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/vulns/suppressions")
async def get_vulnerability_suppressions():
    """Get vulnerability suppressions"""
    try:
        suppressions = [
            {
                "id": "supp-001",
                "vulnerability_id": "vuln-003",
                "cve": "CVE-2024-9999",
                "reason": "False positive - not exploitable in our environment",
                "suppressed_by": "security.team@company.com",
                "suppressed_at": "2024-01-15T12:00:00Z",
                "expires_at": "2024-04-15T12:00:00Z",
                "status": "active"
            }
        ]
        return {"suppressions": suppressions, "total": len(suppressions)}
    except Exception as e:
        logger.error(f"Error getting suppressions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/vulns/invalid-installs")
async def get_invalid_installs():
    """Get invalid package installations"""
    try:
        invalid_installs = [
            {
                "id": "invalid-001",
                "package": "malicious-package",
                "version": "1.0.0",
                "reason": "Package not found in approved registry",
                "detected_at": "2024-01-15T13:00:00Z",
                "status": "blocked"
            }
        ]
        return {"invalid_installs": invalid_installs, "total": len(invalid_installs)}
    except Exception as e:
        logger.error(f"Error getting invalid installs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/vulns/plans")
async def get_remediation_plans():
    """Get remediation plans"""
    try:
        plans = [
            {
                "id": "plan-001",
                "name": "Q1 2024 Security Remediation",
                "description": "Comprehensive security remediation plan for Q1 2024",
                "vulnerabilities": ["vuln-001", "vuln-002"],
                "priority": "high",
                "status": "active",
                "created_at": "2024-01-01T00:00:00Z",
                "target_completion": "2024-03-31T23:59:59Z",
                "progress": 65
            }
        ]
        return {"plans": plans, "total": len(plans)}
    except Exception as e:
        logger.error(f"Error getting plans: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/vulns/{vulnerability_id}")
async def update_vulnerability(vulnerability_id: str, update_data: dict):
    """Update vulnerability details"""
    try:
        # Mock update - in production, this would update the database
        logger.info(f"Updating vulnerability {vulnerability_id} with data: {update_data}")
        
        return {
            "id": vulnerability_id,
            "status": "updated",
            "message": "Vulnerability updated successfully",
            "updated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error updating vulnerability {vulnerability_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vulns/{vulnerability_id}/comments")
async def add_vulnerability_comment(vulnerability_id: str, comment_data: dict):
    """Add comment to vulnerability"""
    try:
        comment = {
            "id": f"comment-{int(time.time())}",
            "vulnerability_id": vulnerability_id,
            "author": comment_data.get("author", "user@company.com"),
            "content": comment_data.get("content", ""),
            "created_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Added comment to vulnerability {vulnerability_id}")
        return comment
    except Exception as e:
        logger.error(f"Error adding comment to vulnerability {vulnerability_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vulns/{vulnerability_id}/assign")
async def assign_vulnerability(vulnerability_id: str, assignment_data: dict):
    """Assign vulnerability to user"""
    try:
        assignee = assignment_data.get("assignee")
        logger.info(f"Assigned vulnerability {vulnerability_id} to {assignee}")
        
        return {
            "vulnerability_id": vulnerability_id,
            "assignee": assignee,
            "assigned_at": datetime.utcnow().isoformat(),
            "status": "assigned"
        }
    except Exception as e:
        logger.error(f"Error assigning vulnerability {vulnerability_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vulns/{vulnerability_id}/suppress")
async def suppress_vulnerability(vulnerability_id: str, suppression_data: dict):
    """Suppress vulnerability"""
    try:
        reason = suppression_data.get("reason", "")
        expires_at = suppression_data.get("expires_at")
        
        logger.info(f"Suppressed vulnerability {vulnerability_id} with reason: {reason}")
        
        return {
            "vulnerability_id": vulnerability_id,
            "suppressed": True,
            "reason": reason,
            "suppressed_at": datetime.utcnow().isoformat(),
            "expires_at": expires_at
        }
    except Exception as e:
        logger.error(f"Error suppressing vulnerability {vulnerability_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vulns/bulk-update")
async def bulk_update_vulnerabilities(update_data: dict):
    """Bulk update vulnerabilities"""
    try:
        vulnerability_ids = update_data.get("vulnerability_ids", [])
        updates = update_data.get("updates", {})
        
        logger.info(f"Bulk updating {len(vulnerability_ids)} vulnerabilities with updates: {updates}")
        
        return {
            "updated_count": len(vulnerability_ids),
            "status": "success",
            "message": f"Successfully updated {len(vulnerability_ids)} vulnerabilities"
        }
    except Exception as e:
        logger.error(f"Error bulk updating vulnerabilities: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vulns/grype")
async def ingest_grype(request: VulnIngestRequest):
    """Ingest Grype vulnerability scan results"""
    try:
        logger.info(f"Ingesting Grype results for project {request.project.gitlab_project_id}, pipeline {request.source.pipeline_id}")
        
        # Process and store findings
        result = db.upsert_findings(
            request.grype,
            request.project,
            request.source
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error ingesting Grype results: {e}")
        raise HTTPException(status_code=500, detail="Failed to ingest vulnerability data")

@app.get("/api/vulns/project/{gitlab_project_id}", response_model=List[Finding])
async def get_project_vulnerabilities(gitlab_project_id: int):
    """Get all vulnerability findings for a GitLab project"""
    try:
        findings = db.get_findings_by_project(gitlab_project_id)
        return findings
    except Exception as e:
        logger.error(f"Error retrieving findings: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve findings")

@app.get("/api/vulns/pipeline/{gitlab_project_id}/{pipeline_id}", response_model=List[Finding])
async def get_pipeline_vulnerabilities(gitlab_project_id: int, pipeline_id: int):
    """Get vulnerability findings for a specific pipeline"""
    try:
        findings = db.get_findings_by_pipeline(gitlab_project_id, pipeline_id)
        return findings
    except Exception as e:
        logger.error(f"Error retrieving pipeline findings: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve pipeline findings")

@app.get("/api/vulns/{vuln_id}")
async def get_vulnerability_details(vuln_id: str):
    """Get all findings for a specific vulnerability ID"""
    try:
        findings = db.get_findings_by_vuln_id(vuln_id)
        return {
            "vuln_id": vuln_id,
            "findings_count": len(findings),
            "findings": findings
        }
    except Exception as e:
        logger.error(f"Error retrieving vulnerability findings: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve vulnerability findings")

@app.put("/api/vulns/{finding_id}/status")
async def update_finding_status(finding_id: str, status: str):
    """Update the status of a vulnerability finding"""
    try:
        result = db.update_finding_status(finding_id, status)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating finding status: {e}")
        raise HTTPException(status_code=500, detail="Failed to update finding status")

# Enhanced CVE Management Routes
@app.get("/api/cve/{cve_id}")
async def get_cve_details(cve_id: str):
    """Get detailed CVE information"""
    try:
        cve = db.get_cve_details(cve_id)
        if not cve:
            raise HTTPException(status_code=404, detail="CVE not found")
        return cve
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving CVE details: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve CVE details")

@app.post("/api/cve/{cve_id}/developer-input")
async def add_developer_input(cve_id: str, comment: str, author: str):
    """Add developer input for a CVE"""
    try:
        result = db.add_developer_input(cve_id, comment, author)
        return result
    except Exception as e:
        logger.error(f"Error adding developer input: {e}")
        raise HTTPException(status_code=500, detail="Failed to add developer input")

@app.put("/api/cve/{cve_id}/milestone")
async def update_milestone(cve_id: str, milestone_data: dict):
    """Update milestone information for a CVE"""
    try:
        result = db.update_milestone(cve_id, milestone_data)
        return result
    except Exception as e:
        logger.error(f"Error updating milestone: {e}")
        raise HTTPException(status_code=500, detail="Failed to update milestone")

@app.put("/api/cve/{cve_id}/cyber-acceptance")
async def update_cyber_acceptance(cve_id: str, acceptance_data: dict):
    """Update cyber acceptance for a CVE"""
    try:
        result = db.update_cyber_acceptance(cve_id, acceptance_data)
        return result
    except Exception as e:
        logger.error(f"Error updating cyber acceptance: {e}")
        raise HTTPException(status_code=500, detail="Failed to update cyber acceptance")

@app.get("/api/cve/{cve_id}/risk-calculator")
async def get_risk_calculator(cve_id: str):
    """Get risk calculator information for a CVE"""
    try:
        # Find risk calculator by CVE ID
        for risk_id, risk_data in db.risk_calculators.items():
            if risk_data["cve_id"] == cve_id:
                return risk_data
        
        raise HTTPException(status_code=404, detail="Risk calculator not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving risk calculator: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve risk calculator")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "vuln-service"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Vulnerability Service", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
