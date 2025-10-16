#!/usr/bin/env python3
"""
Optimal Runtime Security Agent
Provides real-time security monitoring for production Kubernetes clusters
"""

import asyncio
import logging
import os
import signal
import sys
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import structlog

# Import AI Security Engine
from ai_security_engine import AISecurityEngine, ThreatType, Severity

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)

class RuntimeSecurityAgent:
    """Main runtime security agent class"""
    
    def __init__(self):
        self.agent_id = f"runtime-agent-{os.getenv('HOSTNAME', 'unknown')}"
        self.start_time = time.time()
        
        # FastAPI app
        self.app = FastAPI(
            title="Optimal Runtime Security Agent",
            description="Real-time security monitoring for production clusters with AI red teaming",
            version="1.0.0"
        )
        
        # Add CORS middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Initialize AI Security Engine
        self.ai_security_engine = AISecurityEngine()
        self.ai_models_discovered = []
        self.ai_security_tests = []
        self.ai_threat_model = {}
        
        self.setup_routes()
        logger.info("Runtime Security Agent initialized with AI red teaming capabilities", agent_id=self.agent_id)
    
    def setup_routes(self):
        """Setup FastAPI routes"""
        
        @self.app.get("/health")
        async def health_check():
            """Health check endpoint"""
            return {
                "status": "healthy",
                "agent_id": self.agent_id,
                "uptime": time.time() - self.start_time,
                "timestamp": datetime.utcnow().isoformat(),
                "version": "1.0.0"
            }
        
        @self.app.get("/status")
        async def get_status():
            """Get agent status"""
            return {
                "agent_id": self.agent_id,
                "status": "running",
                "uptime": time.time() - self.start_time,
                "timestamp": datetime.utcnow().isoformat(),
                "capabilities": [
                    "container_monitoring",
                    "vulnerability_scanning", 
                    "compliance_checking",
                    "network_monitoring",
                    "real_time_alerts",
                    "ai_red_teaming",
                    "ai_threat_modeling",
                    "ai_security_testing"
                ]
            }
        
        @self.app.get("/containers")
        async def get_containers():
            """Get monitored containers"""
            # Mock data for now
            return {
                "containers": [
                    {
                        "id": "container-1",
                        "name": "nginx",
                        "image": "nginx:latest",
                        "status": "running",
                        "risk_score": 3.2
                    },
                    {
                        "id": "container-2", 
                        "name": "redis",
                        "image": "redis:7-alpine",
                        "status": "running",
                        "risk_score": 1.8
                    }
                ]
            }
        
        @self.app.post("/scan/{container_id}")
        async def trigger_scan(container_id: str, scan_type: str = "full"):
            """Trigger manual scan for container"""
            # Mock scan result
            return {
                "status": "success", 
                "scan_id": f"scan-{container_id}-{int(time.time())}",
                "container_id": container_id,
                "scan_type": scan_type,
                "timestamp": datetime.utcnow().isoformat()
            }
        
        @self.app.get("/metrics")
        async def get_metrics():
            """Get Prometheus metrics"""
            return {
                "containers_monitored": 2,
                "vulnerabilities_found": 5,
                "compliance_issues": 1,
                "network_connections": 12,
                "ai_models_discovered": len(self.ai_models_discovered),
                "ai_security_tests_conducted": len(self.ai_security_tests),
                "uptime_seconds": time.time() - self.start_time
            }
        
        # AI Security Endpoints
        @self.app.get("/ai/models")
        async def get_ai_models():
            """Get discovered AI/ML models"""
            return {
                "success": True,
                "count": len(self.ai_models_discovered),
                "models": [
                    {
                        "model_id": model.model_id,
                        "model_name": model.model_name,
                        "model_type": model.model_type,
                        "framework": model.framework,
                        "capabilities": model.capabilities,
                        "security_controls": model.security_controls,
                        "endpoint": model.endpoint
                    }
                    for model in self.ai_models_discovered
                ]
            }
        
        @self.app.post("/ai/discover")
        async def discover_ai_models():
            """Discover AI/ML models in the cluster"""
            try:
                # Mock container data - in real implementation, this would come from Kubernetes API
                mock_containers = [
                    {
                        "id": "container-001",
                        "name": "optimal-platform-ai",
                        "image": "optimal-platform/ai-model:latest",
                        "labels": {"app": "ai", "model": "gpt", "framework": "huggingface"}
                    },
                    {
                        "id": "container-002", 
                        "name": "optimal-platform-classifier",
                        "image": "optimal-platform/classifier:latest",
                        "labels": {"app": "ai", "model": "bert", "framework": "tensorflow"}
                    }
                ]
                
                # Discover AI models
                discovered_models = await self.ai_security_engine.discover_ai_models(mock_containers)
                self.ai_models_discovered = discovered_models
                
                logger.info("AI models discovered", count=len(discovered_models))
                
                return {
                    "success": True,
                    "message": f"Discovered {len(discovered_models)} AI/ML models",
                    "models": [
                        {
                            "model_id": model.model_id,
                            "model_name": model.model_name,
                            "model_type": model.model_type,
                            "framework": model.framework,
                            "capabilities": model.capabilities
                        }
                        for model in discovered_models
                    ]
                }
            except Exception as e:
                logger.error("Error discovering AI models", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/ai/red-team")
        async def conduct_red_team_tests():
            """Conduct AI red team security tests"""
            try:
                if not self.ai_models_discovered:
                    return {
                        "success": False,
                        "message": "No AI models discovered. Run /ai/discover first."
                    }
                
                # Conduct red team tests
                test_results = await self.ai_security_engine.conduct_red_team_tests(self.ai_models_discovered)
                self.ai_security_tests = test_results
                
                # Generate threat model
                threat_model = await self.ai_security_engine.generate_threat_model(self.ai_models_discovered)
                self.ai_threat_model = threat_model
                
                logger.info("AI red team tests completed", tests=len(test_results))
                
                return {
                    "success": True,
                    "message": f"Conducted {len(test_results)} AI security tests",
                    "test_results": [
                        {
                            "test_id": test.test_id,
                            "threat_type": test.threat_type.value,
                            "severity": test.severity.value,
                            "description": test.description,
                            "success": test.success,
                            "timestamp": test.timestamp.isoformat() if test.timestamp else None
                        }
                        for test in test_results
                    ],
                    "threat_model": threat_model
                }
            except Exception as e:
                logger.error("Error conducting AI red team tests", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/ai/security-summary")
        async def get_ai_security_summary():
            """Get AI security summary"""
            try:
                summary = self.ai_security_engine.get_security_summary()
                return {
                    "success": True,
                    "summary": summary
                }
            except Exception as e:
                logger.error("Error getting AI security summary", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/ai/threat-model")
        async def get_threat_model():
            """Get AI threat model"""
            try:
                if not self.ai_threat_model:
                    return {
                        "success": False,
                        "message": "No threat model available. Run /ai/red-team first."
                    }
                
                return {
                    "success": True,
                    "threat_model": self.ai_threat_model
                }
            except Exception as e:
                logger.error("Error getting threat model", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/ai/test-results")
        async def get_test_results():
            """Get AI security test results"""
            try:
                return {
                    "success": True,
                    "count": len(self.ai_security_tests),
                    "test_results": [
                        {
                            "test_id": test.test_id,
                            "threat_type": test.threat_type.value,
                            "severity": test.severity.value,
                            "description": test.description,
                            "payload": test.payload,
                            "expected_behavior": test.expected_behavior,
                            "actual_behavior": test.actual_behavior,
                            "success": test.success,
                            "timestamp": test.timestamp.isoformat() if test.timestamp else None,
                            "metadata": test.metadata
                        }
                        for test in self.ai_security_tests
                    ]
                }
            except Exception as e:
                logger.error("Error getting test results", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))
    
    async def start(self):
        """Start the agent"""
        logger.info("Starting Runtime Security Agent")
        
        # Start FastAPI server
        config = uvicorn.Config(
            app=self.app,
            host="0.0.0.0",
            port=8080,
            log_level="info"
        )
        server = uvicorn.Server(config)
        await server.serve()

async def main():
    """Main entry point"""
    agent = RuntimeSecurityAgent()
    
    # Setup signal handlers
    def signal_handler(signum, frame):
        logger.info("Received shutdown signal", signal=signum)
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        await agent.start()
    except Exception as e:
        logger.error("Agent failed to start", error=str(e))
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())