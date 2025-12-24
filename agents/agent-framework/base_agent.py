"""
Optimal Platform - Base Agent Framework
Environment-aware agent base class for all Optimal agents.

Provides:
- Environment detection and registration
- Heartbeat and health reporting
- Secure communication with platform API
- OAuth 2.0 authentication with automatic token refresh
- Configuration management
- Logging and metrics
"""

import asyncio
import hashlib
import json
import logging
import os
import platform
import signal
import socket
import sys
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

import aiohttp

from .auth import OAuthConfig, OAuthTokenManager, create_token_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


# =============================================================================
# Enums and Types
# =============================================================================

class Environment(str, Enum):
    """Deployment environment types"""
    PRODUCTION = "production"
    STAGING = "staging"
    DEVELOPMENT = "development"
    LOCAL = "local"
    UNKNOWN = "unknown"


class AgentStatus(str, Enum):
    """Agent status states"""
    INITIALIZING = "initializing"
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    ERROR = "error"
    SHUTTING_DOWN = "shutting_down"


class AgentCapability(str, Enum):
    """Agent capability types"""
    VULNERABILITY_SCAN = "vulnerability_scan"
    CONTAINER_SCAN = "container_scan"
    IMAGE_SCAN = "image_scan"
    FILESYSTEM_SCAN = "filesystem_scan"
    CONFIG_AUDIT = "config_audit"
    RUNTIME_MONITOR = "runtime_monitor"
    THREAT_INTEL = "threat_intel"
    SECRET_DETECTION = "secret_detection"
    COMPLIANCE_CHECK = "compliance_check"
    SBOM_GENERATION = "sbom_generation"


# =============================================================================
# Configuration
# =============================================================================

@dataclass
class AgentConfig:
    """Agent configuration loaded from environment variables"""
    # Platform connection
    api_url: str = ""
    api_token: str = ""  # Legacy token (deprecated, use OAuth)

    # OAuth 2.0 credentials
    client_id: str = ""
    client_secret: str = ""
    token_endpoint: str = ""
    use_oauth: bool = True  # Whether to use OAuth (vs legacy token)

    # Environment identification
    environment: str = "unknown"
    cluster_name: str = ""
    namespace: str = ""
    node_name: str = ""

    # Agent identification
    agent_name: str = ""
    agent_version: str = "1.0.0"
    org_id: str = "default"

    # Behavior settings
    heartbeat_interval: int = 60  # seconds
    scan_interval: int = 300  # seconds
    max_retries: int = 3
    retry_delay: int = 5  # seconds

    # Security settings
    verify_ssl: bool = True
    ca_cert_path: str = ""

    # Feature flags
    auto_create_issues: bool = True
    issue_severity_threshold: str = "high"

    # GitLab integration (for issues)
    gitlab_project_id: int = 0

    @classmethod
    def from_env(cls) -> "AgentConfig":
        """Load configuration from environment variables"""
        api_url = os.getenv("OPTIMAL_API_URL", os.getenv("API_GATEWAY_URL", "http://localhost:8000"))

        # Check for OAuth credentials
        client_id = os.getenv("OPTIMAL_CLIENT_ID", os.getenv("AGENT_CLIENT_ID", ""))
        client_secret = os.getenv("OPTIMAL_CLIENT_SECRET", os.getenv("AGENT_CLIENT_SECRET", ""))

        # Use OAuth if credentials are provided, otherwise fall back to legacy token
        use_oauth = bool(client_id and client_secret)

        return cls(
            api_url=api_url,
            api_token=os.getenv("OPTIMAL_API_TOKEN", os.getenv("AGENT_TOKEN", "")),
            client_id=client_id,
            client_secret=client_secret,
            token_endpoint=os.getenv("OPTIMAL_TOKEN_ENDPOINT", f"{api_url.rstrip('/')}/api/auth/agent/token"),
            use_oauth=use_oauth,
            environment=os.getenv("OPTIMAL_ENVIRONMENT", os.getenv("ENVIRONMENT", "unknown")),
            cluster_name=os.getenv("OPTIMAL_CLUSTER", os.getenv("CLUSTER_NAME", "")),
            namespace=os.getenv("OPTIMAL_NAMESPACE", os.getenv("POD_NAMESPACE", "")),
            node_name=os.getenv("OPTIMAL_NODE", os.getenv("NODE_NAME", "")),
            agent_name=os.getenv("OPTIMAL_AGENT_NAME", ""),
            agent_version=os.getenv("OPTIMAL_AGENT_VERSION", "1.0.0"),
            org_id=os.getenv("OPTIMAL_ORG_ID", "default"),
            heartbeat_interval=int(os.getenv("OPTIMAL_HEARTBEAT_INTERVAL", "60")),
            scan_interval=int(os.getenv("OPTIMAL_SCAN_INTERVAL", "300")),
            max_retries=int(os.getenv("OPTIMAL_MAX_RETRIES", "3")),
            retry_delay=int(os.getenv("OPTIMAL_RETRY_DELAY", "5")),
            verify_ssl=os.getenv("OPTIMAL_VERIFY_SSL", "true").lower() == "true",
            ca_cert_path=os.getenv("OPTIMAL_CA_CERT_PATH", ""),
            auto_create_issues=os.getenv("OPTIMAL_AUTO_CREATE_ISSUES", "true").lower() == "true",
            issue_severity_threshold=os.getenv("OPTIMAL_ISSUE_SEVERITY_THRESHOLD", "high"),
            gitlab_project_id=int(os.getenv("GITLAB_PROJECT_ID", "0")),
        )

    def get_oauth_config(self) -> OAuthConfig:
        """Get OAuth configuration for token manager"""
        return OAuthConfig(
            client_id=self.client_id,
            client_secret=self.client_secret,
            token_endpoint=self.token_endpoint,
        )


# =============================================================================
# Agent Info
# =============================================================================

@dataclass
class AgentInfo:
    """Agent identification and metadata"""
    agent_id: str
    agent_type: str
    hostname: str
    ip_address: str
    os_type: str
    os_version: str
    architecture: str
    environment: Environment
    cluster: str
    namespace: str
    node: str
    version: str
    capabilities: List[str]
    labels: Dict[str, str] = field(default_factory=dict)
    registered_at: str = ""
    last_heartbeat: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# =============================================================================
# Base Agent Class
# =============================================================================

class BaseAgent(ABC):
    """
    Abstract base class for all Optimal Platform agents.

    Provides common functionality:
    - Environment detection
    - Platform registration
    - Heartbeat mechanism
    - Secure API communication
    - Graceful shutdown
    """

    AGENT_TYPE: str = "base"
    AGENT_VERSION: str = "1.0.0"

    def __init__(self, config: AgentConfig = None):
        self.config = config or AgentConfig.from_env()
        self.logger = logging.getLogger(f"optimal.agent.{self.AGENT_TYPE}")

        # Generate agent ID
        self.agent_id = self._generate_agent_id()

        # Detect environment
        self.environment = self._detect_environment()

        # Build agent info
        self.info = self._build_agent_info()

        # State
        self.status = AgentStatus.INITIALIZING
        self._running = False
        self._session: Optional[aiohttp.ClientSession] = None
        self._heartbeat_task: Optional[asyncio.Task] = None
        self._main_task: Optional[asyncio.Task] = None

        # OAuth token manager
        self._token_manager: Optional[OAuthTokenManager] = None
        self._current_token: Optional[str] = None
        if self.config.use_oauth:
            self._token_manager = OAuthTokenManager(
                self.config.get_oauth_config(),
                verify_ssl=self.config.verify_ssl
            )
            self.logger.info("OAuth authentication enabled")
        elif self.config.api_token:
            self.logger.info("Using legacy API token authentication")
        else:
            self.logger.warning("No authentication configured - agent may fail to communicate")

        # Setup signal handlers
        self._setup_signal_handlers()

        self.logger.info(f"Agent initialized: {self.agent_id} ({self.AGENT_TYPE})")
        self.logger.info(f"Environment: {self.environment.value}")
        self.logger.info(f"API URL: {self.config.api_url}")

    def _generate_agent_id(self) -> str:
        """Generate a unique, consistent agent ID based on machine/pod info"""
        # Use multiple sources for uniqueness
        components = [
            platform.node(),
            self.AGENT_TYPE,
            self.config.namespace or "default",
            self.config.node_name or "unknown",
            # Add pod name if in K8s
            os.getenv("POD_NAME", ""),
        ]

        unique_string = "-".join(filter(None, components))
        hash_suffix = hashlib.sha256(unique_string.encode()).hexdigest()[:12]

        return f"agent-{self.AGENT_TYPE}-{hash_suffix}"

    def _detect_environment(self) -> Environment:
        """Detect the deployment environment"""
        # Check explicit configuration first
        env_str = self.config.environment.lower()

        env_mapping = {
            "production": Environment.PRODUCTION,
            "prod": Environment.PRODUCTION,
            "staging": Environment.STAGING,
            "stage": Environment.STAGING,
            "development": Environment.DEVELOPMENT,
            "dev": Environment.DEVELOPMENT,
            "local": Environment.LOCAL,
        }

        if env_str in env_mapping:
            return env_mapping[env_str]

        # Try to detect from K8s namespace
        namespace = self.config.namespace.lower()
        if "prod" in namespace:
            return Environment.PRODUCTION
        elif "stag" in namespace:
            return Environment.STAGING
        elif "dev" in namespace:
            return Environment.DEVELOPMENT

        # Check for local development indicators
        if os.path.exists("/.dockerenv"):
            # In Docker, check if it's local development
            if os.getenv("LOCAL_DEV", "").lower() == "true":
                return Environment.LOCAL

        return Environment.UNKNOWN

    def _build_agent_info(self) -> AgentInfo:
        """Build agent information structure"""
        return AgentInfo(
            agent_id=self.agent_id,
            agent_type=self.AGENT_TYPE,
            hostname=platform.node(),
            ip_address=self._get_ip_address(),
            os_type=platform.system(),
            os_version=platform.release(),
            architecture=platform.machine(),
            environment=self.environment,
            cluster=self.config.cluster_name,
            namespace=self.config.namespace,
            node=self.config.node_name,
            version=self.config.agent_version or self.AGENT_VERSION,
            capabilities=self.get_capabilities(),
            labels=self._get_labels(),
            registered_at=datetime.utcnow().isoformat()
        )

    def _get_ip_address(self) -> str:
        """Get the agent's IP address"""
        try:
            # Try to get non-loopback address
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "127.0.0.1"

    def _get_labels(self) -> Dict[str, str]:
        """Get agent labels from environment"""
        labels = {
            "agent_type": self.AGENT_TYPE,
            "environment": self.environment.value,
        }

        # Add K8s labels if available
        if self.config.cluster_name:
            labels["cluster"] = self.config.cluster_name
        if self.config.namespace:
            labels["namespace"] = self.config.namespace
        if self.config.node_name:
            labels["node"] = self.config.node_name

        # Add custom labels from environment
        custom_labels = os.getenv("OPTIMAL_AGENT_LABELS", "")
        if custom_labels:
            for pair in custom_labels.split(","):
                if "=" in pair:
                    key, value = pair.split("=", 1)
                    labels[key.strip()] = value.strip()

        return labels

    def _setup_signal_handlers(self):
        """Setup graceful shutdown signal handlers"""
        def handle_signal(signum, frame):
            self.logger.info(f"Received signal {signum}, initiating shutdown...")
            self._running = False
            asyncio.create_task(self.shutdown())

        signal.signal(signal.SIGTERM, handle_signal)
        signal.signal(signal.SIGINT, handle_signal)

    @abstractmethod
    def get_capabilities(self) -> List[str]:
        """Return list of agent capabilities"""
        pass

    @abstractmethod
    async def run_scan(self) -> Dict[str, Any]:
        """Execute the agent's main scan/check operation"""
        pass

    # =========================================================================
    # HTTP Session Management
    # =========================================================================

    async def _get_auth_token(self) -> str:
        """Get current authentication token (OAuth or legacy)"""
        if self._token_manager:
            # Use OAuth token manager
            token = await self._token_manager.get_token()
            if token:
                self._current_token = token
                return token
            else:
                self.logger.warning("Failed to get OAuth token")
                return ""
        else:
            # Use legacy API token
            return self.config.api_token

    async def _refresh_session_token(self):
        """Refresh the session's authorization header with a new token"""
        if self._session and not self._session.closed:
            token = await self._get_auth_token()
            if token:
                # aiohttp sessions don't allow header updates directly
                # We need to recreate the session
                await self._session.close()
                self._session = None

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session with current auth token"""
        # Check if we need to refresh the token
        if self._token_manager and self._token_manager._token:
            if self._token_manager._token.should_refresh:
                self.logger.debug("Token needs refresh, recreating session")
                if self._session and not self._session.closed:
                    await self._session.close()
                self._session = None

        if self._session is None or self._session.closed:
            # Get current auth token
            token = await self._get_auth_token()

            connector = aiohttp.TCPConnector(
                ssl=self.config.verify_ssl
            )

            self._session = aiohttp.ClientSession(
                connector=connector,
                headers={
                    "Authorization": f"Bearer {token}" if token else "",
                    "Content-Type": "application/json",
                    "X-Agent-ID": self.agent_id,
                    "X-Agent-Type": self.AGENT_TYPE,
                    "X-Environment": self.environment.value,
                    "X-Org-ID": self.config.org_id,
                },
                timeout=aiohttp.ClientTimeout(total=30)
            )

        return self._session

    async def _api_request(
        self,
        method: str,
        endpoint: str,
        data: Dict = None,
        retry: bool = True
    ) -> Optional[Dict[str, Any]]:
        """Make an API request with retry logic and token refresh"""
        url = f"{self.config.api_url.rstrip('/')}{endpoint}"
        token_refreshed = False

        for attempt in range(self.config.max_retries if retry else 1):
            try:
                session = await self._get_session()
                async with session.request(method, url, json=data) as resp:
                    if resp.status in [200, 201]:
                        return await resp.json()
                    elif resp.status == 401:
                        # Token might be expired - try to refresh
                        if self._token_manager and not token_refreshed:
                            self.logger.info("Received 401, attempting token refresh...")
                            await self._token_manager.invalidate()
                            await self._refresh_session_token()
                            token_refreshed = True
                            continue  # Retry with new token
                        else:
                            self.logger.error("Authentication failed - check credentials")
                            return None
                    elif resp.status >= 500:
                        self.logger.warning(f"Server error {resp.status}, attempt {attempt + 1}")
                    else:
                        text = await resp.text()
                        self.logger.error(f"API request failed: {resp.status} - {text}")
                        return None
            except aiohttp.ClientError as e:
                self.logger.warning(f"Connection error: {e}, attempt {attempt + 1}")
            except Exception as e:
                self.logger.error(f"Unexpected error: {e}")
                return None

            if attempt < self.config.max_retries - 1:
                await asyncio.sleep(self.config.retry_delay)

        return None

    # =========================================================================
    # Platform Communication
    # =========================================================================

    async def register(self) -> bool:
        """Register agent with the platform"""
        self.logger.info("Registering with platform...")

        payload = {
            "agent_id": self.agent_id,
            "agent_type": self.AGENT_TYPE,
            "hostname": self.info.hostname,
            "ip_address": self.info.ip_address,
            "os": self.info.os_type,
            "os_version": self.info.os_version,
            "architecture": self.info.architecture,
            "environment": self.environment.value,
            "cluster": self.info.cluster,
            "namespace": self.info.namespace,
            "node": self.info.node,
            "version": self.info.version,
            "capabilities": self.info.capabilities,
            "labels": self.info.labels,
            "registered_at": datetime.utcnow().isoformat()
        }

        result = await self._api_request("POST", "/api/v1/agents/register", payload)

        if result:
            self.logger.info(f"Successfully registered with platform")
            self.status = AgentStatus.HEALTHY
            return True
        else:
            self.logger.warning("Failed to register with platform (will continue anyway)")
            return False

    async def heartbeat(self) -> bool:
        """Send heartbeat to platform"""
        payload = {
            "agent_id": self.agent_id,
            "status": self.status.value,
            "timestamp": datetime.utcnow().isoformat(),
            "environment": self.environment.value,
            "metrics": await self.get_metrics()
        }

        result = await self._api_request("POST", "/api/v1/agents/heartbeat", payload, retry=False)

        if result:
            self.info.last_heartbeat = datetime.utcnow().isoformat()
            return True
        return False

    async def send_results(self, results: Dict[str, Any]) -> bool:
        """Send scan/check results to platform"""
        payload = {
            "agent_id": self.agent_id,
            "environment": self.environment.value,
            "timestamp": datetime.utcnow().isoformat(),
            "results": results
        }

        result = await self._api_request("POST", "/api/v1/scans/ingest", payload)

        if result:
            self.logger.info("Results sent to platform")

            # Auto-create issues if enabled
            if self.config.auto_create_issues and self.config.gitlab_project_id:
                await self._auto_create_issues(results)

            return True
        return False

    async def _auto_create_issues(self, results: Dict[str, Any]):
        """Automatically create GitLab issues from scan results"""
        try:
            payload = {
                "scan_results": results,
                "project_id": self.config.gitlab_project_id,
                "environment": self.environment.value,
                "severity_threshold": self.config.issue_severity_threshold
            }

            result = await self._api_request(
                "POST",
                f"/api/issues/auto-create?project_id={self.config.gitlab_project_id}&environment={self.environment.value}&severity_threshold={self.config.issue_severity_threshold}",
                results
            )

            if result:
                created = result.get("created", [])
                self.logger.info(f"Auto-created {len(created)} issues from scan results")
        except Exception as e:
            self.logger.warning(f"Failed to auto-create issues: {e}")

    async def get_metrics(self) -> Dict[str, Any]:
        """Get agent metrics for heartbeat"""
        # Override in subclasses for specific metrics
        return {
            "uptime_seconds": 0,  # TODO: track uptime
            "scans_completed": 0,
            "last_scan_duration": 0,
        }

    # =========================================================================
    # Main Loop
    # =========================================================================

    async def start(self):
        """Start the agent"""
        self.logger.info(f"Starting {self.AGENT_TYPE} agent...")
        self._running = True

        # Register with platform
        await self.register()

        # Start heartbeat task
        self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())

        # Start main loop
        self._main_task = asyncio.create_task(self._main_loop())

        # Wait for tasks
        try:
            await asyncio.gather(self._heartbeat_task, self._main_task)
        except asyncio.CancelledError:
            self.logger.info("Agent tasks cancelled")

    async def _heartbeat_loop(self):
        """Background heartbeat loop"""
        while self._running:
            try:
                await self.heartbeat()
            except Exception as e:
                self.logger.warning(f"Heartbeat error: {e}")

            await asyncio.sleep(self.config.heartbeat_interval)

    async def _main_loop(self):
        """Main agent loop"""
        while self._running:
            try:
                self.logger.info("Starting scan...")
                results = await self.run_scan()

                if results:
                    await self.send_results(results)

                self.logger.info(f"Scan complete, sleeping for {self.config.scan_interval}s")

            except Exception as e:
                self.logger.error(f"Scan error: {e}")
                self.status = AgentStatus.ERROR

            await asyncio.sleep(self.config.scan_interval)

    async def shutdown(self):
        """Graceful shutdown"""
        self.logger.info("Shutting down agent...")
        self.status = AgentStatus.SHUTTING_DOWN
        self._running = False

        # Cancel tasks
        if self._heartbeat_task:
            self._heartbeat_task.cancel()
        if self._main_task:
            self._main_task.cancel()

        # Close sessions
        if self._session and not self._session.closed:
            await self._session.close()

        # Close token manager session
        if self._token_manager:
            await self._token_manager.close()

        self.logger.info("Agent shutdown complete")

    def run(self):
        """Run the agent (blocking)"""
        asyncio.run(self.start())


# =============================================================================
# Utility Functions
# =============================================================================

def create_agent_from_env(agent_class: type) -> BaseAgent:
    """Factory function to create an agent from environment configuration"""
    config = AgentConfig.from_env()
    return agent_class(config)
