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
    # AI Security task types
    AI_MODEL_ASSESSMENT = "ai_model_assessment"
    AI_MODEL_DISCOVERY = "ai_model_discovery"
    AI_RED_TEAM = "ai_red_team"


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


# ============================================================================
# AI Security Models
# ============================================================================

class AIModelSource(str, Enum):
    """AI Model source types"""
    HUGGINGFACE = "huggingface"
    LOCAL = "local"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    OLLAMA = "ollama"
    AZURE = "azure"
    AWS = "aws"


class AIRiskLevel(str, Enum):
    """AI Model risk assessment levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    UNKNOWN = "unknown"


class AssessmentStatus(str, Enum):
    """AI Assessment status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class AISVSCategory(str, Enum):
    """OWASP AISVS control categories"""
    DATA_SECURITY = "data_security"
    MODEL_SECURITY = "model_security"
    INPUT_VALIDATION = "input_validation"
    OUTPUT_SECURITY = "output_security"
    ACCESS_CONTROL = "access_control"
    MODEL_EXPLAINABILITY = "model_explainability"
    PRIVACY_PROTECTION = "privacy_protection"
    ADVERSARIAL_ROBUSTNESS = "adversarial_robustness"
    MONITORING_LOGGING = "monitoring_logging"
    COMPLIANCE_GOVERNANCE = "compliance_governance"


class NISTAIRMFPillar(str, Enum):
    """NIST AI RMF pillars"""
    GOVERN = "govern"
    MAP = "map"
    MEASURE = "measure"
    MANAGE = "manage"


class ATLASThreatCategory(str, Enum):
    """MITRE ATLAS threat categories"""
    RECONNAISSANCE = "reconnaissance"
    RESOURCE_DEVELOPMENT = "resource_development"
    INITIAL_ACCESS = "initial_access"
    ML_ATTACK_STAGING = "ml_attack_staging"
    MODEL_ACCESS = "model_access"
    EXFILTRATION = "exfiltration"
    IMPACT = "impact"


class RedTeamTestType(str, Enum):
    """Red team test types"""
    PROMPT_INJECTION = "prompt_injection"
    JAILBREAK = "jailbreak"
    ADVERSARIAL = "adversarial"
    PRIVACY_LEAKAGE = "privacy_leakage"
    MODEL_EXTRACTION = "model_extraction"
    BIAS_DETECTION = "bias_detection"
    HALLUCINATION = "hallucination"


class AIModel(BaseModel):
    """AI Model representation"""
    id: str = Field(..., description="Unique model identifier")
    name: str = Field(..., description="Model name")
    source: AIModelSource
    model_type: str = Field(default="unknown", description="Model type (text-generation, classification, etc.)")
    version: str = Field(default="1.0")
    framework: str = Field(default="unknown")
    endpoint: Optional[str] = Field(None, description="API endpoint URL")
    huggingface_id: Optional[str] = Field(None, description="HuggingFace model ID")
    author: Optional[str] = None
    license: Optional[str] = None
    downloads: Optional[int] = Field(None, ge=0)
    tags: List[str] = Field(default_factory=list)
    overall_score: int = Field(default=0, ge=0, le=100)
    risk_level: AIRiskLevel = Field(default=AIRiskLevel.UNKNOWN)
    last_assessed: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AIModelListResponse(BaseModel):
    """List of AI models"""
    models: List[AIModel]
    total: int
    page: int = Field(default=1)
    page_size: int = Field(default=20)


class AISVSScore(BaseModel):
    """OWASP AISVS score for a category"""
    category: AISVSCategory
    category_name: str
    score: int = Field(..., ge=0, le=10)
    max_score: int = Field(default=10)
    percentage: int = Field(..., ge=0, le=100)
    status: str = Field(default="unknown")
    details: str
    controls_met: List[str] = Field(default_factory=list)
    controls_failed: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)


class NISTSubcategory(BaseModel):
    """NIST AI RMF subcategory"""
    id: str
    name: str
    description: str
    score: int = Field(..., ge=0, le=100)
    status: str = Field(default="not_implemented")


class NISTAIRMFScore(BaseModel):
    """NIST AI RMF pillar score"""
    pillar: NISTAIRMFPillar
    pillar_name: str
    score: int = Field(..., ge=0, le=100)
    status: str = Field(default="unknown")
    details: str
    subcategories: List[NISTSubcategory] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)


class ATLASThreat(BaseModel):
    """MITRE ATLAS threat"""
    threat_id: str = Field(..., description="ATLAS threat ID (e.g., AML.T0001)")
    threat_name: str
    category: ATLASThreatCategory
    description: str
    mitigated: bool = False
    severity: SeverityLevel
    mitigation_notes: Optional[str] = None


class RedTeamTest(BaseModel):
    """Red team test result"""
    id: str
    test_type: RedTeamTestType
    test_name: str
    description: str
    payload: str
    expected_behavior: str
    actual_behavior: Optional[str] = None
    passed: bool
    severity: SeverityLevel
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    duration: Optional[int] = Field(None, description="Duration in milliseconds")
    notes: Optional[str] = None


class RedTeamConfig(BaseModel):
    """Red team testing configuration"""
    enabled: bool = False
    test_categories: List[RedTeamTestType] = Field(default_factory=list)
    max_tests_per_category: int = Field(default=5, ge=1, le=20)
    timeout: int = Field(default=30, ge=5, le=120)


class AssessmentConfig(BaseModel):
    """AI Assessment configuration"""
    include_aisvs: bool = True
    include_nist_rmf: bool = True
    include_atlas: bool = True
    include_red_team: bool = False
    red_team_config: Optional[RedTeamConfig] = None
    custom_endpoint: Optional[str] = None
    timeout: Optional[int] = None


class AssessmentFinding(BaseModel):
    """Assessment finding"""
    id: str
    type: str = Field(..., description="vulnerability, misconfiguration, compliance_gap, risk")
    severity: SeverityLevel
    title: str
    description: str
    framework: str = Field(..., description="AISVS, NIST_AI_RMF, ATLAS, RED_TEAM")
    category: Optional[str] = None
    remediation: str
    references: List[str] = Field(default_factory=list)
    status: str = Field(default="open")


class AIAssessmentRequest(BaseModel):
    """Request to create an AI assessment"""
    model_id: str
    model_source: Optional[AIModelSource] = None
    model_name: Optional[str] = None
    endpoint: Optional[str] = None
    config: AssessmentConfig = Field(default_factory=AssessmentConfig)


class AIAssessmentResult(BaseModel):
    """AI Assessment result"""
    assessment_id: str
    model_id: str
    model_name: str
    model_source: Optional[AIModelSource] = None
    status: AssessmentStatus
    progress: int = Field(0, ge=0, le=100)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    duration: Optional[int] = Field(None, description="Duration in milliseconds")
    overall_score: int = Field(0, ge=0, le=100)
    risk_level: AIRiskLevel
    aisvs_scores: List[AISVSScore] = Field(default_factory=list)
    nist_scores: List[NISTAIRMFScore] = Field(default_factory=list)
    atlas_threats: List[ATLASThreat] = Field(default_factory=list)
    red_team_results: Optional[List[RedTeamTest]] = None
    recommendations: List[str] = Field(default_factory=list)
    findings: List[AssessmentFinding] = Field(default_factory=list)


class AIAssessmentListResponse(BaseModel):
    """List of AI assessments"""
    assessments: List[AIAssessmentResult]
    total: int
    page: int = Field(default=1)
    page_size: int = Field(default=20)


class ModelDiscoveryRequest(BaseModel):
    """Request to discover AI models"""
    source: AIModelSource
    query: Optional[str] = None
    organization: Optional[str] = None
    local_endpoints: Optional[List[str]] = None
    filters: Optional[Dict[str, Any]] = None


class ModelDiscoveryResponse(BaseModel):
    """AI model discovery results"""
    source: AIModelSource
    models: List[AIModel]
    total: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class HuggingFaceModelInfo(BaseModel):
    """HuggingFace model information"""
    model_id: str
    author: str
    sha: Optional[str] = None
    last_modified: Optional[datetime] = None
    private: bool = False
    downloads: int = Field(0, ge=0)
    likes: int = Field(0, ge=0)
    tags: List[str] = Field(default_factory=list)
    pipeline_tag: Optional[str] = None
    library: Optional[str] = None
    license: Optional[str] = None
    model_card: Optional[str] = None
    security_scan: Optional[Dict[str, Any]] = None


