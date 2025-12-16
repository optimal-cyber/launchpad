#!/usr/bin/env python3
"""
Optimal Platform - Security Agent

Runs as a DaemonSet in tenant Kubernetes clusters.
Performs:
- Container vulnerability scanning (via Trivy)
- Runtime security monitoring
- SBOM generation
- Resource monitoring
- Sends data to Optimal Platform
"""

import os
import sys
import json
import time
import uuid
import socket
import asyncio
import logging
import hashlib
import subprocess
from datetime import datetime
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, asdict

import aiohttp
import psutil

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv("OPTIMAL_LOG_LEVEL", "INFO").upper()),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("optimal-agent")


# =============================================================================
# Configuration
# =============================================================================

@dataclass
class AgentConfig:
    # Platform connection
    api_url: str
    api_key: str

    # Agent identity
    agent_id: str
    agent_name: str
    environment: str
    cluster_name: str
    node_name: str
    namespace: str

    # Capabilities
    vuln_scanning: bool = True
    runtime_security: bool = True
    sbom_generation: bool = True
    compliance_auditing: bool = True
    secret_detection: bool = True

    # Scan settings
    scan_interval: int = 3600
    scan_on_start: bool = True
    severity_threshold: str = "high"

    # Heartbeat
    heartbeat_interval: int = 60

    @classmethod
    def from_env(cls) -> "AgentConfig":
        # Generate unique agent ID based on node
        node_name = os.getenv("OPTIMAL_NODE_NAME", socket.gethostname())
        agent_id = f"agent-{hashlib.sha256(node_name.encode()).hexdigest()[:16]}"

        return cls(
            api_url=os.getenv("OPTIMAL_API_URL", ""),
            api_key=os.getenv("OPTIMAL_API_KEY", ""),
            agent_id=agent_id,
            agent_name=os.getenv("OPTIMAL_AGENT_NAME", ""),
            environment=os.getenv("OPTIMAL_ENVIRONMENT", "production"),
            cluster_name=os.getenv("OPTIMAL_CLUSTER_NAME", ""),
            node_name=node_name,
            namespace=os.getenv("OPTIMAL_NAMESPACE", "optimal-system"),
            vuln_scanning=os.getenv("OPTIMAL_VULN_SCANNING", "true").lower() == "true",
            runtime_security=os.getenv("OPTIMAL_RUNTIME_SECURITY", "true").lower() == "true",
            sbom_generation=os.getenv("OPTIMAL_SBOM_GENERATION", "true").lower() == "true",
            compliance_auditing=os.getenv("OPTIMAL_COMPLIANCE_AUDITING", "true").lower() == "true",
            secret_detection=os.getenv("OPTIMAL_SECRET_DETECTION", "true").lower() == "true",
            scan_interval=int(os.getenv("OPTIMAL_SCAN_INTERVAL", "3600")),
            scan_on_start=os.getenv("OPTIMAL_SCAN_ON_START", "true").lower() == "true",
            severity_threshold=os.getenv("OPTIMAL_SEVERITY_THRESHOLD", "high"),
            heartbeat_interval=int(os.getenv("OPTIMAL_HEARTBEAT_INTERVAL", "60")),
        )


# =============================================================================
# Platform Client
# =============================================================================

class PlatformClient:
    """HTTP client for communicating with Optimal Platform"""

    def __init__(self, config: AgentConfig):
        self.config = config
        self.base_url = config.api_url.rstrip("/")
        self.headers = {
            "X-API-Key": config.api_key,
            "Content-Type": "application/json",
            "User-Agent": f"optimal-agent/{config.agent_id}",
        }
        self._session: Optional[aiohttp.ClientSession] = None
        self._tenant_db_info: Optional[Dict] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(headers=self.headers)
        return self._session

    async def close(self):
        if self._session:
            await self._session.close()

    async def validate_and_get_tenant(self) -> Dict[str, Any]:
        """Validate API key and get tenant database info"""
        session = await self._get_session()
        async with session.post(f"{self.base_url}/api/auth/validate-key") as resp:
            if resp.status != 200:
                raise Exception(f"API key validation failed: {await resp.text()}")
            self._tenant_db_info = await resp.json()
            return self._tenant_db_info

    async def register_agent(self) -> Dict[str, Any]:
        """Register agent with platform"""
        session = await self._get_session()

        capabilities = []
        if self.config.vuln_scanning:
            capabilities.append("vulnerability_scan")
        if self.config.runtime_security:
            capabilities.append("runtime_security")
        if self.config.sbom_generation:
            capabilities.append("sbom_generation")
        if self.config.compliance_auditing:
            capabilities.append("compliance_audit")
        if self.config.secret_detection:
            capabilities.append("secret_detection")

        payload = {
            "agent_id": self.config.agent_id,
            "name": self.config.agent_name or f"{self.config.node_name}-agent",
            "agent_type": "daemonset",
            "version": "1.0.0",
            "environment": self.config.environment,
            "cluster_name": self.config.cluster_name,
            "node_name": self.config.node_name,
            "namespace": self.config.namespace,
            "capabilities": capabilities,
        }

        async with session.post(f"{self.base_url}/api/agents/register", json=payload) as resp:
            if resp.status in (200, 201):
                logger.info(f"Agent registered: {self.config.agent_id}")
                return await resp.json()
            else:
                raise Exception(f"Agent registration failed: {await resp.text()}")

    async def send_heartbeat(self, status: str, metrics: Dict[str, Any]) -> bool:
        """Send heartbeat to platform"""
        session = await self._get_session()

        payload = {
            "agent_id": self.config.agent_id,
            "status": status,
            "timestamp": datetime.utcnow().isoformat(),
            **metrics,
        }

        async with session.post(f"{self.base_url}/api/agents/heartbeat", json=payload) as resp:
            return resp.status == 200

    async def send_scan_results(self, scan_type: str, target: str, results: Dict[str, Any]) -> bool:
        """Send scan results to platform"""
        session = await self._get_session()

        payload = {
            "agent_id": self.config.agent_id,
            "scan_type": scan_type,
            "target": target,
            "target_type": "container",
            "environment": self.config.environment,
            "timestamp": datetime.utcnow().isoformat(),
            "results": results,
        }

        async with session.post(f"{self.base_url}/api/scans/results", json=payload) as resp:
            if resp.status in (200, 201):
                logger.info(f"Scan results sent: {scan_type} for {target}")
                return True
            else:
                logger.error(f"Failed to send scan results: {await resp.text()}")
                return False

    async def send_containers(self, containers: List[Dict[str, Any]]) -> bool:
        """Send container inventory to platform"""
        session = await self._get_session()

        payload = {
            "agent_id": self.config.agent_id,
            "timestamp": datetime.utcnow().isoformat(),
            "containers": containers,
        }

        async with session.post(f"{self.base_url}/api/agents/containers", json=payload) as resp:
            return resp.status == 200


# =============================================================================
# Container Runtime Interface
# =============================================================================

class ContainerRuntime:
    """Interface for container runtimes (containerd, docker, cri-o)"""

    def __init__(self):
        self.runtime_type = self._detect_runtime()

    def _detect_runtime(self) -> str:
        """Detect which container runtime is available"""
        if os.path.exists("/run/containerd/containerd.sock"):
            return "containerd"
        elif os.path.exists("/var/run/docker.sock"):
            return "docker"
        elif os.path.exists("/var/run/crio/crio.sock"):
            return "cri-o"
        else:
            return "unknown"

    async def list_containers(self) -> List[Dict[str, Any]]:
        """List all containers on the node"""
        containers = []

        if self.runtime_type == "containerd":
            containers = await self._list_containerd_containers()
        elif self.runtime_type == "docker":
            containers = await self._list_docker_containers()

        return containers

    async def _list_containerd_containers(self) -> List[Dict[str, Any]]:
        """List containers using crictl"""
        try:
            result = subprocess.run(
                ["crictl", "ps", "-o", "json"],
                capture_output=True,
                text=True,
                timeout=30,
            )
            if result.returncode == 0:
                data = json.loads(result.stdout)
                containers = []
                for c in data.get("containers", []):
                    containers.append({
                        "container_id": c.get("id", "")[:12],
                        "name": c.get("metadata", {}).get("name", ""),
                        "image": c.get("image", {}).get("image", ""),
                        "status": c.get("state", "").lower(),
                        "created_at": c.get("createdAt", ""),
                        "labels": c.get("labels", {}),
                    })
                return containers
        except Exception as e:
            logger.error(f"Failed to list containerd containers: {e}")
        return []

    async def _list_docker_containers(self) -> List[Dict[str, Any]]:
        """List containers using docker CLI"""
        try:
            result = subprocess.run(
                ["docker", "ps", "--format", "json"],
                capture_output=True,
                text=True,
                timeout=30,
            )
            if result.returncode == 0:
                containers = []
                for line in result.stdout.strip().split("\n"):
                    if line:
                        c = json.loads(line)
                        containers.append({
                            "container_id": c.get("ID", "")[:12],
                            "name": c.get("Names", ""),
                            "image": c.get("Image", ""),
                            "status": "running" if "Up" in c.get("Status", "") else "stopped",
                            "created_at": c.get("CreatedAt", ""),
                            "labels": {},
                        })
                return containers
        except Exception as e:
            logger.error(f"Failed to list docker containers: {e}")
        return []

    async def get_container_image(self, container_id: str) -> Optional[str]:
        """Get the image name for a container"""
        if self.runtime_type == "containerd":
            try:
                result = subprocess.run(
                    ["crictl", "inspect", container_id],
                    capture_output=True,
                    text=True,
                    timeout=30,
                )
                if result.returncode == 0:
                    data = json.loads(result.stdout)
                    return data.get("info", {}).get("config", {}).get("image", {}).get("image", "")
            except Exception:
                pass
        return None


# =============================================================================
# Scanner
# =============================================================================

class VulnerabilityScanner:
    """Vulnerability scanner using Trivy"""

    def __init__(self, severity_threshold: str = "high"):
        self.severity_threshold = severity_threshold
        self.trivy_available = self._check_trivy()

    def _check_trivy(self) -> bool:
        """Check if Trivy is available"""
        try:
            result = subprocess.run(
                ["trivy", "--version"],
                capture_output=True,
                timeout=10,
            )
            return result.returncode == 0
        except Exception:
            return False

    async def scan_image(self, image: str) -> Dict[str, Any]:
        """Scan a container image for vulnerabilities"""
        if not self.trivy_available:
            logger.warning("Trivy not available, skipping scan")
            return {"error": "Trivy not available"}

        try:
            result = subprocess.run(
                [
                    "trivy", "image",
                    "--format", "json",
                    "--severity", "CRITICAL,HIGH,MEDIUM,LOW",
                    "--quiet",
                    image,
                ],
                capture_output=True,
                text=True,
                timeout=300,  # 5 minutes
            )

            if result.returncode == 0:
                data = json.loads(result.stdout)
                return self._parse_trivy_results(data)
            else:
                logger.error(f"Trivy scan failed: {result.stderr}")
                return {"error": result.stderr}

        except subprocess.TimeoutExpired:
            logger.error(f"Trivy scan timed out for {image}")
            return {"error": "Scan timed out"}
        except Exception as e:
            logger.error(f"Trivy scan error: {e}")
            return {"error": str(e)}

    def _parse_trivy_results(self, data: Dict) -> Dict[str, Any]:
        """Parse Trivy JSON output"""
        vulnerabilities = []
        summary = {"critical": 0, "high": 0, "medium": 0, "low": 0}

        for result in data.get("Results", []):
            for vuln in result.get("Vulnerabilities", []):
                severity = vuln.get("Severity", "UNKNOWN").lower()
                if severity in summary:
                    summary[severity] += 1

                vulnerabilities.append({
                    "id": vuln.get("VulnerabilityID", ""),
                    "package": vuln.get("PkgName", ""),
                    "version": vuln.get("InstalledVersion", ""),
                    "fixed_version": vuln.get("FixedVersion", ""),
                    "severity": severity,
                    "title": vuln.get("Title", ""),
                    "description": vuln.get("Description", ""),
                    "cvss_score": vuln.get("CVSS", {}).get("nvd", {}).get("V3Score"),
                    "references": vuln.get("References", [])[:5],
                })

        return {
            "summary": summary,
            "total": len(vulnerabilities),
            "vulnerabilities": vulnerabilities,
        }

    async def generate_sbom(self, image: str) -> Dict[str, Any]:
        """Generate SBOM for a container image"""
        if not self.trivy_available:
            return {"error": "Trivy not available"}

        try:
            result = subprocess.run(
                [
                    "trivy", "image",
                    "--format", "cyclonedx",
                    "--quiet",
                    image,
                ],
                capture_output=True,
                text=True,
                timeout=300,
            )

            if result.returncode == 0:
                return json.loads(result.stdout)
            else:
                return {"error": result.stderr}

        except Exception as e:
            logger.error(f"SBOM generation error: {e}")
            return {"error": str(e)}


# =============================================================================
# Resource Monitor
# =============================================================================

class ResourceMonitor:
    """Monitor system resources"""

    @staticmethod
    def get_metrics() -> Dict[str, Any]:
        """Get current resource metrics"""
        return {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage("/").percent,
            "load_average": os.getloadavg()[0] if hasattr(os, "getloadavg") else 0,
        }


# =============================================================================
# Main Agent
# =============================================================================

class OptimalAgent:
    """Main agent orchestrator"""

    def __init__(self, config: AgentConfig):
        self.config = config
        self.client = PlatformClient(config)
        self.runtime = ContainerRuntime()
        self.scanner = VulnerabilityScanner(config.severity_threshold)
        self.monitor = ResourceMonitor()
        self._running = False
        self._scanned_images: set = set()

    async def start(self):
        """Start the agent"""
        logger.info(f"Starting Optimal Agent: {self.config.agent_id}")
        logger.info(f"Environment: {self.config.environment}")
        logger.info(f"Node: {self.config.node_name}")
        logger.info(f"Runtime: {self.runtime.runtime_type}")

        # Validate API key and get tenant info
        try:
            await self.client.validate_and_get_tenant()
            logger.info("API key validated successfully")
        except Exception as e:
            logger.error(f"API key validation failed: {e}")
            return

        # Register agent
        try:
            await self.client.register_agent()
        except Exception as e:
            logger.error(f"Agent registration failed: {e}")
            # Continue anyway - might be already registered

        self._running = True

        # Start background tasks
        tasks = [
            asyncio.create_task(self._heartbeat_loop()),
            asyncio.create_task(self._container_monitor_loop()),
        ]

        if self.config.vuln_scanning:
            tasks.append(asyncio.create_task(self._scan_loop()))

        # Initial scan if configured
        if self.config.scan_on_start and self.config.vuln_scanning:
            asyncio.create_task(self._scan_all_containers())

        # Wait for tasks
        try:
            await asyncio.gather(*tasks)
        except asyncio.CancelledError:
            logger.info("Agent stopping...")
        finally:
            await self.client.close()

    async def stop(self):
        """Stop the agent"""
        self._running = False

    async def _heartbeat_loop(self):
        """Send periodic heartbeats"""
        while self._running:
            try:
                metrics = self.monitor.get_metrics()
                containers = await self.runtime.list_containers()
                metrics["containers_monitored"] = len(containers)

                await self.client.send_heartbeat("healthy", metrics)
                logger.debug("Heartbeat sent")
            except Exception as e:
                logger.error(f"Heartbeat failed: {e}")

            await asyncio.sleep(self.config.heartbeat_interval)

    async def _container_monitor_loop(self):
        """Monitor containers and send inventory"""
        while self._running:
            try:
                containers = await self.runtime.list_containers()
                await self.client.send_containers(containers)
                logger.debug(f"Container inventory sent: {len(containers)} containers")
            except Exception as e:
                logger.error(f"Container monitoring failed: {e}")

            await asyncio.sleep(60)  # Every minute

    async def _scan_loop(self):
        """Periodic vulnerability scanning"""
        while self._running:
            await asyncio.sleep(self.config.scan_interval)
            await self._scan_all_containers()

    async def _scan_all_containers(self):
        """Scan all containers on the node"""
        logger.info("Starting vulnerability scan of all containers")

        containers = await self.runtime.list_containers()
        images_to_scan = set()

        for container in containers:
            image = container.get("image", "")
            if image and image not in self._scanned_images:
                images_to_scan.add(image)

        for image in images_to_scan:
            try:
                logger.info(f"Scanning image: {image}")

                # Vulnerability scan
                results = await self.scanner.scan_image(image)
                if "error" not in results:
                    await self.client.send_scan_results("vulnerability", image, results)
                    self._scanned_images.add(image)

                # SBOM generation
                if self.config.sbom_generation:
                    sbom = await self.scanner.generate_sbom(image)
                    if "error" not in sbom:
                        await self.client.send_scan_results("sbom", image, sbom)

            except Exception as e:
                logger.error(f"Error scanning {image}: {e}")

        logger.info(f"Scan complete. Scanned {len(images_to_scan)} new images")


# =============================================================================
# Health Server
# =============================================================================

async def health_server(agent: OptimalAgent):
    """Simple HTTP server for health checks"""
    from aiohttp import web

    async def health_handler(request):
        return web.json_response({"status": "healthy"})

    async def ready_handler(request):
        return web.json_response({"status": "ready"})

    async def metrics_handler(request):
        metrics = ResourceMonitor.get_metrics()
        return web.json_response(metrics)

    app = web.Application()
    app.router.add_get("/health", health_handler)
    app.router.add_get("/ready", ready_handler)
    app.router.add_get("/metrics", metrics_handler)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", 8080)
    await site.start()
    logger.info("Health server started on port 8080")


# =============================================================================
# Main
# =============================================================================

async def main():
    config = AgentConfig.from_env()

    if not config.api_url or not config.api_key:
        logger.error("OPTIMAL_API_URL and OPTIMAL_API_KEY are required")
        sys.exit(1)

    agent = OptimalAgent(config)

    # Start health server
    await health_server(agent)

    # Run agent
    await agent.start()


if __name__ == "__main__":
    asyncio.run(main())
