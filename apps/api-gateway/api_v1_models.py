"""
Pydantic models for API v1 endpoints
Provides consistent, typed response shapes for all v1 routes
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


# ============================================================================
# Enums
# ============================================================================

class SeverityLevel(str, Enum):
    """Vulnerability severity levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class EnvironmentStatus(str, Enum):
    """Environment health status"""
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    UNKNOWN = "unknown"


class AgentStatus(str, Enum):
    """Agent operational status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"


class TaskType(str, Enum):
    """Agent task types"""
    TRIAGE_VULNERABILITIES = "triage_vulnerabilities"
    GENERATE_POAM = "generate_poam"
    ANALYZE_SBOM = "analyze_sbom"
    COMPLIANCE_CHECK = "compliance_check"


class TaskStatus(str, Enum):
    """Agent task execution status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


# ============================================================================
# Health
# ============================================================================

class HealthResponse(BaseModel):
    """API health check response"""
    status: str = Field(..., description="Service health status")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str = Field(default="1.0.0")
    services: Dict[str, str] = Field(default_factory=dict, description="Dependent service statuses")


# ============================================================================
# Metrics (Aggregation Endpoint)
# ============================================================================

class VulnerabilityMetrics(BaseModel):
    """Aggregated vulnerability metrics"""
    critical: int = Field(0, ge=0)
    high: int = Field(0, ge=0)
    medium: int = Field(0, ge=0)
    low: int = Field(0, ge=0)
    info: int = Field(0, ge=0)
    total: int = Field(0, ge=0)


class AgentMetrics(BaseModel):
    """Aggregated agent metrics"""
    total: int = Field(0, ge=0)
    active: int = Field(0, ge=0)
    inactive: int = Field(0, ge=0)
    error: int = Field(0, ge=0)


class SbomMetrics(BaseModel):
    """Aggregated SBOM metrics"""
    total: int = Field(0, ge=0, description="Total SBOM documents")
    components: int = Field(0, ge=0, description="Total components tracked")
    projects: int = Field(0, ge=0, description="Projects with SBOMs")


class ScanMetrics(BaseModel):
    """Aggregated scan metrics"""
    total: int = Field(0, ge=0)
    last_24h: int = Field(0, ge=0)
    last_scan: Optional[datetime] = None


class MetricsResponse(BaseModel):
    """Single aggregation endpoint for all platform metrics"""
    vulnerabilities: VulnerabilityMetrics
    agents: AgentMetrics
    sboms: SbomMetrics
    scans: ScanMetrics
    last_updated: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Environments
# ============================================================================

class Environment(BaseModel):
    """Environment representation"""
    id: str = Field(..., description="Unique environment identifier")
    name: str = Field(..., description="Environment name (e.g., production, staging)")
    project: str = Field(..., description="Associated project name")
    status: EnvironmentStatus
    version: Optional[str] = None
    last_deployed: Optional[datetime] = None
    vulnerability_count: VulnerabilityMetrics
    sbom_status: str = Field(default="pending", description="SBOM generation status")
    compliance_score: int = Field(default=0, ge=0, le=100)
    tags: List[str] = Field(default_factory=list)


class EnvironmentListResponse(BaseModel):
    """List of environments"""
    environments: List[Environment]
    total: int


class EnvironmentDetailResponse(BaseModel):
    """Detailed environment information"""
    environment: Environment
    containers: List[Dict[str, Any]] = Field(default_factory=list)
    recent_deployments: List[Dict[str, Any]] = Field(default_factory=list)
    active_alerts: List[Dict[str, Any]] = Field(default_factory=list)


# ============================================================================
# Vulnerabilities
# ============================================================================

class Vulnerability(BaseModel):
    """Vulnerability record"""
    id: str = Field(..., description="Unique vulnerability identifier")
    cve_id: Optional[str] = Field(None, description="CVE identifier if applicable")
    title: str
    description: str
    severity: SeverityLevel
    cvss_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    package_name: Optional[str] = None
    package_version: Optional[str] = None
    fixed_version: Optional[str] = None
    environment_id: Optional[str] = None
    discovered_at: datetime = Field(default_factory=datetime.utcnow)
    remediation: Optional[str] = None
    epss_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="EPSS probability")
    exploitable: bool = False
    status: str = Field(default="open")


class VulnerabilityListResponse(BaseModel):
    """List of vulnerabilities with optional filtering"""
    vulnerabilities: List[Vulnerability]
    total: int
    filtered_by: Optional[Dict[str, Any]] = None


# ============================================================================
# SBOM
# ============================================================================

class SbomComponent(BaseModel):
    """Software Bill of Materials component"""
    id: str
    name: str
    version: str
    type: str = Field(default="library", description="Component type (library, framework, application)")
    supplier: Optional[str] = None
    license: Optional[str] = None
    purl: Optional[str] = Field(None, description="Package URL")
    cpe: Optional[str] = Field(None, description="Common Platform Enumeration")
    environment_id: Optional[str] = None
    vulnerabilities: int = Field(0, ge=0, description="Count of known vulnerabilities")


class SbomListResponse(BaseModel):
    """List of SBOM components"""
    components: List[SbomComponent]
    total: int
    environment_id: Optional[str] = None
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# POA&M (Plan of Action & Milestones)
# ============================================================================

class PoamMilestone(BaseModel):
    """POA&M milestone"""
    description: str
    due_date: datetime
    completed: bool = False
    completed_date: Optional[datetime] = None


class PoamItem(BaseModel):
    """Plan of Action & Milestones item"""
    id: str
    weakness_name: str
    description: str
    severity: SeverityLevel
    impact: str
    recommendation: str
    resources_required: Optional[str] = None
    scheduled_completion: datetime
    milestones: List[PoamMilestone] = Field(default_factory=list)
    status: str = Field(default="open")
    environment_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PoamListResponse(BaseModel):
    """List of POA&M items"""
    items: List[PoamItem]
    total: int
    environment_id: Optional[str] = None


# ============================================================================
# Agent Runs
# ============================================================================

class AgentRunRequest(BaseModel):
    """Request to run an agent task"""
    task_type: TaskType
    parameters: Dict[str, Any] = Field(default_factory=dict)
    environment_id: Optional[str] = None


class AgentRunResponse(BaseModel):
    """Response for agent run creation"""
    run_id: str
    task_type: TaskType
    status: TaskStatus
    created_at: datetime = Field(default_factory=datetime.utcnow)
    estimated_completion: Optional[datetime] = None


class AgentRunDetail(BaseModel):
    """Detailed agent run status"""
    run_id: str
    task_type: TaskType
    status: TaskStatus
    parameters: Dict[str, Any]
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    progress_percent: int = Field(0, ge=0, le=100)

