"""
GitLab Adapter
Implements all integration interfaces for GitLab (self-hosted or cloud).

Capabilities:
- Tickets: GitLab Issues
- CI/CD: GitLab CI Pipelines
- SCM: GitLab Repositories
- Webhooks: GitLab Webhook Events
"""

import hashlib
import hmac
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import httpx

from .base import (
    Artifact,
    CIProvider,
    Comment,
    IntegrationProvider,
    Pipeline,
    PipelineJob,
    PipelineStatus,
    ProviderConfig,
    ProviderType,
    Repository,
    SCMProvider,
    Ticket,
    TicketCreateRequest,
    TicketPriority,
    TicketProvider,
    TicketResponse,
    TicketStatus,
    TicketUpdateRequest,
    WebhookEvent,
    WebhookEventType,
    WebhookHandler,
)


# =============================================================================
# GitLab Configuration
# =============================================================================

def gitlab_config_from_env() -> ProviderConfig:
    """Create GitLab config from environment variables"""
    return ProviderConfig(
        provider_type=ProviderType.GITLAB,
        base_url=os.getenv("GITLAB_BASE_URL", os.getenv("GITLAB_URL", "http://gitlab:80")).rstrip("/"),
        token=os.getenv("GITLAB_TOKEN", ""),
        username=os.getenv("GITLAB_USERNAME", ""),
        project_id=os.getenv("GITLAB_PROJECT_ID", ""),
        verify_ssl=os.getenv("GITLAB_VERIFY_SSL", "true").lower() == "true",
        timeout=int(os.getenv("GITLAB_TIMEOUT", "30")),
        extra={
            "webhook_secret": os.getenv("GITLAB_WEBHOOK_SECRET", ""),
            "default_assignee": os.getenv("GITLAB_DEFAULT_ASSIGNEE", ""),
            "vuln_label": os.getenv("GITLAB_VULN_LABEL", "vulnerability"),
            "misconfig_label": os.getenv("GITLAB_MISCONFIG_LABEL", "misconfiguration"),
            "poam_label": os.getenv("GITLAB_POAM_LABEL", "poam"),
            "auto_label": os.getenv("GITLAB_AUTO_LABEL", "auto-created"),
            # SLA configuration (days)
            "sla_critical": int(os.getenv("GITLAB_SLA_CRITICAL_DAYS", "7")),
            "sla_high": int(os.getenv("GITLAB_SLA_HIGH_DAYS", "30")),
            "sla_medium": int(os.getenv("GITLAB_SLA_MEDIUM_DAYS", "90")),
            "sla_low": int(os.getenv("GITLAB_SLA_LOW_DAYS", "180")),
        }
    )


# =============================================================================
# Status Mappings
# =============================================================================

GITLAB_STATUS_MAP = {
    "opened": TicketStatus.OPEN,
    "closed": TicketStatus.CLOSED,
    "reopened": TicketStatus.REOPENED,
    "merged": TicketStatus.CLOSED,
}

GITLAB_PIPELINE_STATUS_MAP = {
    "pending": PipelineStatus.PENDING,
    "running": PipelineStatus.RUNNING,
    "success": PipelineStatus.SUCCESS,
    "failed": PipelineStatus.FAILED,
    "canceled": PipelineStatus.CANCELED,
    "skipped": PipelineStatus.SKIPPED,
    "manual": PipelineStatus.PENDING,
    "scheduled": PipelineStatus.PENDING,
    "created": PipelineStatus.PENDING,
}


# =============================================================================
# GitLab Ticket Provider
# =============================================================================

class GitLabTicketProvider(TicketProvider):
    """GitLab Issues implementation"""

    def __init__(self, config: ProviderConfig):
        super().__init__(config)
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def provider_type(self) -> ProviderType:
        return ProviderType.GITLAB

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers={
                    "PRIVATE-TOKEN": self.config.token,
                    "Content-Type": "application/json",
                },
                timeout=httpx.Timeout(self.config.timeout),
                verify=self.config.verify_ssl,
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def test_connection(self) -> Dict[str, Any]:
        client = await self._get_client()
        try:
            resp = await client.get(f"{self.config.base_url}/api/v4/user")
            if resp.status_code == 200:
                data = resp.json()
                return {"connected": True, "user": data.get("username"), "provider": "gitlab"}
            return {"connected": False, "error": f"Status {resp.status_code}"}
        except Exception as e:
            return {"connected": False, "error": str(e)}

    def _normalize_ticket(self, data: Dict[str, Any], project_id: str = None) -> Ticket:
        """Convert GitLab issue to normalized Ticket"""
        return Ticket(
            id=str(data.get("id")),
            key=f"#{data.get('iid')}",
            title=data.get("title", ""),
            description=data.get("description", ""),
            status=GITLAB_STATUS_MAP.get(data.get("state", "opened"), TicketStatus.OPEN),
            priority=self._labels_to_priority(data.get("labels", [])),
            url=data.get("web_url", ""),
            labels=data.get("labels", []),
            assignee=data.get("assignee", {}).get("username") if data.get("assignee") else None,
            reporter=data.get("author", {}).get("username") if data.get("author") else None,
            due_date=data.get("due_date"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
            provider=ProviderType.GITLAB,
            raw_data=data,
        )

    def _labels_to_priority(self, labels: List[str]) -> TicketPriority:
        """Extract priority from labels"""
        for label in labels:
            label_lower = label.lower()
            if "critical" in label_lower:
                return TicketPriority.CRITICAL
            elif "high" in label_lower:
                return TicketPriority.HIGH
            elif "medium" in label_lower:
                return TicketPriority.MEDIUM
            elif "low" in label_lower:
                return TicketPriority.LOW
        return TicketPriority.MEDIUM

    def _calculate_due_date(self, priority: TicketPriority) -> str:
        """Calculate due date based on priority SLA"""
        sla_map = {
            TicketPriority.CRITICAL: self.config.extra.get("sla_critical", 7),
            TicketPriority.HIGH: self.config.extra.get("sla_high", 30),
            TicketPriority.MEDIUM: self.config.extra.get("sla_medium", 90),
            TicketPriority.LOW: self.config.extra.get("sla_low", 180),
            TicketPriority.INFORMATIONAL: self.config.extra.get("sla_low", 180),
        }
        days = sla_map.get(priority, 90)
        due = datetime.utcnow() + timedelta(days=days)
        return due.strftime("%Y-%m-%d")

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
            self.logger.warning(f"Failed to get user ID for {username}: {e}")
        return None

    async def create_ticket(self, request: TicketCreateRequest) -> TicketResponse:
        project_id = request.project_id or self.config.project_id
        if not project_id:
            return TicketResponse(success=False, error="No project ID specified")

        client = await self._get_client()

        # Build labels
        labels = list(request.labels)
        labels.append(self.config.extra.get("auto_label", "auto-created"))
        labels.append("optimal-platform")

        if request.vuln_id:
            labels.append(f"cve:{request.vuln_id}")
            labels.append(self.config.extra.get("vuln_label", "vulnerability"))
        if request.severity:
            labels.append(f"severity:{request.severity.lower()}")
        if request.environment:
            labels.append(f"env:{request.environment}")

        payload = {
            "title": request.title,
            "description": request.description,
            "labels": ",".join(labels),
        }

        # Set due date based on priority
        if request.due_date:
            payload["due_date"] = request.due_date
        else:
            payload["due_date"] = self._calculate_due_date(request.priority)

        # Set assignee
        assignee = request.assignee or self.config.extra.get("default_assignee")
        if assignee:
            user_id = await self._get_user_id(assignee)
            if user_id:
                payload["assignee_ids"] = [user_id]

        # Set weight based on priority
        weight_map = {
            TicketPriority.CRITICAL: 10,
            TicketPriority.HIGH: 7,
            TicketPriority.MEDIUM: 4,
            TicketPriority.LOW: 2,
            TicketPriority.INFORMATIONAL: 1,
        }
        payload["weight"] = weight_map.get(request.priority, 4)

        try:
            resp = await client.post(
                f"{self.config.base_url}/api/v4/projects/{project_id}/issues",
                json=payload
            )

            if resp.status_code in [200, 201]:
                data = resp.json()
                ticket = self._normalize_ticket(data, project_id)
                self.logger.info(f"Created GitLab issue {ticket.key}")
                return TicketResponse(success=True, ticket=ticket, message="Issue created successfully")
            else:
                error = resp.text
                self.logger.error(f"Failed to create issue: {resp.status_code} - {error}")
                return TicketResponse(success=False, error=error)
        except Exception as e:
            self.logger.error(f"Exception creating issue: {e}")
            return TicketResponse(success=False, error=str(e))

    async def update_ticket(self, ticket_id: str, request: TicketUpdateRequest) -> TicketResponse:
        project_id = self.config.project_id
        if not project_id:
            return TicketResponse(success=False, error="No project ID configured")

        client = await self._get_client()

        payload = {}
        if request.title:
            payload["title"] = request.title
        if request.description:
            payload["description"] = request.description
        if request.labels is not None:
            payload["labels"] = ",".join(request.labels)
        if request.due_date:
            payload["due_date"] = request.due_date
        if request.status:
            if request.status == TicketStatus.CLOSED:
                payload["state_event"] = "close"
            elif request.status == TicketStatus.REOPENED:
                payload["state_event"] = "reopen"

        try:
            resp = await client.put(
                f"{self.config.base_url}/api/v4/projects/{project_id}/issues/{ticket_id}",
                json=payload
            )

            if resp.status_code == 200:
                data = resp.json()
                ticket = self._normalize_ticket(data, project_id)
                return TicketResponse(success=True, ticket=ticket, message="Issue updated")
            else:
                return TicketResponse(success=False, error=resp.text)
        except Exception as e:
            return TicketResponse(success=False, error=str(e))

    async def get_ticket(self, ticket_id: str) -> Optional[Ticket]:
        project_id = self.config.project_id
        if not project_id:
            return None

        client = await self._get_client()

        try:
            resp = await client.get(
                f"{self.config.base_url}/api/v4/projects/{project_id}/issues/{ticket_id}"
            )
            if resp.status_code == 200:
                return self._normalize_ticket(resp.json(), project_id)
        except Exception as e:
            self.logger.error(f"Failed to get issue {ticket_id}: {e}")
        return None

    async def close_ticket(self, ticket_id: str) -> TicketResponse:
        return await self.update_ticket(ticket_id, TicketUpdateRequest(status=TicketStatus.CLOSED))

    async def reopen_ticket(self, ticket_id: str) -> TicketResponse:
        return await self.update_ticket(ticket_id, TicketUpdateRequest(status=TicketStatus.REOPENED))

    async def add_comment(self, ticket_id: str, comment: str) -> Dict[str, Any]:
        project_id = self.config.project_id
        if not project_id:
            return {"success": False, "error": "No project ID configured"}

        client = await self._get_client()

        try:
            resp = await client.post(
                f"{self.config.base_url}/api/v4/projects/{project_id}/issues/{ticket_id}/notes",
                json={"body": comment}
            )

            if resp.status_code == 201:
                data = resp.json()
                return {"success": True, "comment_id": data.get("id")}
            else:
                return {"success": False, "error": resp.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def search_tickets(
        self,
        labels: List[str] = None,
        status: TicketStatus = None,
        query: str = None,
        limit: int = 50
    ) -> List[Ticket]:
        project_id = self.config.project_id
        if not project_id:
            return []

        client = await self._get_client()

        params = {"per_page": limit}
        if labels:
            params["labels"] = ",".join(labels)
        if status:
            state_map = {
                TicketStatus.OPEN: "opened",
                TicketStatus.CLOSED: "closed",
                TicketStatus.REOPENED: "opened",
            }
            params["state"] = state_map.get(status, "opened")
        if query:
            params["search"] = query

        try:
            resp = await client.get(
                f"{self.config.base_url}/api/v4/projects/{project_id}/issues",
                params=params
            )
            if resp.status_code == 200:
                return [self._normalize_ticket(d, project_id) for d in resp.json()]
        except Exception as e:
            self.logger.error(f"Search failed: {e}")
        return []

    async def find_existing_vuln_ticket(
        self,
        vuln_id: str,
        environment: str = None
    ) -> Optional[Ticket]:
        labels = [
            self.config.extra.get("vuln_label", "vulnerability"),
            f"cve:{vuln_id}"
        ]
        if environment:
            labels.append(f"env:{environment}")

        tickets = await self.search_tickets(labels=labels, status=TicketStatus.OPEN, limit=1)
        return tickets[0] if tickets else None


# =============================================================================
# GitLab CI Provider
# =============================================================================

class GitLabCIProvider(CIProvider):
    """GitLab CI Pipelines implementation"""

    def __init__(self, config: ProviderConfig):
        super().__init__(config)
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def provider_type(self) -> ProviderType:
        return ProviderType.GITLAB

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers={"PRIVATE-TOKEN": self.config.token},
                timeout=httpx.Timeout(self.config.timeout),
                verify=self.config.verify_ssl,
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def test_connection(self) -> Dict[str, Any]:
        client = await self._get_client()
        try:
            resp = await client.get(f"{self.config.base_url}/api/v4/user")
            if resp.status_code == 200:
                return {"connected": True, "provider": "gitlab_ci"}
            return {"connected": False, "error": f"Status {resp.status_code}"}
        except Exception as e:
            return {"connected": False, "error": str(e)}

    def _normalize_pipeline(self, data: Dict[str, Any]) -> Pipeline:
        return Pipeline(
            id=str(data.get("id")),
            ref=data.get("ref", ""),
            sha=data.get("sha", ""),
            status=GITLAB_PIPELINE_STATUS_MAP.get(data.get("status", ""), PipelineStatus.PENDING),
            url=data.get("web_url", ""),
            created_at=data.get("created_at"),
            started_at=data.get("started_at"),
            finished_at=data.get("finished_at"),
            duration=data.get("duration"),
            provider=ProviderType.GITLAB,
            raw_data=data,
        )

    def _normalize_job(self, data: Dict[str, Any]) -> PipelineJob:
        return PipelineJob(
            id=str(data.get("id")),
            name=data.get("name", ""),
            stage=data.get("stage", ""),
            status=GITLAB_PIPELINE_STATUS_MAP.get(data.get("status", ""), PipelineStatus.PENDING),
            url=data.get("web_url", ""),
            artifacts=[a.get("filename", "") for a in data.get("artifacts", [])],
            started_at=data.get("started_at"),
            finished_at=data.get("finished_at"),
            duration=data.get("duration"),
            raw_data=data,
        )

    async def get_pipeline(self, pipeline_id: str) -> Optional[Pipeline]:
        project_id = self.config.project_id
        if not project_id:
            return None

        client = await self._get_client()

        try:
            resp = await client.get(
                f"{self.config.base_url}/api/v4/projects/{project_id}/pipelines/{pipeline_id}"
            )
            if resp.status_code == 200:
                return self._normalize_pipeline(resp.json())
        except Exception as e:
            self.logger.error(f"Failed to get pipeline: {e}")
        return None

    async def get_pipeline_jobs(self, pipeline_id: str) -> List[PipelineJob]:
        project_id = self.config.project_id
        if not project_id:
            return []

        client = await self._get_client()

        try:
            resp = await client.get(
                f"{self.config.base_url}/api/v4/projects/{project_id}/pipelines/{pipeline_id}/jobs"
            )
            if resp.status_code == 200:
                return [self._normalize_job(j) for j in resp.json()]
        except Exception as e:
            self.logger.error(f"Failed to get pipeline jobs: {e}")
        return []

    async def get_job_artifacts(self, job_id: str) -> List[Artifact]:
        project_id = self.config.project_id
        if not project_id:
            return []

        client = await self._get_client()

        try:
            resp = await client.get(
                f"{self.config.base_url}/api/v4/projects/{project_id}/jobs/{job_id}"
            )
            if resp.status_code == 200:
                data = resp.json()
                return [
                    Artifact(
                        name=a.get("filename", ""),
                        path=a.get("filename", ""),
                        size=a.get("size", 0),
                    )
                    for a in data.get("artifacts", [])
                ]
        except Exception as e:
            self.logger.error(f"Failed to get job artifacts: {e}")
        return []

    async def download_artifact(self, job_id: str, artifact_path: str) -> bytes:
        project_id = self.config.project_id
        if not project_id:
            raise ValueError("No project ID configured")

        client = await self._get_client()

        url = f"{self.config.base_url}/api/v4/projects/{project_id}/jobs/{job_id}/artifacts/{artifact_path}"

        resp = await client.get(url)
        if resp.status_code == 200:
            return resp.content

        raise Exception(f"Failed to download artifact: {resp.status_code}")

    async def trigger_pipeline(
        self,
        ref: str,
        variables: Dict[str, str] = None
    ) -> Optional[Pipeline]:
        project_id = self.config.project_id
        if not project_id:
            return None

        client = await self._get_client()

        payload = {"ref": ref}
        if variables:
            payload["variables"] = [{"key": k, "value": v} for k, v in variables.items()]

        try:
            resp = await client.post(
                f"{self.config.base_url}/api/v4/projects/{project_id}/pipeline",
                json=payload
            )
            if resp.status_code == 201:
                return self._normalize_pipeline(resp.json())
        except Exception as e:
            self.logger.error(f"Failed to trigger pipeline: {e}")
        return None

    async def cancel_pipeline(self, pipeline_id: str) -> bool:
        project_id = self.config.project_id
        if not project_id:
            return False

        client = await self._get_client()

        try:
            resp = await client.post(
                f"{self.config.base_url}/api/v4/projects/{project_id}/pipelines/{pipeline_id}/cancel"
            )
            return resp.status_code == 200
        except Exception as e:
            self.logger.error(f"Failed to cancel pipeline: {e}")
        return False


# =============================================================================
# GitLab SCM Provider
# =============================================================================

class GitLabSCMProvider(SCMProvider):
    """GitLab Repository implementation"""

    def __init__(self, config: ProviderConfig):
        super().__init__(config)
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def provider_type(self) -> ProviderType:
        return ProviderType.GITLAB

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers={"PRIVATE-TOKEN": self.config.token},
                timeout=httpx.Timeout(self.config.timeout),
                verify=self.config.verify_ssl,
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def test_connection(self) -> Dict[str, Any]:
        client = await self._get_client()
        try:
            resp = await client.get(f"{self.config.base_url}/api/v4/user")
            if resp.status_code == 200:
                return {"connected": True, "provider": "gitlab_scm"}
            return {"connected": False, "error": f"Status {resp.status_code}"}
        except Exception as e:
            return {"connected": False, "error": str(e)}

    def _normalize_repo(self, data: Dict[str, Any]) -> Repository:
        return Repository(
            id=str(data.get("id")),
            name=data.get("name", ""),
            full_name=data.get("path_with_namespace", ""),
            url=data.get("web_url", ""),
            default_branch=data.get("default_branch", "main"),
            provider=ProviderType.GITLAB,
            visibility=data.get("visibility", "private"),
            description=data.get("description", "") or "",
        )

    async def get_repository(self, repo_id: str) -> Optional[Repository]:
        client = await self._get_client()

        try:
            resp = await client.get(f"{self.config.base_url}/api/v4/projects/{repo_id}")
            if resp.status_code == 200:
                return self._normalize_repo(resp.json())
        except Exception as e:
            self.logger.error(f"Failed to get repository: {e}")
        return None

    async def list_repositories(self, limit: int = 100) -> List[Repository]:
        client = await self._get_client()

        try:
            resp = await client.get(
                f"{self.config.base_url}/api/v4/projects",
                params={"membership": True, "per_page": limit}
            )
            if resp.status_code == 200:
                return [self._normalize_repo(r) for r in resp.json()]
        except Exception as e:
            self.logger.error(f"Failed to list repositories: {e}")
        return []

    async def get_file_content(
        self,
        repo_id: str,
        file_path: str,
        ref: str = None
    ) -> Optional[bytes]:
        client = await self._get_client()

        params = {}
        if ref:
            params["ref"] = ref

        try:
            # URL encode the file path
            encoded_path = file_path.replace("/", "%2F")
            resp = await client.get(
                f"{self.config.base_url}/api/v4/projects/{repo_id}/repository/files/{encoded_path}/raw",
                params=params
            )
            if resp.status_code == 200:
                return resp.content
        except Exception as e:
            self.logger.error(f"Failed to get file content: {e}")
        return None

    async def create_branch(
        self,
        repo_id: str,
        branch_name: str,
        source_ref: str
    ) -> bool:
        client = await self._get_client()

        try:
            resp = await client.post(
                f"{self.config.base_url}/api/v4/projects/{repo_id}/repository/branches",
                json={"branch": branch_name, "ref": source_ref}
            )
            return resp.status_code == 201
        except Exception as e:
            self.logger.error(f"Failed to create branch: {e}")
        return False

    async def create_pull_request(
        self,
        repo_id: str,
        title: str,
        description: str,
        source_branch: str,
        target_branch: str
    ) -> Dict[str, Any]:
        client = await self._get_client()

        payload = {
            "source_branch": source_branch,
            "target_branch": target_branch,
            "title": title,
            "description": description,
        }

        try:
            resp = await client.post(
                f"{self.config.base_url}/api/v4/projects/{repo_id}/merge_requests",
                json=payload
            )
            if resp.status_code == 201:
                data = resp.json()
                return {"success": True, "mr_iid": data.get("iid"), "url": data.get("web_url")}
            return {"success": False, "error": resp.text}
        except Exception as e:
            return {"success": False, "error": str(e)}


# =============================================================================
# GitLab Webhook Handler
# =============================================================================

class GitLabWebhookHandler(WebhookHandler):
    """GitLab webhook handler"""

    @property
    def provider_type(self) -> ProviderType:
        return ProviderType.GITLAB

    def verify_signature(self, payload: bytes, signature: str) -> bool:
        """Verify GitLab webhook token (X-Gitlab-Token header)"""
        secret = self.config.extra.get("webhook_secret", "")
        if not secret:
            return True  # No secret configured, skip verification
        return signature == secret

    def get_event_type(self, headers: Dict[str, str], payload: Dict[str, Any]) -> WebhookEventType:
        """Determine event type from GitLab webhook"""
        gitlab_event = headers.get("X-Gitlab-Event", "").lower()
        object_kind = payload.get("object_kind", "")

        event_map = {
            "push hook": WebhookEventType.PUSH,
            "push": WebhookEventType.PUSH,
            "merge request hook": WebhookEventType.MERGE_REQUEST,
            "merge_request": WebhookEventType.MERGE_REQUEST,
            "pipeline hook": WebhookEventType.PIPELINE_COMPLETE,
            "pipeline": WebhookEventType.PIPELINE_COMPLETE,
            "issue hook": WebhookEventType.ISSUE_UPDATED,
            "issue": WebhookEventType.ISSUE_UPDATED,
            "note hook": WebhookEventType.COMMENT_ADDED,
            "note": WebhookEventType.COMMENT_ADDED,
            "tag push hook": WebhookEventType.TAG_CREATED,
            "tag_push": WebhookEventType.TAG_CREATED,
            "release hook": WebhookEventType.RELEASE_CREATED,
            "release": WebhookEventType.RELEASE_CREATED,
        }

        return event_map.get(gitlab_event, event_map.get(object_kind, WebhookEventType.PUSH))

    def parse_event(self, headers: Dict[str, str], payload: Dict[str, Any]) -> WebhookEvent:
        """Parse GitLab webhook into normalized event"""
        event_type = self.get_event_type(headers, payload)
        project = payload.get("project", {})

        return WebhookEvent(
            event_type=event_type,
            provider=ProviderType.GITLAB,
            project_id=str(project.get("id", "")),
            timestamp=datetime.utcnow().isoformat(),
            payload=payload,
            ref=payload.get("ref"),
            sha=payload.get("checkout_sha") or payload.get("after"),
            user=payload.get("user_username") or payload.get("user", {}).get("username"),
            url=project.get("web_url"),
        )


# =============================================================================
# Combined GitLab Provider
# =============================================================================

class GitLabProvider(IntegrationProvider):
    """
    Combined GitLab provider implementing all capabilities:
    - Tickets (Issues)
    - CI/CD (Pipelines)
    - SCM (Repositories)
    - Webhooks
    """

    def __init__(self, config: ProviderConfig = None):
        config = config or gitlab_config_from_env()
        super().__init__(config)

        self._ticket_provider = GitLabTicketProvider(config)
        self._ci_provider = GitLabCIProvider(config)
        self._scm_provider = GitLabSCMProvider(config)
        self._webhook_handler = GitLabWebhookHandler(config)

    @property
    def provider_type(self) -> ProviderType:
        return ProviderType.GITLAB

    @property
    def supports_tickets(self) -> bool:
        return True

    @property
    def supports_ci(self) -> bool:
        return True

    @property
    def supports_scm(self) -> bool:
        return True

    @property
    def ticket_provider(self) -> GitLabTicketProvider:
        return self._ticket_provider

    @property
    def ci_provider(self) -> GitLabCIProvider:
        return self._ci_provider

    @property
    def scm_provider(self) -> GitLabSCMProvider:
        return self._scm_provider

    @property
    def webhook_handler(self) -> GitLabWebhookHandler:
        return self._webhook_handler

    async def test_connection(self) -> Dict[str, Any]:
        result = await self._ticket_provider.test_connection()
        result["provider"] = "gitlab"
        result["capabilities"] = ["tickets", "ci", "scm", "webhooks"]
        return result

    async def close(self):
        await self._ticket_provider.close()
        await self._ci_provider.close()
        await self._scm_provider.close()
