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

__all__ = [
    "BaseAgent",
    "AgentConfig",
    "AgentInfo",
    "AgentStatus",
    "AgentCapability",
    "Environment",
    "create_agent_from_env",
]

__version__ = "1.0.0"
