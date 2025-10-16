"""
Agent Manager - Coordinates all security monitoring components
"""

import asyncio
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
import structlog

from models.scan_results import ScanResult, ContainerInfo
from models.agent_config import AgentConfig

logger = structlog.get_logger(__name__)

class AgentManager:
    """Manages all agent components and coordinates security monitoring"""
    
    def __init__(self, agent_id: str, config: AgentConfig, components: List[Any]):
        self.agent_id = agent_id
        self.config = config
        self.components = components
        self.running = False
        self.start_time = time.time()
        self.scan_results: List[ScanResult] = []
        self.containers: Dict[str, ContainerInfo] = {}
        
        # Task references
        self.tasks: List[asyncio.Task] = []
    
    async def start(self):
        """Start all agent components"""
        if self.running:
            return
        
        logger.info("Starting agent components")
        self.running = True
        
        # Start each component
        for component in self.components:
            if hasattr(component, 'start'):
                await component.start()
        
        # Start monitoring tasks
        self.tasks = [
            asyncio.create_task(self._monitoring_loop()),
            asyncio.create_task(self._heartbeat_loop()),
            asyncio.create_task(self._scan_scheduler()),
        ]
        
        logger.info("Agent started successfully")
    
    async def stop(self):
        """Stop all agent components"""
        if not self.running:
            return
        
        logger.info("Stopping agent components")
        self.running = False
        
        # Cancel all tasks
        for task in self.tasks:
            task.cancel()
        
        # Stop components
        for component in self.components:
            if hasattr(component, 'stop'):
                await component.stop()
        
        logger.info("Agent stopped")
    
    async def _monitoring_loop(self):
        """Main monitoring loop"""
        while self.running:
            try:
                # Update container information
                await self._update_containers()
                
                # Check for new containers
                await self._check_new_containers()
                
                # Process any pending scans
                await self._process_pending_scans()
                
                await asyncio.sleep(self.config.scanning.interval_seconds)
                
            except Exception as e:
                logger.error("Error in monitoring loop", error=str(e))
                await asyncio.sleep(30)
    
    async def _heartbeat_loop(self):
        """Send heartbeat to Optimal platform"""
        while self.running:
            try:
                # Send heartbeat with current status
                status = await self.get_status()
                # TODO: Send to API client
                
                await asyncio.sleep(self.config.api_gateway.heartbeat_interval)
                
            except Exception as e:
                logger.error("Error in heartbeat loop", error=str(e))
                await asyncio.sleep(60)
    
    async def _scan_scheduler(self):
        """Schedule and run security scans"""
        while self.running:
            try:
                # Run scheduled scans for all containers
                for container_id, container in self.containers.items():
                    if self._should_scan_container(container_id):
                        await self.scan_container(container_id, "scheduled")
                
                await asyncio.sleep(self.config.scanning.interval_seconds)
                
            except Exception as e:
                logger.error("Error in scan scheduler", error=str(e))
                await asyncio.sleep(60)
    
    async def _update_containers(self):
        """Update container information from container monitor"""
        try:
            if hasattr(self.container_monitor, 'get_containers'):
                containers = await self.container_monitor.get_containers()
                self.containers = {c.container_id: c for c in containers}
        except Exception as e:
            logger.error("Error updating containers", error=str(e))
    
    async def _check_new_containers(self):
        """Check for new containers and trigger initial scans"""
        # This would compare with previous container list
        # For now, just log
        pass
    
    async def _process_pending_scans(self):
        """Process any pending or failed scans"""
        # This would handle retry logic
        pass
    
    def _should_scan_container(self, container_id: str) -> bool:
        """Check if container should be scanned now"""
        # This would check last scan time and intervals
        return True
    
    async def scan_container(self, container_id: str, scan_type: str = "full") -> ScanResult:
        """Scan a specific container"""
        logger.info("Starting container scan", container_id=container_id, scan_type=scan_type)
        
        container = self.containers.get(container_id)
        if not container:
            raise ValueError(f"Container {container_id} not found")
        
        # Create scan result
        scan_result = ScanResult(
            scan_id=f"{self.agent_id}_{container_id}_{int(time.time())}",
            timestamp=datetime.utcnow(),
            agent_id=self.agent_id,
            container_id=container_id,
            image=container.image,
            scan_type=scan_type,
            status="running",
            findings=[],
            metadata={}
        )
        
        try:
            # Run scans based on type
            if scan_type in ["full", "vulnerability"]:
                vuln_findings = await self.vulnerability_scanner.scan_container(container)
                scan_result.findings.extend(vuln_findings)
            
            if scan_type in ["full", "compliance"]:
                compliance_findings = await self.compliance_checker.check_container(container)
                scan_result.findings.extend(compliance_findings)
            
            if scan_type in ["full", "network"]:
                network_findings = await self.network_monitor.analyze_container(container)
                scan_result.findings.extend(network_findings)
            
            scan_result.status = "completed"
            scan_result.metadata = {
                "scan_duration": (datetime.utcnow() - scan_result.timestamp).total_seconds(),
                "findings_count": len(scan_result.findings)
            }
            
            # Store result
            self.scan_results.append(scan_result)
            
            logger.info("Container scan completed", 
                       container_id=container_id, 
                       findings_count=len(scan_result.findings))
            
            return scan_result
            
        except Exception as e:
            logger.error("Container scan failed", 
                        container_id=container_id, 
                        error=str(e))
            scan_result.status = "failed"
            scan_result.metadata = {"error": str(e)}
            return scan_result
    
    async def get_status(self) -> Dict[str, Any]:
        """Get current agent status"""
        return {
            "agent_id": self.agent_id,
            "status": "running" if self.running else "stopped",
            "uptime": time.time() - self.start_time,
            "containers_monitored": len(self.containers),
            "scans_completed": len([r for r in self.scan_results if r.status == "completed"]),
            "scans_failed": len([r for r in self.scan_results if r.status == "failed"]),
            "last_scan": self.scan_results[-1].timestamp.isoformat() if self.scan_results else None
        }
    
    async def get_metrics(self) -> Dict[str, Any]:
        """Get Prometheus-style metrics"""
        return {
            "agent_uptime_seconds": time.time() - self.start_time,
            "containers_monitored_total": len(self.containers),
            "scans_completed_total": len([r for r in self.scan_results if r.status == "completed"]),
            "scans_failed_total": len([r for r in self.scan_results if r.status == "failed"]),
            "findings_total": sum(len(r.findings) for r in self.scan_results),
            "critical_findings_total": sum(
                len([f for f in r.findings if f.get("severity") == "critical"]) 
                for r in self.scan_results
            )
        }
