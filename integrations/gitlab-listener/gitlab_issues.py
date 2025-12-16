"""
GitLab Issues Integration Module
Automated ticket creation from vulnerability findings, misconfigurations, and POA&M items.

Integrates with self-hosted GitLab for FedRAMP compliance.
"""

import asyncio
import hashlib
import json
import logging
import os
import re
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional

import httpx
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# =============================================================================
# Configuration
# =============================================================================

class GitLabConfig:
    """GitLab configuration from environment variables"""
    def __init__(self):
        self.base_url = os.getenv("GITLAB_BASE_URL", "http://gitlab:80").rstrip("/")
        self.token = os.getenv("GITLAB_TOKEN", "")
        self.project_id = os.getenv("GITLAB_PROJECT_ID", "")
        # Issue configuration
        self.vuln_label = os.getenv("GITLAB_VULN_LABEL", "vulnerability")
        self.misconfig_label = os.getenv("GITLAB_MISCONFIG_LABEL", "misconfiguration")
        self.poam_label = os.getenv("GITLAB_POAM_LABEL", "poam")
        self.auto_label = os.getenv("GITLAB_AUTO_LABEL", "auto-created")
        self.default_assignee = os.getenv("GITLAB_DEFAULT_ASSIGNEE", "")
        # SLA configuration (days)
        self.sla_critical = int(os.getenv("GITLAB_SLA_CRITICAL_DAYS", "7"))
        self.sla_high = int(os.getenv("GITLAB_SLA_HIGH_DAYS", "30"))
        self.sla_medium = int(os.getenv("GITLAB_SLA_MEDIUM_DAYS", "90"))
        self.sla_low = int(os.getenv("GITLAB_SLA_LOW_DAYS", "180"))

    @property
    def is_configured(self) -> bool:
        return bool(self.base_url and self.token)

    @property
    def headers(self) -> Dict[str, str]:
        return {
            "PRIVATE-TOKEN": self.token,
            "Content-Type": "application/json"
        }


config = GitLabConfig()


# =============================================================================
# Models
# =============================================================================

class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFORMATIONAL = "informational"
    UNKNOWN = "unknown"


class VulnerabilityIssueRequest(BaseModel):
    """Request to create an issue from a vulnerability finding"""
    vuln_id: str = Field(..., description="CVE ID or vulnerability identifier")
    severity: str = Field(..., description="Vulnerability severity")
    title: str = Field(..., description="Issue title")
    description: str = Field(..., description="Full vulnerability description")
    affected_package: str = Field(..., description="Affected package name")
    affected_version: str = Field(..., description="Affected package version")
    fixed_version: Optional[str] = Field(None, description="Fixed version if available")
    cvss_score: Optional[float] = Field(None, description="CVSS score")
    environment: str = Field(..., description="Environment (prod, staging, dev)")
    affected_asset: str = Field(..., description="Affected asset (container, service, host)")
    source_scan_id: Optional[str] = Field(None, description="Source scan ID")
    pipeline_id: Optional[int] = Field(None, description="Related pipeline ID")
    job_id: Optional[int] = Field(None, description="Related job ID")
    project_id: Optional[int] = Field(None, description="GitLab project ID")
    additional_labels: Optional[List[str]] = Field(default=[], description="Additional labels")


class MisconfigurationIssueRequest(BaseModel):
    """Request to create an issue from a misconfiguration"""
    config_id: str = Field(..., description="Configuration check ID")
    severity: str = Field(..., description="Severity level")
    title: str = Field(..., description="Issue title")
    description: str = Field(..., description="Description of misconfiguration")
    resource_type: str = Field(..., description="Resource type (K8s, container, etc)")
    resource_name: str = Field(..., description="Name of affected resource")
    environment: str = Field(..., description="Environment where found")
    compliance_framework: Optional[str] = Field(None, description="Related compliance framework")
    remediation_steps: Optional[str] = Field(None, description="Steps to remediate")
    expected_value: Optional[str] = Field(None, description="Expected configuration value")
    actual_value: Optional[str] = Field(None, description="Actual configuration value")
    project_id: Optional[int] = Field(None, description="GitLab project ID")


class POAMIssueRequest(BaseModel):
    """Request to create/sync a POA&M item"""
    poam_id: str = Field(..., description="POA&M unique identifier")
    title: str = Field(..., description="POA&M item title")
    description: str = Field(..., description="Full description")
    weakness: str = Field(..., description="Identified weakness")
    risk_level: str = Field(..., description="Risk level")
    remediation_plan: str = Field(..., description="Planned remediation actions")
    scheduled_completion: str = Field(..., description="Scheduled completion date")
    milestone: Optional[str] = Field(None, description="Current milestone")
    responsible_party: Optional[str] = Field(None, description="Person/team responsible")
    compliance_framework: Optional[str] = Field(None, description="Related compliance framework")
    related_vulns: Optional[List[str]] = Field(default=[], description="Related vulnerability IDs")
    project_id: Optional[int] = Field(None, description="GitLab project ID")


class BulkIssueRequest(BaseModel):
    """Request to create multiple issues"""
    vulnerabilities: Optional[List[VulnerabilityIssueRequest]] = []
    misconfigurations: Optional[List[MisconfigurationIssueRequest]] = []
    project_id: Optional[int] = Field(None, description="GitLab project ID for all issues")


class IssueResponse(BaseModel):
    """Response after issue creation"""
    success: bool
    issue_iid: Optional[int] = None
    issue_url: Optional[str] = None
    message: str
    created_at: str


# =============================================================================
# GitLab Issues Client
# =============================================================================

class GitLabIssuesClient:
    """Async GitLab Issues API client"""

    def __init__(self, config: GitLabConfig):
        self.config = config
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers=self.config.headers,
                timeout=httpx.Timeout(30.0)
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def test_connection(self) -> Dict[str, Any]:
        """Test connection to GitLab"""
        client = await self._get_client()
        try:
            resp = await client.get(f"{self.config.base_url}/api/v4/user")
            if resp.status_code == 200:
                data = resp.json()
                return {"connected": True, "user": data.get("username")}
            return {"connected": False, "error": f"Status {resp.status_code}"}
        except Exception as e:
            return {"connected": False, "error": str(e)}

    async def create_issue(
        self,
        project_id: int,
        title: str,
        description: str,
        labels: List[str] = None,
        assignee_username: str = None,
        due_date: str = None,
        milestone_id: int = None,
        weight: int = None
    ) -> Dict[str, Any]:
        """Create a GitLab issue"""
        client = await self._get_client()

        payload = {
            "title": title,
            "description": description,
        }

        if labels:
            payload["labels"] = ",".join(labels)

        if assignee_username:
            # Get user ID from username
            user_id = await self._get_user_id(assignee_username)
            if user_id:
                payload["assignee_ids"] = [user_id]

        if due_date:
            payload["due_date"] = due_date

        if milestone_id:
            payload["milestone_id"] = milestone_id

        if weight:
            payload["weight"] = weight

        try:
            resp = await client.post(
                f"{self.config.base_url}/api/v4/projects/{project_id}/issues",
                json=payload
            )

            if resp.status_code in [200, 201]:
                data = resp.json()
                return {
                    "success": True,
                    "iid": data.get("iid"),
                    "id": data.get("id"),
                    "url": data.get("web_url"),
                    "state": data.get("state")
                }
            else:
                error_text = resp.text
                logger.error(f"GitLab create issue failed: {resp.status_code} - {error_text}")
                return {"success": False, "error": error_text}
        except Exception as e:
            logger.error(f"GitLab create issue exception: {e}")
            return {"success": False, "error": str(e)}

    async def update_issue(
        self,
        project_id: int,
        issue_iid: int,
        **kwargs
    ) -> Dict[str, Any]:
        """Update a GitLab issue"""
        client = await self._get_client()

        # Filter out None values
        payload = {k: v for k, v in kwargs.items() if v is not None}

        if "labels" in payload and isinstance(payload["labels"], list):
            payload["labels"] = ",".join(payload["labels"])

        try:
            resp = await client.put(
                f"{self.config.base_url}/api/v4/projects/{project_id}/issues/{issue_iid}",
                json=payload
            )

            if resp.status_code == 200:
                return {"success": True, "iid": issue_iid}
            else:
                return {"success": False, "error": resp.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def close_issue(self, project_id: int, issue_iid: int) -> Dict[str, Any]:
        """Close an issue"""
        return await self.update_issue(project_id, issue_iid, state_event="close")

    async def reopen_issue(self, project_id: int, issue_iid: int) -> Dict[str, Any]:
        """Reopen an issue"""
        return await self.update_issue(project_id, issue_iid, state_event="reopen")

    async def add_comment(
        self,
        project_id: int,
        issue_iid: int,
        body: str
    ) -> Dict[str, Any]:
        """Add a comment to an issue"""
        client = await self._get_client()

        try:
            resp = await client.post(
                f"{self.config.base_url}/api/v4/projects/{project_id}/issues/{issue_iid}/notes",
                json={"body": body}
            )

            if resp.status_code == 201:
                data = resp.json()
                return {"success": True, "note_id": data.get("id")}
            else:
                return {"success": False, "error": resp.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def get_issue(self, project_id: int, issue_iid: int) -> Optional[Dict[str, Any]]:
        """Get issue details"""
        client = await self._get_client()

        try:
            resp = await client.get(
                f"{self.config.base_url}/api/v4/projects/{project_id}/issues/{issue_iid}"
            )
            if resp.status_code == 200:
                return resp.json()
            return None
        except Exception as e:
            logger.error(f"Failed to get issue {issue_iid}: {e}")
            return None

    async def search_issues(
        self,
        project_id: int,
        labels: List[str] = None,
        state: str = None,
        search: str = None,
        per_page: int = 50
    ) -> List[Dict[str, Any]]:
        """Search issues"""
        client = await self._get_client()

        params = {"per_page": per_page}

        if labels:
            params["labels"] = ",".join(labels)
        if state:
            params["state"] = state
        if search:
            params["search"] = search

        try:
            resp = await client.get(
                f"{self.config.base_url}/api/v4/projects/{project_id}/issues",
                params=params
            )
            if resp.status_code == 200:
                return resp.json()
            return []
        except Exception as e:
            logger.error(f"GitLab search failed: {e}")
            return []

    async def find_existing_vuln_issue(
        self,
        project_id: int,
        vuln_id: str,
        environment: str = None
    ) -> Optional[int]:
        """Find existing issue for a vulnerability to avoid duplicates"""
        labels = [self.config.vuln_label, f"cve:{vuln_id}"]
        if environment:
            labels.append(f"env:{environment}")

        issues = await self.search_issues(project_id, labels=labels, state="opened")
        if issues:
            return issues[0].get("iid")
        return None

    async def find_existing_poam_issue(
        self,
        project_id: int,
        poam_id: str
    ) -> Optional[int]:
        """Find existing issue for a POA&M item"""
        labels = [self.config.poam_label, f"poam:{poam_id}"]
        issues = await self.search_issues(project_id, labels=labels)
        if issues:
            return issues[0].get("iid")
        return None

    async def _get_user_id(self, username: str) -> Optional[int]:
        """Get user ID from username"""
        client = await self._get_client()
        try:
            resp = await client.get(
                f"{self.config.base_url}/api/v4/users",
                params={"username": username}
            )
            if resp.status_code == 200:
                users = resp.json()
                if users:
                    return users[0].get("id")
        except Exception as e:
            logger.warning(f"Failed to get user ID for {username}: {e}")
        return None

    async def link_issue_to_pipeline(
        self,
        project_id: int,
        issue_iid: int,
        pipeline_id: int
    ) -> Dict[str, Any]:
        """Add a note linking issue to pipeline"""
        pipeline_url = f"{self.config.base_url}/projects/{project_id}/-/pipelines/{pipeline_id}"
        comment = f"🔗 Related to pipeline: {pipeline_url}"
        return await self.add_comment(project_id, issue_iid, comment)

    async def create_issue_from_mr(
        self,
        project_id: int,
        mr_iid: int,
        title: str,
        description: str,
        labels: List[str] = None
    ) -> Dict[str, Any]:
        """Create an issue linked to a merge request"""
        # Create the issue
        result = await self.create_issue(project_id, title, description, labels)

        if result.get("success"):
            issue_iid = result.get("iid")
            # Add MR reference in comment
            mr_url = f"{self.config.base_url}/projects/{project_id}/-/merge_requests/{mr_iid}"
            await self.add_comment(
                project_id,
                issue_iid,
                f"🔗 Created from merge request: {mr_url}"
            )

        return result


# Global client instance
gitlab_issues = GitLabIssuesClient(config)


# =============================================================================
# Helper Functions
# =============================================================================

def severity_to_weight(severity: str) -> int:
    """Map severity to GitLab issue weight (1-10)"""
    mapping = {
        "critical": 10,
        "high": 7,
        "medium": 4,
        "low": 2,
        "informational": 1,
        "unknown": 3
    }
    return mapping.get(severity.lower(), 3)


def severity_to_due_date(severity: str) -> str:
    """Calculate due date based on severity SLA"""
    days_mapping = {
        "critical": config.sla_critical,
        "high": config.sla_high,
        "medium": config.sla_medium,
        "low": config.sla_low,
        "informational": config.sla_low,
        "unknown": config.sla_medium
    }
    days = days_mapping.get(severity.lower(), config.sla_medium)
    due_date = datetime.utcnow() + timedelta(days=days)
    return due_date.strftime("%Y-%m-%d")


def generate_vuln_description(request: VulnerabilityIssueRequest) -> str:
    """Generate formatted vulnerability description for GitLab"""
    description = f"""## Vulnerability Details

| Field | Value |
|-------|-------|
| **CVE ID** | `{request.vuln_id}` |
| **Severity** | {request.severity.upper()} |
| **CVSS Score** | {request.cvss_score or 'N/A'} |
| **Environment** | {request.environment} |
| **Affected Asset** | {request.affected_asset} |

## Affected Package

| Package | Version | Fixed Version |
|---------|---------|---------------|
| `{request.affected_package}` | `{request.affected_version}` | `{request.fixed_version or 'Not available'}` |

## Description

{request.description}

## Remediation

"""
    if request.fixed_version:
        description += f"Upgrade `{request.affected_package}` to version `{request.fixed_version}` or later.\n\n"
    else:
        description += "No fix is currently available. Consider implementing compensating controls.\n\n"

    # Add pipeline/job links if available
    if request.pipeline_id and request.project_id:
        description += f"""## Source

- Pipeline: `#{request.pipeline_id}`
"""
        if request.job_id:
            description += f"- Job: `#{request.job_id}`\n"

    if request.source_scan_id:
        description += f"- Scan ID: `{request.source_scan_id}`\n"

    description += f"\n---\n_Auto-generated by Optimal Platform at {datetime.utcnow().isoformat()}Z_"

    return description


def generate_misconfig_description(request: MisconfigurationIssueRequest) -> str:
    """Generate formatted misconfiguration description for GitLab"""
    description = f"""## Misconfiguration Details

| Field | Value |
|-------|-------|
| **Config ID** | `{request.config_id}` |
| **Severity** | {request.severity.upper()} |
| **Resource Type** | {request.resource_type} |
| **Resource Name** | `{request.resource_name}` |
| **Environment** | {request.environment} |
| **Compliance Framework** | {request.compliance_framework or 'N/A'} |

## Description

{request.description}

## Configuration Comparison

| Expected | Actual |
|----------|--------|
| `{request.expected_value or 'N/A'}` | `{request.actual_value or 'N/A'}` |

## Remediation Steps

{request.remediation_steps or 'Please review and update configuration according to security best practices.'}

---
_Auto-generated by Optimal Platform at {datetime.utcnow().isoformat()}Z_
"""
    return description


def generate_poam_description(request: POAMIssueRequest) -> str:
    """Generate formatted POA&M description for GitLab"""
    related = ", ".join([f"`{v}`" for v in request.related_vulns]) if request.related_vulns else "None"

    description = f"""## POA&M Item Details

| Field | Value |
|-------|-------|
| **POA&M ID** | `{request.poam_id}` |
| **Risk Level** | {request.risk_level.upper()} |
| **Scheduled Completion** | {request.scheduled_completion} |
| **Current Milestone** | {request.milestone or 'Not set'} |
| **Responsible Party** | {request.responsible_party or 'Unassigned'} |
| **Compliance Framework** | {request.compliance_framework or 'N/A'} |

## Identified Weakness

{request.weakness}

## Description

{request.description}

## Remediation Plan

{request.remediation_plan}

## Related Vulnerabilities

{related}

---
_Auto-generated by Optimal Platform at {datetime.utcnow().isoformat()}Z_
"""
    return description


# =============================================================================
# Issue Creation Functions
# =============================================================================

async def create_vulnerability_issue(
    request: VulnerabilityIssueRequest,
    project_id: int = None
) -> IssueResponse:
    """Create a GitLab issue from a vulnerability finding"""
    if not config.is_configured:
        return IssueResponse(
            success=False,
            message="GitLab is not configured",
            created_at=datetime.utcnow().isoformat()
        )

    target_project = project_id or request.project_id or int(config.project_id)
    if not target_project:
        return IssueResponse(
            success=False,
            message="No project ID specified",
            created_at=datetime.utcnow().isoformat()
        )

    # Check for existing issue
    existing = await gitlab_issues.find_existing_vuln_issue(
        target_project,
        request.vuln_id,
        request.environment
    )

    if existing:
        # Add comment to existing issue
        comment = f"""### Vulnerability Re-detected

| Field | Value |
|-------|-------|
| **Environment** | {request.environment} |
| **Asset** | {request.affected_asset} |
| **Detected At** | {datetime.utcnow().isoformat()}Z |
"""
        if request.pipeline_id:
            comment += f"| **Pipeline** | `#{request.pipeline_id}` |\n"

        await gitlab_issues.add_comment(target_project, existing, comment)

        return IssueResponse(
            success=True,
            issue_iid=existing,
            issue_url=f"{config.base_url}/projects/{target_project}/-/issues/{existing}",
            message=f"Updated existing issue #{existing} with new detection",
            created_at=datetime.utcnow().isoformat()
        )

    # Generate description
    description = generate_vuln_description(request)

    # Build labels
    labels = [
        config.vuln_label,
        config.auto_label,
        f"cve:{request.vuln_id}",
        f"severity:{request.severity.lower()}",
        f"env:{request.environment}",
        "optimal-platform"
    ]
    labels.extend(request.additional_labels or [])

    # Calculate due date based on severity
    due_date = severity_to_due_date(request.severity)
    weight = severity_to_weight(request.severity)

    # Create the issue
    result = await gitlab_issues.create_issue(
        project_id=target_project,
        title=request.title,
        description=description,
        labels=labels,
        assignee_username=config.default_assignee if config.default_assignee else None,
        due_date=due_date,
        weight=weight
    )

    if result.get("success"):
        issue_iid = result.get("iid")

        # Link to pipeline if available
        if request.pipeline_id:
            await gitlab_issues.link_issue_to_pipeline(
                target_project,
                issue_iid,
                request.pipeline_id
            )

        logger.info(f"Created vulnerability issue #{issue_iid} for {request.vuln_id}")

        return IssueResponse(
            success=True,
            issue_iid=issue_iid,
            issue_url=result.get("url"),
            message="Vulnerability issue created successfully",
            created_at=datetime.utcnow().isoformat()
        )
    else:
        logger.error(f"Failed to create vulnerability issue: {result.get('error')}")
        return IssueResponse(
            success=False,
            message=f"Failed to create issue: {result.get('error')}",
            created_at=datetime.utcnow().isoformat()
        )


async def create_misconfiguration_issue(
    request: MisconfigurationIssueRequest,
    project_id: int = None
) -> IssueResponse:
    """Create a GitLab issue from a misconfiguration finding"""
    if not config.is_configured:
        return IssueResponse(
            success=False,
            message="GitLab is not configured",
            created_at=datetime.utcnow().isoformat()
        )

    target_project = project_id or request.project_id or int(config.project_id)
    if not target_project:
        return IssueResponse(
            success=False,
            message="No project ID specified",
            created_at=datetime.utcnow().isoformat()
        )

    # Generate description
    description = generate_misconfig_description(request)

    # Build labels
    labels = [
        config.misconfig_label,
        config.auto_label,
        f"config:{request.config_id}",
        f"severity:{request.severity.lower()}",
        f"env:{request.environment}",
        f"resource:{request.resource_type.lower().replace(' ', '-')}",
        "optimal-platform"
    ]
    if request.compliance_framework:
        labels.append(f"compliance:{request.compliance_framework.lower()}")

    # Calculate due date and weight
    due_date = severity_to_due_date(request.severity)
    weight = severity_to_weight(request.severity)

    # Create the issue
    result = await gitlab_issues.create_issue(
        project_id=target_project,
        title=request.title,
        description=description,
        labels=labels,
        assignee_username=config.default_assignee if config.default_assignee else None,
        due_date=due_date,
        weight=weight
    )

    if result.get("success"):
        logger.info(f"Created misconfiguration issue #{result.get('iid')} for {request.config_id}")
        return IssueResponse(
            success=True,
            issue_iid=result.get("iid"),
            issue_url=result.get("url"),
            message="Misconfiguration issue created successfully",
            created_at=datetime.utcnow().isoformat()
        )
    else:
        return IssueResponse(
            success=False,
            message=f"Failed to create issue: {result.get('error')}",
            created_at=datetime.utcnow().isoformat()
        )


async def create_poam_issue(
    request: POAMIssueRequest,
    project_id: int = None
) -> IssueResponse:
    """Create or update a POA&M issue in GitLab"""
    if not config.is_configured:
        return IssueResponse(
            success=False,
            message="GitLab is not configured",
            created_at=datetime.utcnow().isoformat()
        )

    target_project = project_id or request.project_id or int(config.project_id)
    if not target_project:
        return IssueResponse(
            success=False,
            message="No project ID specified",
            created_at=datetime.utcnow().isoformat()
        )

    # Check for existing POA&M issue
    existing = await gitlab_issues.find_existing_poam_issue(target_project, request.poam_id)

    if existing:
        # Update existing issue
        description = generate_poam_description(request)

        update_result = await gitlab_issues.update_issue(
            target_project,
            existing,
            description=description,
            due_date=request.scheduled_completion
        )

        if update_result.get("success"):
            return IssueResponse(
                success=True,
                issue_iid=existing,
                issue_url=f"{config.base_url}/projects/{target_project}/-/issues/{existing}",
                message=f"Updated existing POA&M issue #{existing}",
                created_at=datetime.utcnow().isoformat()
            )

    # Create new POA&M issue
    description = generate_poam_description(request)

    labels = [
        config.poam_label,
        config.auto_label,
        f"poam:{request.poam_id}",
        f"risk:{request.risk_level.lower()}",
        "compliance",
        "optimal-platform"
    ]
    if request.compliance_framework:
        labels.append(f"framework:{request.compliance_framework.lower()}")

    result = await gitlab_issues.create_issue(
        project_id=target_project,
        title=request.title,
        description=description,
        labels=labels,
        assignee_username=request.responsible_party or config.default_assignee,
        due_date=request.scheduled_completion,
        weight=severity_to_weight(request.risk_level)
    )

    if result.get("success"):
        logger.info(f"Created POA&M issue #{result.get('iid')} for {request.poam_id}")
        return IssueResponse(
            success=True,
            issue_iid=result.get("iid"),
            issue_url=result.get("url"),
            message="POA&M issue created successfully",
            created_at=datetime.utcnow().isoformat()
        )
    else:
        return IssueResponse(
            success=False,
            message=f"Failed to create issue: {result.get('error')}",
            created_at=datetime.utcnow().isoformat()
        )


async def create_bulk_issues(
    request: BulkIssueRequest,
    project_id: int = None
) -> Dict[str, Any]:
    """Create multiple issues in bulk"""
    target_project = project_id or request.project_id or int(config.project_id)

    results = {
        "created": [],
        "updated": [],
        "failed": [],
        "total_requested": len(request.vulnerabilities or []) + len(request.misconfigurations or [])
    }

    # Process vulnerabilities
    for vuln in (request.vulnerabilities or []):
        try:
            response = await create_vulnerability_issue(vuln, target_project)
            if response.success:
                if "Updated existing" in response.message:
                    results["updated"].append({
                        "vuln_id": vuln.vuln_id,
                        "issue_iid": response.issue_iid
                    })
                else:
                    results["created"].append({
                        "vuln_id": vuln.vuln_id,
                        "issue_iid": response.issue_iid,
                        "url": response.issue_url
                    })
            else:
                results["failed"].append({
                    "vuln_id": vuln.vuln_id,
                    "error": response.message
                })
        except Exception as e:
            results["failed"].append({
                "vuln_id": vuln.vuln_id,
                "error": str(e)
            })

    # Process misconfigurations
    for misconfig in (request.misconfigurations or []):
        try:
            response = await create_misconfiguration_issue(misconfig, target_project)
            if response.success:
                results["created"].append({
                    "config_id": misconfig.config_id,
                    "issue_iid": response.issue_iid,
                    "url": response.issue_url
                })
            else:
                results["failed"].append({
                    "config_id": misconfig.config_id,
                    "error": response.message
                })
        except Exception as e:
            results["failed"].append({
                "config_id": misconfig.config_id,
                "error": str(e)
            })

    results["summary"] = {
        "created": len(results["created"]),
        "updated": len(results["updated"]),
        "failed": len(results["failed"])
    }

    logger.info(f"Bulk issue creation: {results['summary']}")
    return results


# =============================================================================
# Auto-Ticket from Scan Results
# =============================================================================

async def auto_create_issues_from_scan(
    scan_results: Dict[str, Any],
    project_id: int,
    environment: str,
    severity_threshold: str = "high"
) -> Dict[str, Any]:
    """
    Automatically create issues from scan results.
    Only creates issues for findings at or above the severity threshold.
    """
    threshold_levels = ["critical", "high", "medium", "low", "informational"]
    threshold_index = threshold_levels.index(severity_threshold.lower())

    results = {"created": [], "skipped": [], "failed": []}

    # Process Grype/Trivy style results
    matches = scan_results.get("matches", []) or scan_results.get("vulnerabilities", [])

    for match in matches:
        vuln = match.get("vulnerability", match)
        artifact = match.get("artifact", {})

        severity = vuln.get("severity", "unknown").lower()

        # Check if meets threshold
        if severity in threshold_levels:
            severity_index = threshold_levels.index(severity)
            if severity_index > threshold_index:
                results["skipped"].append({
                    "vuln_id": vuln.get("id", "unknown"),
                    "reason": f"Below threshold ({severity} < {severity_threshold})"
                })
                continue

        try:
            request = VulnerabilityIssueRequest(
                vuln_id=vuln.get("id", vuln.get("VulnerabilityID", "unknown")),
                severity=severity,
                title=f"[{severity.upper()}] {vuln.get('id', 'Unknown')} in {artifact.get('name', 'unknown package')}",
                description=vuln.get("description", "No description available"),
                affected_package=artifact.get("name", vuln.get("PkgName", "unknown")),
                affected_version=artifact.get("version", vuln.get("InstalledVersion", "unknown")),
                fixed_version=vuln.get("fix", {}).get("versions", [None])[0] if vuln.get("fix") else vuln.get("FixedVersion"),
                cvss_score=vuln.get("cvss", [{}])[0].get("metrics", {}).get("baseScore") if vuln.get("cvss") else None,
                environment=environment,
                affected_asset=scan_results.get("target", "unknown"),
                source_scan_id=scan_results.get("scan_id"),
                project_id=project_id
            )

            response = await create_vulnerability_issue(request, project_id)

            if response.success:
                results["created"].append({
                    "vuln_id": request.vuln_id,
                    "issue_iid": response.issue_iid
                })
            else:
                results["failed"].append({
                    "vuln_id": request.vuln_id,
                    "error": response.message
                })

        except Exception as e:
            results["failed"].append({
                "vuln_id": vuln.get("id", "unknown"),
                "error": str(e)
            })

    logger.info(f"Auto-created {len(results['created'])} issues from scan, skipped {len(results['skipped'])}, failed {len(results['failed'])}")
    return results
