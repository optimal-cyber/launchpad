"""
Optimal Platform Agent Framework
Environment-aware agents for vulnerability scanning, configuration auditing, and compliance.
"""

from .base_agent import (
    BaseAgent,
    AgentConfig,
    AgentInfo,
    AgentStatus,
    AgentCapability,
    Environment,
    create_agent_from_env,
)

from .auth import (
    OAuthConfig,
    OAuthTokenManager,
    TokenInfo,
    create_token_manager,
)

from .offline_queue import (
    OfflineQueue,
    OfflineQueueMixin,
    QueueItem,
    QueueItemStatus,
)

__all__ = [
    # Base agent
    "BaseAgent",
    "AgentConfig",
    "AgentInfo",
    "AgentStatus",
    "AgentCapability",
    "Environment",
    "create_agent_from_env",
    # OAuth authentication
    "OAuthConfig",
    "OAuthTokenManager",
    "TokenInfo",
    "create_token_manager",
    # Offline queue
    "OfflineQueue",
    "OfflineQueueMixin",
    "QueueItem",
    "QueueItemStatus",
]

__version__ = "1.0.0"
