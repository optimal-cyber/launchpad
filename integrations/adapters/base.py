"""
Optimal Platform - Integration Adapter Base Interfaces

CI/CD agnostic interfaces for:
- Ticket/Issue Management (GitLab Issues, GitHub Issues, Jira, Azure DevOps)
- CI/CD Pipelines (GitLab CI, GitHub Actions, Jenkins, Azure Pipelines)
- Source Code Management (GitLab, GitHub, Bitbucket, Azure Repos)
- Webhooks (universal webhook handling)

All adapters implement these interfaces, allowing the platform to work with
any combination of providers.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union
import logging

logger = logging.getLogger(__name__)


# =============================================================================
# Common Enums
# =============================================================================

class ProviderType(str, Enum):
    """Supported provider types"""
    GITLAB = "gitlab"
    GITHUB = "github"
    JENKINS = "jenkins"
    JIRA = "jira"
    AZURE_DEVOPS = "azure_devops"
    BITBUCKET = "bitbucket"


class TicketPriority(str, Enum):
    """Normalized ticket priority levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFORMATIONAL = "informational"


class TicketStatus(str, Enum):
    """Normalized ticket status"""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"
    REOPENED = "reopened"


class PipelineStatus(str, Enum):
    """Normalized pipeline status"""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELED = "canceled"
    SKIPPED = "skipped"


class WebhookEventType(str, Enum):
    """Normalized webhook event types"""
    PUSH = "push"
    PULL_REQUEST = "pull_request"
    MERGE_REQUEST = "merge_request"
    PIPELINE_COMPLETE = "pipeline_complete"
    ISSUE_CREATED = "issue_created"
    ISSUE_UPDATED = "issue_updated"
    ISSUE_CLOSED = "issue_closed"
    COMMENT_ADDED = "comment_added"
    TAG_CREATED = "tag_created"
    RELEASE_CREATED = "release_created"


# =============================================================================
# Common Data Models
# =============================================================================

@dataclass
class ProviderConfig:
    """Base configuration for all providers"""
    provider_type: ProviderType
    base_url: str
    token: str
    verify_ssl: bool = True
    timeout: int = 30
    # Optional fields for specific providers
    username: str = ""
    project_id: str = ""
    organization: str = ""
    extra: Dict[str, Any] = field(default_factory=dict)

    @property
    def is_configured(self) -> bool:
        return bool(self.base_url and self.token)


@dataclass
class Ticket:
    """Normalized ticket/issue representation"""
    id: str
    key: str  # Human-readable key (e.g., "SEC-123", "#456")
    title: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    url: str
    labels: List[str] = field(default_factory=list)
    assignee: Optional[str] = None
    reporter: Optional[str] = None
    due_date: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    provider: ProviderType = ProviderType.GITLAB
    raw_data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TicketCreateRequest:
    """Request to create a ticket"""
    title: str
    description: str
    priority: TicketPriority = TicketPriority.MEDIUM
    labels: List[str] = field(default_factory=list)
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    # Vulnerability-specific fields
    vuln_id: Optional[str] = None
    severity: Optional[str] = None
    environment: Optional[str] = None
    affected_asset: Optional[str] = None
    # Provider-specific fields
    project_id: Optional[str] = None
    extra: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TicketUpdateRequest:
    """Request to update a ticket"""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    labels: Optional[List[str]] = None
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    extra: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TicketResponse:
    """Response from ticket operations"""
    success: bool
    ticket: Optional[Ticket] = None
    message: str = ""
    error: Optional[str] = None


@dataclass
class Pipeline:
    """Normalized pipeline/build representation"""
    id: str
    ref: str  # Branch or tag
    sha: str  # Commit SHA
    status: PipelineStatus
    url: str
    created_at: Optional[str] = None
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    duration: Optional[int] = None  # seconds
    provider: ProviderType = ProviderType.GITLAB
    raw_data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PipelineJob:
    """Normalized job within a pipeline"""
    id: str
    name: str
    stage: str
    status: PipelineStatus
    url: str
    artifacts: List[str] = field(default_factory=list)
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    duration: Optional[int] = None
    raw_data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Artifact:
    """Pipeline artifact"""
    name: str
    path: str
    size: int = 0
    url: Optional[str] = None


@dataclass
class WebhookEvent:
    """Normalized webhook event"""
    event_type: WebhookEventType
    provider: ProviderType
    project_id: str
    timestamp: str
    payload: Dict[str, Any]
    # Extracted common fields
    ref: Optional[str] = None
    sha: Optional[str] = None
    user: Optional[str] = None
    url: Optional[str] = None


@dataclass
class Repository:
    """Normalized repository representation"""
    id: str
    name: str
    full_name: str
    url: str
    default_branch: str
    provider: ProviderType
    visibility: str = "private"
    description: str = ""


@dataclass
class Comment:
    """Normalized comment on ticket/issue/PR"""
    id: str
    body: str
    author: str
    created_at: str
    updated_at: Optional[str] = None


# =============================================================================
# Abstract Base Classes - Ticket Provider
# =============================================================================

class TicketProvider(ABC):
    """
    Abstract interface for ticket/issue management.
    Implementations: GitLab Issues, GitHub Issues, Jira, Azure DevOps Work Items
    """

    def __init__(self, config: ProviderConfig):
        self.config = config
        self.logger = logging.getLogger(f"optimal.adapter.{config.provider_type.value}.tickets")

    @property
    @abstractmethod
    def provider_type(self) -> ProviderType:
        """Return the provider type"""
        pass

    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        """Test connection to the provider"""
        pass

    @abstractmethod
    async def create_ticket(self, request: TicketCreateRequest) -> TicketResponse:
        """Create a new ticket/issue"""
        pass

    @abstractmethod
    async def update_ticket(self, ticket_id: str, request: TicketUpdateRequest) -> TicketResponse:
        """Update an existing ticket"""
        pass

    @abstractmethod
    async def get_ticket(self, ticket_id: str) -> Optional[Ticket]:
        """Get ticket details"""
        pass

    @abstractmethod
    async def close_ticket(self, ticket_id: str) -> TicketResponse:
        """Close a ticket"""
        pass

    @abstractmethod
    async def reopen_ticket(self, ticket_id: str) -> TicketResponse:
        """Reopen a ticket"""
        pass

    @abstractmethod
    async def add_comment(self, ticket_id: str, comment: str) -> Dict[str, Any]:
        """Add a comment to a ticket"""
        pass

    @abstractmethod
    async def search_tickets(
        self,
        labels: List[str] = None,
        status: TicketStatus = None,
        query: str = None,
        limit: int = 50
    ) -> List[Ticket]:
        """Search for tickets"""
        pass

    @abstractmethod
    async def find_existing_vuln_ticket(
        self,
        vuln_id: str,
        environment: str = None
    ) -> Optional[Ticket]:
        """Find existing ticket for a vulnerability (to avoid duplicates)"""
        pass

    async def close(self):
        """Cleanup resources"""
        pass

    # Utility methods (can be overridden)
    def severity_to_priority(self, severity: str) -> TicketPriority:
        """Map vulnerability severity to ticket priority"""
        mapping = {
            "critical": TicketPriority.CRITICAL,
            "high": TicketPriority.HIGH,
            "medium": TicketPriority.MEDIUM,
            "low": TicketPriority.LOW,
            "informational": TicketPriority.INFORMATIONAL,
        }
        return mapping.get(severity.lower(), TicketPriority.MEDIUM)


# =============================================================================
# Abstract Base Classes - CI/CD Provider
# =============================================================================

class CIProvider(ABC):
    """
    Abstract interface for CI/CD pipeline integration.
    Implementations: GitLab CI, GitHub Actions, Jenkins, Azure Pipelines
    """

    def __init__(self, config: ProviderConfig):
        self.config = config
        self.logger = logging.getLogger(f"optimal.adapter.{config.provider_type.value}.ci")

    @property
    @abstractmethod
    def provider_type(self) -> ProviderType:
        """Return the provider type"""
        pass

    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        """Test connection to the provider"""
        pass

    @abstractmethod
    async def get_pipeline(self, pipeline_id: str) -> Optional[Pipeline]:
        """Get pipeline details"""
        pass

    @abstractmethod
    async def get_pipeline_jobs(self, pipeline_id: str) -> List[PipelineJob]:
        """Get jobs in a pipeline"""
        pass

    @abstractmethod
    async def get_job_artifacts(self, job_id: str) -> List[Artifact]:
        """Get list of artifacts for a job"""
        pass

    @abstractmethod
    async def download_artifact(self, job_id: str, artifact_path: str) -> bytes:
        """Download a specific artifact file"""
        pass

    @abstractmethod
    async def trigger_pipeline(
        self,
        ref: str,
        variables: Dict[str, str] = None
    ) -> Optional[Pipeline]:
        """Trigger a new pipeline run"""
        pass

    @abstractmethod
    async def cancel_pipeline(self, pipeline_id: str) -> bool:
        """Cancel a running pipeline"""
        pass

    async def close(self):
        """Cleanup resources"""
        pass


# =============================================================================
# Abstract Base Classes - SCM Provider
# =============================================================================

class SCMProvider(ABC):
    """
    Abstract interface for Source Code Management.
    Implementations: GitLab, GitHub, Bitbucket, Azure Repos
    """

    def __init__(self, config: ProviderConfig):
        self.config = config
        self.logger = logging.getLogger(f"optimal.adapter.{config.provider_type.value}.scm")

    @property
    @abstractmethod
    def provider_type(self) -> ProviderType:
        """Return the provider type"""
        pass

    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        """Test connection to the provider"""
        pass

    @abstractmethod
    async def get_repository(self, repo_id: str) -> Optional[Repository]:
        """Get repository details"""
        pass

    @abstractmethod
    async def list_repositories(self, limit: int = 100) -> List[Repository]:
        """List accessible repositories"""
        pass

    @abstractmethod
    async def get_file_content(
        self,
        repo_id: str,
        file_path: str,
        ref: str = None
    ) -> Optional[bytes]:
        """Get file content from repository"""
        pass

    @abstractmethod
    async def create_branch(
        self,
        repo_id: str,
        branch_name: str,
        source_ref: str
    ) -> bool:
        """Create a new branch"""
        pass

    @abstractmethod
    async def create_pull_request(
        self,
        repo_id: str,
        title: str,
        description: str,
        source_branch: str,
        target_branch: str
    ) -> Dict[str, Any]:
        """Create a pull/merge request"""
        pass

    async def close(self):
        """Cleanup resources"""
        pass


# =============================================================================
# Abstract Base Classes - Webhook Handler
# =============================================================================

class WebhookHandler(ABC):
    """
    Abstract interface for webhook handling.
    Normalizes webhook events from different providers.
    """

    def __init__(self, config: ProviderConfig):
        self.config = config
        self.logger = logging.getLogger(f"optimal.adapter.{config.provider_type.value}.webhook")

    @property
    @abstractmethod
    def provider_type(self) -> ProviderType:
        """Return the provider type"""
        pass

    @abstractmethod
    def verify_signature(self, payload: bytes, signature: str) -> bool:
        """Verify webhook signature"""
        pass

    @abstractmethod
    def parse_event(self, headers: Dict[str, str], payload: Dict[str, Any]) -> WebhookEvent:
        """Parse webhook payload into normalized event"""
        pass

    @abstractmethod
    def get_event_type(self, headers: Dict[str, str], payload: Dict[str, Any]) -> WebhookEventType:
        """Determine event type from webhook"""
        pass


# =============================================================================
# Combined Provider Interface
# =============================================================================

class IntegrationProvider(ABC):
    """
    Combined interface for providers that support multiple capabilities.
    GitLab and GitHub implement all capabilities; Jenkins only CI, Jira only tickets.
    """

    def __init__(self, config: ProviderConfig):
        self.config = config
        self.logger = logging.getLogger(f"optimal.adapter.{config.provider_type.value}")

    @property
    @abstractmethod
    def provider_type(self) -> ProviderType:
        pass

    @property
    @abstractmethod
    def supports_tickets(self) -> bool:
        pass

    @property
    @abstractmethod
    def supports_ci(self) -> bool:
        pass

    @property
    @abstractmethod
    def supports_scm(self) -> bool:
        pass

    @property
    def ticket_provider(self) -> Optional[TicketProvider]:
        """Get ticket provider if supported"""
        return None

    @property
    def ci_provider(self) -> Optional[CIProvider]:
        """Get CI provider if supported"""
        return None

    @property
    def scm_provider(self) -> Optional[SCMProvider]:
        """Get SCM provider if supported"""
        return None

    @property
    def webhook_handler(self) -> Optional[WebhookHandler]:
        """Get webhook handler if supported"""
        return None

    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        """Test connection to the provider"""
        pass

    async def close(self):
        """Cleanup all resources"""
        if self.ticket_provider:
            await self.ticket_provider.close()
        if self.ci_provider:
            await self.ci_provider.close()
        if self.scm_provider:
            await self.scm_provider.close()
