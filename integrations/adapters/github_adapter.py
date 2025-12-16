"""
GitHub Adapter
Implements all integration interfaces for GitHub (self-hosted Enterprise or cloud).

Capabilities:
- Tickets: GitHub Issues
- CI/CD: GitHub Actions
- SCM: GitHub Repositories
- Webhooks: GitHub Webhook Events

Supports:
- GitHub.com
- GitHub Enterprise Server (self-hosted)
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
# GitHub Configuration
# =============================================================================

def github_config_from_env() -> ProviderConfig:
    """Create GitHub config from environment variables"""
    return ProviderConfig(
        provider_type=ProviderType.GITHUB,
        base_url=os.getenv("GITHUB_API_URL", os.getenv("GITHUB_URL", "https://api.github.com")).rstrip("/"),
        token=os.getenv("GITHUB_TOKEN", ""),
        username=os.getenv("GITHUB_USERNAME", ""),
        organization=os.getenv("GITHUB_ORG", os.getenv("GITHUB_OWNER", "")),
        project_id=os.getenv("GITHUB_REPO", ""),  # owner/repo format
        verify_ssl=os.getenv("GITHUB_VERIFY_SSL", "true").lower() == "true",
        timeout=int(os.getenv("GITHUB_TIMEOUT", "30")),
        extra={
            "webhook_secret": os.getenv("GITHUB_WEBHOOK_SECRET", ""),
            "default_assignee": os.getenv("GITHUB_DEFAULT_ASSIGNEE", ""),
            "vuln_label": os.getenv("GITHUB_VULN_LABEL", "vulnerability"),
            "misconfig_label": os.getenv("GITHUB_MISCONFIG_LABEL", "misconfiguration"),
            "poam_label": os.getenv("GITHUB_POAM_LABEL", "poam"),
            "auto_label": os.getenv("GITHUB_AUTO_LABEL", "auto-created"),
            # SLA configuration (days)
            "sla_critical": int(os.getenv("GITHUB_SLA_CRITICAL_DAYS", "7")),
            "sla_high": int(os.getenv("GITHUB_SLA_HIGH_DAYS", "30")),
            "sla_medium": int(os.getenv("GITHUB_SLA_MEDIUM_DAYS", "90")),
            "sla_low": int(os.getenv("GITHUB_SLA_LOW_DAYS", "180")),
        }
    )


# =============================================================================
# Status Mappings
# =============================================================================

GITHUB_STATUS_MAP = {
    "open": TicketStatus.OPEN,
    "closed": TicketStatus.CLOSED,
}

GITHUB_WORKFLOW_STATUS_MAP = {
    "queued": PipelineStatus.PENDING,
    "in_progress": PipelineStatus.RUNNING,
    "completed": PipelineStatus.SUCCESS,  # Need to check conclusion
    "waiting": PipelineStatus.PENDING,
    "requested": PipelineStatus.PENDING,
    "pending": PipelineStatus.PENDING,
}

GITHUB_CONCLUSION_MAP = {
    "success": PipelineStatus.SUCCESS,
    "failure": PipelineStatus.FAILED,
    "cancelled": PipelineStatus.CANCELED,
    "skipped": PipelineStatus.SKIPPED,
    "timed_out": PipelineStatus.FAILED,
    "action_required": PipelineStatus.PENDING,
    "neutral": PipelineStatus.SUCCESS,
    "stale": PipelineStatus.CANCELED,
}


# =============================================================================
# GitHub Ticket Provider (Issues)
# =============================================================================

class GitHubTicketProvider(TicketProvider):
    """GitHub Issues implementation"""

    def __init__(self, config: ProviderConfig):
        super().__init__(config)
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def provider_type(self) -> ProviderType:
        return ProviderType.GITHUB

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers={
                    "Authorization": f"Bearer {self.config.token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
                timeout=httpx.Timeout(self.config.timeout),
                verify=self.config.verify_ssl,
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    def _get_repo_path(self, project_id: str = None) -> str:
        """Get owner/repo path"""
        repo = project_id or self.config.project_id
        if "/" not in repo and self.config.organization:
            return f"{self.config.organization}/{repo}"
        return repo

    async def test_connection(self) -> Dict[str, Any]:
        client = await self._get_client()
        try:
            resp = await client.get(f"{self.config.base_url}/user")
            if resp.status_code == 200:
                data = resp.json()
                return {"connected": True, "user": data.get("login"), "provider": "github"}
            return {"connected": False, "error": f"Status {resp.status_code}"}
        except Exception as e:
            return {"connected": False, "error": str(e)}

    def _normalize_ticket(self, data: Dict[str, Any]) -> Ticket:
        """Convert GitHub issue to normalized Ticket"""
        labels = [l.get("name", "") for l in data.get("labels", [])]

        return Ticket(
            id=str(data.get("id")),
            key=f"#{data.get('number')}",
            title=data.get("title", ""),
            description=data.get("body", "") or "",
            status=GITHUB_STATUS_MAP.get(data.get("state", "open"), TicketStatus.OPEN),
            priority=self._labels_to_priority(labels),
            url=data.get("html_url", ""),
            labels=labels,
            assignee=data.get("assignee", {}).get("login") if data.get("assignee") else None,
            reporter=data.get("user", {}).get("login") if data.get("user") else None,
            due_date=None,  # GitHub doesn't have native due dates
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
            provider=ProviderType.GITHUB,
            raw_data=data,
        )

    def _labels_to_priority(self, labels: List[str]) -> TicketPriority:
        """Extract priority from labels"""
        for label in labels:
            label_lower = label.lower()
            if "critical" in label_lower or "p0" in label_lower:
                return TicketPriority.CRITICAL
            elif "high" in label_lower or "p1" in label_lower:
                return TicketPriority.HIGH
            elif "medium" in label_lower or "p2" in label_lower:
                return TicketPriority.MEDIUM
            elif "low" in label_lower or "p3" in label_lower:
                return TicketPriority.LOW
        return TicketPriority.MEDIUM

    def _priority_to_label(self, priority: TicketPriority) -> str:
        """Convert priority to GitHub label"""
        return f"priority:{priority.value}"

    async def _ensure_labels_exist(self, repo_path: str, labels: List[str]):
        """Ensure all labels exist in the repository"""
        client = await self._get_client()

        # Get existing labels
        try:
            resp = await client.get(f"{self.config.base_url}/repos/{repo_path}/labels")
            if resp.status_code == 200:
                existing = {l.get("name", "").lower() for l in resp.json()}
            else:
                existing = set()
        except:
            existing = set()

        # Create missing labels
        label_colors = {
            "vulnerability": "d73a4a",  # Red
            "misconfiguration": "e99695",  # Light red
            "poam": "0075ca",  # Blue
            "auto-created": "bfdadc",  # Light blue
            "optimal-platform": "5319e7",  # Purple
        }

        for label in labels:
            if label.lower() not in existing:
                color = label_colors.get(label, "ededed")
                try:
                    await client.post(
                        f"{self.config.base_url}/repos/{repo_path}/labels",
                        json={"name": label, "color": color}
                    )
                except:
                    pass  # Label might already exist or user lacks permission

    async def create_ticket(self, request: TicketCreateRequest) -> TicketResponse:
        repo_path = self._get_repo_path(request.project_id)
        if not repo_path:
            return TicketResponse(success=False, error="No repository specified")

        client = await self._get_client()

        # Build labels
        labels = list(request.labels)
        labels.append(self.config.extra.get("auto_label", "auto-created"))
        labels.append("optimal-platform")
        labels.append(self._priority_to_label(request.priority))

        if request.vuln_id:
            labels.append(f"cve:{request.vuln_id}")
            labels.append(self.config.extra.get("vuln_label", "vulnerability"))
        if request.severity:
            labels.append(f"severity:{request.severity.lower()}")
        if request.environment:
            labels.append(f"env:{request.environment}")

        # Ensure labels exist
        await self._ensure_labels_exist(repo_path, labels)

        payload = {
            "title": request.title,
            "body": request.description,
            "labels": labels,
        }

        # Set assignee
        assignee = request.assignee or self.config.extra.get("default_assignee")
        if assignee:
            payload["assignees"] = [assignee]

        try:
            resp = await client.post(
                f"{self.config.base_url}/repos/{repo_path}/issues",
                json=payload
            )

            if resp.status_code == 201:
                data = resp.json()
                ticket = self._normalize_ticket(data)
                self.logger.info(f"Created GitHub issue {ticket.key}")
                return TicketResponse(success=True, ticket=ticket, message="Issue created successfully")
            else:
                error = resp.text
                self.logger.error(f"Failed to create issue: {resp.status_code} - {error}")
                return TicketResponse(success=False, error=error)
        except Exception as e:
            self.logger.error(f"Exception creating issue: {e}")
            return TicketResponse(success=False, error=str(e))

    async def update_ticket(self, ticket_id: str, request: TicketUpdateRequest) -> TicketResponse:
        repo_path = self._get_repo_path()
        if not repo_path:
            return TicketResponse(success=False, error="No repository configured")

        client = await self._get_client()

        payload = {}
        if request.title:
            payload["title"] = request.title
        if request.description:
            payload["body"] = request.description
        if request.labels is not None:
            payload["labels"] = request.labels
        if request.status:
            if request.status == TicketStatus.CLOSED:
                payload["state"] = "closed"
            elif request.status in [TicketStatus.OPEN, TicketStatus.REOPENED]:
                payload["state"] = "open"

        try:
            resp = await client.patch(
                f"{self.config.base_url}/repos/{repo_path}/issues/{ticket_id}",
                json=payload
            )

            if resp.status_code == 200:
                data = resp.json()
                ticket = self._normalize_ticket(data)
                return TicketResponse(success=True, ticket=ticket, message="Issue updated")
            else:
                return TicketResponse(success=False, error=resp.text)
        except Exception as e:
            return TicketResponse(success=False, error=str(e))

    async def get_ticket(self, ticket_id: str) -> Optional[Ticket]:
        repo_path = self._get_repo_path()
        if not repo_path:
            return None

        client = await self._get_client()

        try:
            resp = await client.get(
                f"{self.config.base_url}/repos/{repo_path}/issues/{ticket_id}"
            )
            if resp.status_code == 200:
                return self._normalize_ticket(resp.json())
        except Exception as e:
            self.logger.error(f"Failed to get issue {ticket_id}: {e}")
        return None

    async def close_ticket(self, ticket_id: str) -> TicketResponse:
        return await self.update_ticket(ticket_id, TicketUpdateRequest(status=TicketStatus.CLOSED))

    async def reopen_ticket(self, ticket_id: str) -> TicketResponse:
        return await self.update_ticket(ticket_id, TicketUpdateRequest(status=TicketStatus.OPEN))

    async def add_comment(self, ticket_id: str, comment: str) -> Dict[str, Any]:
        repo_path = self._get_repo_path()
        if not repo_path:
            return {"success": False, "error": "No repository configured"}

        client = await self._get_client()

        try:
            resp = await client.post(
                f"{self.config.base_url}/repos/{repo_path}/issues/{ticket_id}/comments",
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
        repo_path = self._get_repo_path()
        if not repo_path:
            return []

        client = await self._get_client()

        params = {"per_page": limit}
        if labels:
            params["labels"] = ",".join(labels)
        if status:
            params["state"] = "open" if status in [TicketStatus.OPEN, TicketStatus.REOPENED] else "closed"

        try:
            resp = await client.get(
                f"{self.config.base_url}/repos/{repo_path}/issues",
                params=params
            )
            if resp.status_code == 200:
                # Filter out pull requests (GitHub returns PRs in issues endpoint)
                issues = [d for d in resp.json() if "pull_request" not in d]
                return [self._normalize_ticket(d) for d in issues]
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
# GitHub CI Provider (Actions)
# =============================================================================

class GitHubCIProvider(CIProvider):
    """GitHub Actions implementation"""

    def __init__(self, config: ProviderConfig):
        super().__init__(config)
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def provider_type(self) -> ProviderType:
        return ProviderType.GITHUB

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers={
                    "Authorization": f"Bearer {self.config.token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
                timeout=httpx.Timeout(self.config.timeout),
                verify=self.config.verify_ssl,
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    def _get_repo_path(self) -> str:
        repo = self.config.project_id
        if "/" not in repo and self.config.organization:
            return f"{self.config.organization}/{repo}"
        return repo

    async def test_connection(self) -> Dict[str, Any]:
        client = await self._get_client()
        try:
            resp = await client.get(f"{self.config.base_url}/user")
            if resp.status_code == 200:
                return {"connected": True, "provider": "github_actions"}
            return {"connected": False, "error": f"Status {resp.status_code}"}
        except Exception as e:
            return {"connected": False, "error": str(e)}

    def _normalize_pipeline(self, data: Dict[str, Any]) -> Pipeline:
        """Convert GitHub workflow run to Pipeline"""
        status = GITHUB_WORKFLOW_STATUS_MAP.get(data.get("status", ""), PipelineStatus.PENDING)
        if data.get("conclusion"):
            status = GITHUB_CONCLUSION_MAP.get(data.get("conclusion", ""), status)

        return Pipeline(
            id=str(data.get("id")),
            ref=data.get("head_branch", ""),
            sha=data.get("head_sha", ""),
            status=status,
            url=data.get("html_url", ""),
            created_at=data.get("created_at"),
            started_at=data.get("run_started_at"),
            finished_at=data.get("updated_at") if data.get("conclusion") else None,
            duration=None,  # Would need to calculate
            provider=ProviderType.GITHUB,
            raw_data=data,
        )

    def _normalize_job(self, data: Dict[str, Any]) -> PipelineJob:
        """Convert GitHub job to PipelineJob"""
        status = GITHUB_WORKFLOW_STATUS_MAP.get(data.get("status", ""), PipelineStatus.PENDING)
        if data.get("conclusion"):
            status = GITHUB_CONCLUSION_MAP.get(data.get("conclusion", ""), status)

        return PipelineJob(
            id=str(data.get("id")),
            name=data.get("name", ""),
            stage=data.get("workflow_name", ""),
            status=status,
            url=data.get("html_url", ""),
            artifacts=[],  # Artifacts are at workflow run level in GitHub
            started_at=data.get("started_at"),
            finished_at=data.get("completed_at"),
            duration=None,
            raw_data=data,
        )

    async def get_pipeline(self, pipeline_id: str) -> Optional[Pipeline]:
        repo_path = self._get_repo_path()
        if not repo_path:
            return None

        client = await self._get_client()

        try:
            resp = await client.get(
                f"{self.config.base_url}/repos/{repo_path}/actions/runs/{pipeline_id}"
            )
            if resp.status_code == 200:
                return self._normalize_pipeline(resp.json())
        except Exception as e:
            self.logger.error(f"Failed to get workflow run: {e}")
        return None

    async def get_pipeline_jobs(self, pipeline_id: str) -> List[PipelineJob]:
        repo_path = self._get_repo_path()
        if not repo_path:
            return []

        client = await self._get_client()

        try:
            resp = await client.get(
                f"{self.config.base_url}/repos/{repo_path}/actions/runs/{pipeline_id}/jobs"
            )
            if resp.status_code == 200:
                data = resp.json()
                return [self._normalize_job(j) for j in data.get("jobs", [])]
        except Exception as e:
            self.logger.error(f"Failed to get jobs: {e}")
        return []

    async def get_job_artifacts(self, job_id: str) -> List[Artifact]:
        """Get artifacts for a workflow run (not individual job in GitHub)"""
        repo_path = self._get_repo_path()
        if not repo_path:
            return []

        client = await self._get_client()

        try:
            # In GitHub, artifacts are at the workflow run level
            resp = await client.get(
                f"{self.config.base_url}/repos/{repo_path}/actions/runs/{job_id}/artifacts"
            )
            if resp.status_code == 200:
                data = resp.json()
                return [
                    Artifact(
                        name=a.get("name", ""),
                        path=a.get("name", ""),
                        size=a.get("size_in_bytes", 0),
                        url=a.get("archive_download_url"),
                    )
                    for a in data.get("artifacts", [])
                ]
        except Exception as e:
            self.logger.error(f"Failed to get artifacts: {e}")
        return []

    async def download_artifact(self, job_id: str, artifact_path: str) -> bytes:
        """Download artifact - artifact_path should be the artifact ID or name"""
        repo_path = self._get_repo_path()
        if not repo_path:
            raise ValueError("No repository configured")

        client = await self._get_client()

        # First, find the artifact
        artifacts = await self.get_job_artifacts(job_id)
        artifact = next((a for a in artifacts if a.name == artifact_path or str(a.path) == artifact_path), None)

        if not artifact or not artifact.url:
            raise Exception(f"Artifact {artifact_path} not found")

        # Download (returns a redirect to the actual download URL)
        resp = await client.get(artifact.url, follow_redirects=True)
        if resp.status_code == 200:
            return resp.content

        raise Exception(f"Failed to download artifact: {resp.status_code}")

    async def trigger_pipeline(
        self,
        ref: str,
        variables: Dict[str, str] = None
    ) -> Optional[Pipeline]:
        repo_path = self._get_repo_path()
        if not repo_path:
            return None

        client = await self._get_client()

        # GitHub requires specifying the workflow file
        # Default to the first workflow or specified one
        workflow_id = variables.pop("workflow_id", None) if variables else None

        if not workflow_id:
            # Get first available workflow
            try:
                resp = await client.get(f"{self.config.base_url}/repos/{repo_path}/actions/workflows")
                if resp.status_code == 200:
                    workflows = resp.json().get("workflows", [])
                    if workflows:
                        workflow_id = workflows[0].get("id")
            except:
                pass

        if not workflow_id:
            self.logger.error("No workflow specified or found")
            return None

        payload = {"ref": ref}
        if variables:
            payload["inputs"] = variables

        try:
            resp = await client.post(
                f"{self.config.base_url}/repos/{repo_path}/actions/workflows/{workflow_id}/dispatches",
                json=payload
            )
            if resp.status_code == 204:
                # GitHub doesn't return the run ID immediately
                # We'd need to poll to get it
                self.logger.info(f"Triggered workflow {workflow_id} on {ref}")
                return Pipeline(
                    id="pending",
                    ref=ref,
                    sha="",
                    status=PipelineStatus.PENDING,
                    url=f"https://github.com/{repo_path}/actions",
                    provider=ProviderType.GITHUB,
                )
        except Exception as e:
            self.logger.error(f"Failed to trigger workflow: {e}")
        return None

    async def cancel_pipeline(self, pipeline_id: str) -> bool:
        repo_path = self._get_repo_path()
        if not repo_path:
            return False

        client = await self._get_client()

        try:
            resp = await client.post(
                f"{self.config.base_url}/repos/{repo_path}/actions/runs/{pipeline_id}/cancel"
            )
            return resp.status_code == 202
        except Exception as e:
            self.logger.error(f"Failed to cancel workflow: {e}")
        return False


# =============================================================================
# GitHub SCM Provider
# =============================================================================

class GitHubSCMProvider(SCMProvider):
    """GitHub Repository implementation"""

    def __init__(self, config: ProviderConfig):
        super().__init__(config)
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def provider_type(self) -> ProviderType:
        return ProviderType.GITHUB

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers={
                    "Authorization": f"Bearer {self.config.token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
                timeout=httpx.Timeout(self.config.timeout),
                verify=self.config.verify_ssl,
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    def _get_repo_path(self, repo_id: str = None) -> str:
        repo = repo_id or self.config.project_id
        if "/" not in repo and self.config.organization:
            return f"{self.config.organization}/{repo}"
        return repo

    async def test_connection(self) -> Dict[str, Any]:
        client = await self._get_client()
        try:
            resp = await client.get(f"{self.config.base_url}/user")
            if resp.status_code == 200:
                return {"connected": True, "provider": "github_scm"}
            return {"connected": False, "error": f"Status {resp.status_code}"}
        except Exception as e:
            return {"connected": False, "error": str(e)}

    def _normalize_repo(self, data: Dict[str, Any]) -> Repository:
        return Repository(
            id=str(data.get("id")),
            name=data.get("name", ""),
            full_name=data.get("full_name", ""),
            url=data.get("html_url", ""),
            default_branch=data.get("default_branch", "main"),
            provider=ProviderType.GITHUB,
            visibility=data.get("visibility", "private"),
            description=data.get("description", "") or "",
        )

    async def get_repository(self, repo_id: str) -> Optional[Repository]:
        repo_path = self._get_repo_path(repo_id)
        client = await self._get_client()

        try:
            resp = await client.get(f"{self.config.base_url}/repos/{repo_path}")
            if resp.status_code == 200:
                return self._normalize_repo(resp.json())
        except Exception as e:
            self.logger.error(f"Failed to get repository: {e}")
        return None

    async def list_repositories(self, limit: int = 100) -> List[Repository]:
        client = await self._get_client()

        repos = []
        try:
            # Get user's repos
            resp = await client.get(
                f"{self.config.base_url}/user/repos",
                params={"per_page": limit, "sort": "updated"}
            )
            if resp.status_code == 200:
                repos.extend([self._normalize_repo(r) for r in resp.json()])

            # If org is specified, also get org repos
            if self.config.organization:
                resp = await client.get(
                    f"{self.config.base_url}/orgs/{self.config.organization}/repos",
                    params={"per_page": limit, "sort": "updated"}
                )
                if resp.status_code == 200:
                    repos.extend([self._normalize_repo(r) for r in resp.json()])
        except Exception as e:
            self.logger.error(f"Failed to list repositories: {e}")

        return repos[:limit]

    async def get_file_content(
        self,
        repo_id: str,
        file_path: str,
        ref: str = None
    ) -> Optional[bytes]:
        repo_path = self._get_repo_path(repo_id)
        client = await self._get_client()

        params = {}
        if ref:
            params["ref"] = ref

        try:
            resp = await client.get(
                f"{self.config.base_url}/repos/{repo_path}/contents/{file_path}",
                params=params,
                headers={"Accept": "application/vnd.github.raw+json"}
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
        repo_path = self._get_repo_path(repo_id)
        client = await self._get_client()

        try:
            # Get the SHA of the source ref
            resp = await client.get(
                f"{self.config.base_url}/repos/{repo_path}/git/refs/heads/{source_ref}"
            )
            if resp.status_code != 200:
                return False

            sha = resp.json().get("object", {}).get("sha")
            if not sha:
                return False

            # Create the new branch
            resp = await client.post(
                f"{self.config.base_url}/repos/{repo_path}/git/refs",
                json={"ref": f"refs/heads/{branch_name}", "sha": sha}
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
        repo_path = self._get_repo_path(repo_id)
        client = await self._get_client()

        payload = {
            "head": source_branch,
            "base": target_branch,
            "title": title,
            "body": description,
        }

        try:
            resp = await client.post(
                f"{self.config.base_url}/repos/{repo_path}/pulls",
                json=payload
            )
            if resp.status_code == 201:
                data = resp.json()
                return {"success": True, "pr_number": data.get("number"), "url": data.get("html_url")}
            return {"success": False, "error": resp.text}
        except Exception as e:
            return {"success": False, "error": str(e)}


# =============================================================================
# GitHub Webhook Handler
# =============================================================================

class GitHubWebhookHandler(WebhookHandler):
    """GitHub webhook handler"""

    @property
    def provider_type(self) -> ProviderType:
        return ProviderType.GITHUB

    def verify_signature(self, payload: bytes, signature: str) -> bool:
        """Verify GitHub webhook signature (X-Hub-Signature-256 header)"""
        secret = self.config.extra.get("webhook_secret", "")
        if not secret:
            return True  # No secret configured, skip verification

        if not signature.startswith("sha256="):
            return False

        expected = "sha256=" + hmac.new(
            secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(signature, expected)

    def get_event_type(self, headers: Dict[str, str], payload: Dict[str, Any]) -> WebhookEventType:
        """Determine event type from GitHub webhook"""
        github_event = headers.get("X-GitHub-Event", "").lower()
        action = payload.get("action", "")

        event_map = {
            "push": WebhookEventType.PUSH,
            "pull_request": WebhookEventType.PULL_REQUEST,
            "workflow_run": WebhookEventType.PIPELINE_COMPLETE,
            "workflow_job": WebhookEventType.PIPELINE_COMPLETE,
            "issues": WebhookEventType.ISSUE_UPDATED,
            "issue_comment": WebhookEventType.COMMENT_ADDED,
            "create": WebhookEventType.TAG_CREATED if payload.get("ref_type") == "tag" else WebhookEventType.PUSH,
            "release": WebhookEventType.RELEASE_CREATED,
        }

        base_type = event_map.get(github_event, WebhookEventType.PUSH)

        # Refine based on action
        if github_event == "issues":
            if action == "opened":
                return WebhookEventType.ISSUE_CREATED
            elif action == "closed":
                return WebhookEventType.ISSUE_CLOSED

        return base_type

    def parse_event(self, headers: Dict[str, str], payload: Dict[str, Any]) -> WebhookEvent:
        """Parse GitHub webhook into normalized event"""
        event_type = self.get_event_type(headers, payload)
        repo = payload.get("repository", {})

        return WebhookEvent(
            event_type=event_type,
            provider=ProviderType.GITHUB,
            project_id=str(repo.get("id", "")),
            timestamp=datetime.utcnow().isoformat(),
            payload=payload,
            ref=payload.get("ref"),
            sha=payload.get("after") or payload.get("head_commit", {}).get("id"),
            user=payload.get("sender", {}).get("login"),
            url=repo.get("html_url"),
        )


# =============================================================================
# Combined GitHub Provider
# =============================================================================

class GitHubProvider(IntegrationProvider):
    """
    Combined GitHub provider implementing all capabilities:
    - Tickets (Issues)
    - CI/CD (Actions)
    - SCM (Repositories)
    - Webhooks
    """

    def __init__(self, config: ProviderConfig = None):
        config = config or github_config_from_env()
        super().__init__(config)

        self._ticket_provider = GitHubTicketProvider(config)
        self._ci_provider = GitHubCIProvider(config)
        self._scm_provider = GitHubSCMProvider(config)
        self._webhook_handler = GitHubWebhookHandler(config)

    @property
    def provider_type(self) -> ProviderType:
        return ProviderType.GITHUB

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
    def ticket_provider(self) -> GitHubTicketProvider:
        return self._ticket_provider

    @property
    def ci_provider(self) -> GitHubCIProvider:
        return self._ci_provider

    @property
    def scm_provider(self) -> GitHubSCMProvider:
        return self._scm_provider

    @property
    def webhook_handler(self) -> GitHubWebhookHandler:
        return self._webhook_handler

    async def test_connection(self) -> Dict[str, Any]:
        result = await self._ticket_provider.test_connection()
        result["provider"] = "github"
        result["capabilities"] = ["tickets", "ci", "scm", "webhooks"]
        return result

    async def close(self):
        await self._ticket_provider.close()
        await self._ci_provider.close()
        await self._scm_provider.close()
