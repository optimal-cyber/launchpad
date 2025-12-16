"""Configuration management for Optimal Security Agent"""
import os
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class PlatformConfig:
    """Platform connection configuration"""
    api_url: str = os.getenv("OPTIMAL_API_URL", "http://api-gateway:8000")
    api_key: str = os.getenv("OPTIMAL_API_KEY", "")
    verify_ssl: bool = os.getenv("OPTIMAL_VERIFY_SSL", "true").lower() == "true"


@dataclass
class AgentConfig:
    """Agent identity configuration"""
    name: str = os.getenv("OPTIMAL_AGENT_NAME", "")
    environment: str = os.getenv("OPTIMAL_ENVIRONMENT", "production")
    cluster_name: str = os.getenv("OPTIMAL_CLUSTER_NAME", "default")
    node_name: str = os.getenv("OPTIMAL_NODE_NAME", "")
    namespace: str = os.getenv("OPTIMAL_NAMESPACE", "optimal-agent")
    pod_name: str = os.getenv("OPTIMAL_POD_NAME", "")


@dataclass
class CapabilitiesConfig:
    """Agent capabilities configuration"""
    vulnerability_scanning: bool = os.getenv("OPTIMAL_VULN_SCANNING", "true").lower() == "true"
    runtime_security: bool = os.getenv("OPTIMAL_RUNTIME_SECURITY", "true").lower() == "true"
    sbom_generation: bool = os.getenv("OPTIMAL_SBOM_GENERATION", "true").lower() == "true"
    compliance_auditing: bool = os.getenv("OPTIMAL_COMPLIANCE_AUDITING", "false").lower() == "true"
    secret_detection: bool = os.getenv("OPTIMAL_SECRET_DETECTION", "false").lower() == "true"


@dataclass
class ScanConfig:
    """Scan configuration"""
    interval: int = int(os.getenv("OPTIMAL_SCAN_INTERVAL", "300"))
    scan_on_start: bool = os.getenv("OPTIMAL_SCAN_ON_START", "true").lower() == "true"
    severity_threshold: str = os.getenv("OPTIMAL_SEVERITY_THRESHOLD", "low")
    excluded_namespaces: List[str] = field(default_factory=lambda:
        os.getenv("OPTIMAL_EXCLUDED_NAMESPACES", "kube-system,kube-public").split(","))
    excluded_images: List[str] = field(default_factory=lambda:
        os.getenv("OPTIMAL_EXCLUDED_IMAGES", "").split(",") if os.getenv("OPTIMAL_EXCLUDED_IMAGES") else [])


@dataclass
class RuntimeConfig:
    """Runtime configuration"""
    heartbeat_interval: int = int(os.getenv("OPTIMAL_HEARTBEAT_INTERVAL", "30"))
    container_poll_interval: int = int(os.getenv("OPTIMAL_CONTAINER_POLL_INTERVAL", "10"))
    log_level: str = os.getenv("OPTIMAL_LOG_LEVEL", "INFO")
    metrics_port: int = int(os.getenv("OPTIMAL_METRICS_PORT", "8080"))


@dataclass
class Config:
    """Main configuration container"""
    platform: PlatformConfig = field(default_factory=PlatformConfig)
    agent: AgentConfig = field(default_factory=AgentConfig)
    capabilities: CapabilitiesConfig = field(default_factory=CapabilitiesConfig)
    scan: ScanConfig = field(default_factory=ScanConfig)
    runtime: RuntimeConfig = field(default_factory=RuntimeConfig)

    def validate(self) -> List[str]:
        """Validate configuration and return list of errors"""
        errors = []

        if not self.platform.api_url:
            errors.append("OPTIMAL_API_URL is required")
        if not self.platform.api_key:
            errors.append("OPTIMAL_API_KEY is required")

        return errors


def load_config() -> Config:
    """Load configuration from environment variables"""
    return Config()
