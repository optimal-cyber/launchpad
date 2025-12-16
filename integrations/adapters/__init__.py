"""
Optimal Platform - Integration Adapters

CI/CD agnostic adapters for integrating with various providers:
- GitLab (Issues, CI, SCM)
- GitHub (Issues, Actions, SCM)
- Jenkins (CI only) [Future]
- Jira (Tickets only) [Future]
- Azure DevOps (All) [Future]

Usage:
    from integrations.adapters import get_provider, ProviderType

    # Auto-detect from environment
    provider = get_provider()

    # Or specify explicitly
    gitlab = get_provider(ProviderType.GITLAB)
    github = get_provider(ProviderType.GITHUB)

    # Use unified interface
    ticket = await provider.ticket_provider.create_ticket(request)
    pipeline = await provider.ci_provider.get_pipeline(pipeline_id)
"""

import os
from typing import Optional

from .base import (
    # Enums
    ProviderType,
    TicketPriority,
    TicketStatus,
    PipelineStatus,
    WebhookEventType,
    # Data Models
    ProviderConfig,
    Ticket,
    TicketCreateRequest,
    TicketUpdateRequest,
    TicketResponse,
    Pipeline,
    PipelineJob,
    Artifact,
    WebhookEvent,
    Repository,
    Comment,
    # Abstract Classes
    TicketProvider,
    CIProvider,
    SCMProvider,
    WebhookHandler,
    IntegrationProvider,
)

from .gitlab_adapter import (
    GitLabProvider,
    GitLabTicketProvider,
    GitLabCIProvider,
    GitLabSCMProvider,
    GitLabWebhookHandler,
    gitlab_config_from_env,
)

from .github_adapter import (
    GitHubProvider,
    GitHubTicketProvider,
    GitHubCIProvider,
    GitHubSCMProvider,
    GitHubWebhookHandler,
    github_config_from_env,
)


# =============================================================================
# Provider Factory
# =============================================================================

def get_provider(
    provider_type: ProviderType = None,
    config: ProviderConfig = None
) -> IntegrationProvider:
    """
    Factory function to get the appropriate integration provider.

    Args:
        provider_type: Explicit provider type. If not specified, auto-detects from environment.
        config: Optional custom configuration. If not specified, loads from environment.

    Returns:
        IntegrationProvider instance (GitLabProvider, GitHubProvider, etc.)

    Environment Variables for Auto-Detection:
        OPTIMAL_PROVIDER: "gitlab" or "github"
        GITLAB_TOKEN: If set, will use GitLab
        GITHUB_TOKEN: If set, will use GitHub

    Usage:
        # Auto-detect
        provider = get_provider()

        # Explicit
        provider = get_provider(ProviderType.GITHUB)
    """
    if provider_type is None:
        provider_type = _detect_provider()

    if provider_type == ProviderType.GITLAB:
        return GitLabProvider(config or gitlab_config_from_env())
    elif provider_type == ProviderType.GITHUB:
        return GitHubProvider(config or github_config_from_env())
    else:
        raise ValueError(f"Unsupported provider type: {provider_type}")


def _detect_provider() -> ProviderType:
    """Auto-detect provider from environment variables"""
    # Check explicit setting first
    explicit = os.getenv("OPTIMAL_PROVIDER", "").lower()
    if explicit == "github":
        return ProviderType.GITHUB
    elif explicit == "gitlab":
        return ProviderType.GITLAB

    # Check for tokens
    if os.getenv("GITHUB_TOKEN"):
        return ProviderType.GITHUB
    if os.getenv("GITLAB_TOKEN"):
        return ProviderType.GITLAB

    # Default to GitLab
    return ProviderType.GITLAB


def get_ticket_provider(provider_type: ProviderType = None) -> TicketProvider:
    """Get just the ticket provider"""
    provider = get_provider(provider_type)
    if provider.supports_tickets:
        return provider.ticket_provider
    raise ValueError(f"Provider {provider_type} does not support tickets")


def get_ci_provider(provider_type: ProviderType = None) -> CIProvider:
    """Get just the CI provider"""
    provider = get_provider(provider_type)
    if provider.supports_ci:
        return provider.ci_provider
    raise ValueError(f"Provider {provider_type} does not support CI")


def get_scm_provider(provider_type: ProviderType = None) -> SCMProvider:
    """Get just the SCM provider"""
    provider = get_provider(provider_type)
    if provider.supports_scm:
        return provider.scm_provider
    raise ValueError(f"Provider {provider_type} does not support SCM")


# =============================================================================
# Exports
# =============================================================================

__all__ = [
    # Factory
    "get_provider",
    "get_ticket_provider",
    "get_ci_provider",
    "get_scm_provider",
    # Enums
    "ProviderType",
    "TicketPriority",
    "TicketStatus",
    "PipelineStatus",
    "WebhookEventType",
    # Data Models
    "ProviderConfig",
    "Ticket",
    "TicketCreateRequest",
    "TicketUpdateRequest",
    "TicketResponse",
    "Pipeline",
    "PipelineJob",
    "Artifact",
    "WebhookEvent",
    "Repository",
    "Comment",
    # Abstract Classes
    "TicketProvider",
    "CIProvider",
    "SCMProvider",
    "WebhookHandler",
    "IntegrationProvider",
    # GitLab
    "GitLabProvider",
    "GitLabTicketProvider",
    "GitLabCIProvider",
    "GitLabSCMProvider",
    "gitlab_config_from_env",
    # GitHub
    "GitHubProvider",
    "GitHubTicketProvider",
    "GitHubCIProvider",
    "GitHubSCMProvider",
    "github_config_from_env",
]

__version__ = "1.0.0"
