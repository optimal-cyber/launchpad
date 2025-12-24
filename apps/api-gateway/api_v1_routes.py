"""
API v1 Routes - Clean, versioned REST API
All endpoints return consistent Pydantic models with deterministic seeded data
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime, timedelta
import uuid
import random
from api_v1_models import *

# Create v1 router
router = APIRouter(prefix="/api/v1", tags=["v1"])

# ============================================================================
# SEEDED DEMO DATA
# Deterministic data that matches UI expectations
# ============================================================================

# Generate seeded vulnerabilities (deterministic based on index)
def generate_vulnerabilities(count: int = 56, env_id: Optional[str] = None) -> List[Vulnerability]:
    """Generate deterministic vulnerability data"""
    severities = [SeverityLevel.CRITICAL] * 7 + [SeverityLevel.HIGH] * 18 + \
                 [SeverityLevel.MEDIUM] * 24 + [SeverityLevel.LOW] * 7
    
    cves = [
        ("CVE-2024-3094", "xz-utils backdoor", 9.8, "xz-utils", "5.6.0", "5.6.1"),
        ("CVE-2024-21626", "runc container escape", 9.0, "runc", "1.1.4", "1.1.12"),
        ("CVE-2023-44487", "HTTP/2 Rapid Reset", 7.5, "golang.org/x/net", "0.7.0", "0.17.0"),
        ("CVE-2023-38545", "curl SOCKS5 heap overflow", 7.5, "curl", "8.3.0", "8.4.0"),
        ("CVE-2023-4863", "libwebp heap overflow", 8.8, "libwebp", "1.2.4", "1.3.2"),
        ("CVE-2024-1086", "netfilter nft_fwd_dup privilege escalation", 7.8, "kernel", "6.5.0", "6.6.14"),
        ("CVE-2023-5678", "OpenSSL memory corruption", 7.5, "openssl", "3.0.10", "3.0.12"),
    ]
    
    vulns = []
    for i in range(min(count, len(severities))):
        cve_data = cves[i % len(cves)]
        vuln = Vulnerability(
            id=f"vuln-{i+1}",
            cve_id=cve_data[0],
            title=cve_data[1],
            description=f"Security vulnerability in {cve_data[3]}. {cve_data[1]}",
            severity=severities[i],
            cvss_score=cve_data[2],
            package_name=cve_data[3],
            package_version=cve_data[4],
            fixed_version=cve_data[5],
            environment_id=env_id,
            discovered_at=datetime.utcnow() - timedelta(days=i % 30),
            remediation=f"Upgrade {cve_data[3]} to version {cve_data[5]} or later",
            epss_score=round(0.95 - (i * 0.01), 2) if i < 20 else round(0.1 + (i * 0.01), 2),
            exploitable=i < 15,
            status="open" if i < 50 else "mitigated"
        )
        vulns.append(vuln)
    
    return vulns


# Generate seeded environments
def generate_environments() -> List[Environment]:
    """Generate deterministic environment data"""
    return [
        Environment(
            id="env-prod-1",
            name="Production",
            project="flask-container-test",
            status=EnvironmentStatus.WARNING,
            version="v2.3.1",
            last_deployed=datetime.utcnow() - timedelta(days=11),
            vulnerability_count=VulnerabilityMetrics(critical=2, high=8, medium=24, low=42, total=76),
            sbom_status="complete",
            compliance_score=87,
            tags=["production", "critical", "monitored"]
        ),
        Environment(
            id="env-staging-1",
            name="Staging",
            project="api-gateway-service",
            status=EnvironmentStatus.HEALTHY,
            version="v1.8.0",
            last_deployed=datetime.utcnow() - timedelta(days=2),
            vulnerability_count=VulnerabilityMetrics(critical=0, high=3, medium=12, low=28, total=43),
            sbom_status="complete",
            compliance_score=94,
            tags=["staging", "pre-production"]
        ),
        Environment(
            id="env-dev-1",
            name="Development",
            project="auth-service",
            status=EnvironmentStatus.CRITICAL,
            version="v3.0.0-beta",
            last_deployed=datetime.utcnow() - timedelta(hours=2),
            vulnerability_count=VulnerabilityMetrics(critical=5, high=15, medium=32, low=18, total=70),
            sbom_status="pending",
            compliance_score=62,
            tags=["development", "testing"]
        ),
        Environment(
            id="env-prod-2",
            name="Production",
            project="user-management",
            status=EnvironmentStatus.HEALTHY,
            version="v4.1.2",
            last_deployed=datetime.utcnow() - timedelta(days=16),
            vulnerability_count=VulnerabilityMetrics(critical=0, high=1, medium=8, low=35, total=44),
            sbom_status="complete",
            compliance_score=96,
            tags=["production", "secure"]
        ),
    ]


# Generate seeded SBOM components
def generate_sbom_components(count: int = 29, env_id: Optional[str] = None) -> List[SbomComponent]:
    """Generate deterministic SBOM component data"""
    packages = [
        ("Flask", "2.3.3", "framework", "MIT", "Pallets"),
        ("requests", "2.31.0", "library", "Apache-2.0", "PSF"),
        ("numpy", "1.24.3", "library", "BSD-3-Clause", "NumPy Developers"),
        ("pandas", "2.0.3", "library", "BSD-3-Clause", "Pandas Development Team"),
        ("fastapi", "0.104.1", "framework", "MIT", "Sebastián Ramírez"),
        ("uvicorn", "0.24.0", "library", "BSD-3-Clause", "Encode"),
        ("pydantic", "2.4.2", "library", "MIT", "Samuel Colvin"),
        ("sqlalchemy", "2.0.21", "library", "MIT", "Mike Bayer"),
        ("redis", "5.0.0", "library", "MIT", "Redis Inc"),
        ("celery", "5.3.4", "library", "BSD-3-Clause", "Celery Project"),
    ]
    
    components = []
    for i in range(min(count, len(packages) * 3)):
        pkg = packages[i % len(packages)]
        component = SbomComponent(
            id=f"comp-{i+1}",
            name=pkg[0],
            version=pkg[1],
            type=pkg[2],
            license=pkg[3],
            supplier=pkg[4],
            purl=f"pkg:pypi/{pkg[0].lower()}@{pkg[1]}",
            environment_id=env_id,
            vulnerabilities=max(0, (7 - i) if i < 10 else 0)  # First 10 have vulns
        )
        components.append(component)
    
    return components


# Generate seeded POA&M items
def generate_poam_items(count: int = 12, env_id: Optional[str] = None) -> List[PoamItem]:
    """Generate deterministic POA&M data"""
    items = [
        ("CVE-2024-3094 (xz-utils backdoor)", SeverityLevel.CRITICAL,
         "Backdoor discovered in xz-utils 5.6.0-5.6.1 affecting SSH connections",
         "Potential remote code execution via compromised SSH daemon",
         "Immediate upgrade to xz-utils 5.6.2 or rollback to 5.4.x"),
        ("Outdated SSL/TLS certificates", SeverityLevel.HIGH,
         "Several services using certificates expiring within 30 days",
         "Service disruption and potential MITM attacks",
         "Implement automated certificate rotation with Let's Encrypt"),
        ("Missing WAF rules for API endpoints", SeverityLevel.HIGH,
         "Public API endpoints lack comprehensive WAF protection",
         "Increased exposure to common web attacks (SQLi, XSS, etc.)",
         "Deploy and configure AWS WAF with OWASP top 10 ruleset"),
    ]
    
    poam_list = []
    for i in range(min(count, len(items) * 4)):
        item_data = items[i % len(items)]
        poam = PoamItem(
            id=f"poam-{i+1}",
            weakness_name=item_data[0],
            severity=item_data[1],
            description=item_data[2],
            impact=item_data[3],
            recommendation=item_data[4],
            resources_required="Security team (2 engineers, 40 hours)" if i % 3 == 0 else "DevOps team (1 engineer, 8 hours)",
            scheduled_completion=datetime.utcnow() + timedelta(days=7 + (i * 3)),
            milestones=[
                PoamMilestone(
                    description="Initial assessment and risk analysis",
                    due_date=datetime.utcnow() + timedelta(days=1 + i),
                    completed=i < 3
                ),
                PoamMilestone(
                    description="Implement remediation",
                    due_date=datetime.utcnow() + timedelta(days=5 + (i * 2)),
                    completed=i < 2
                ),
                PoamMilestone(
                    description="Verification and testing",
                    due_date=datetime.utcnow() + timedelta(days=7 + (i * 3)),
                    completed=False
                ),
            ],
            status="in_progress" if i < 5 else "open",
            environment_id=env_id,
            created_at=datetime.utcnow() - timedelta(days=30 - i),
            updated_at=datetime.utcnow() - timedelta(days=max(0, 5 - i))
        )
        poam_list.append(poam)
    
    return poam_list[:count]


# In-memory storage for agent runs (in production, use database)
agent_runs_storage: Dict[str, AgentRunDetail] = {}


# ============================================================================
# API v1 ENDPOINTS
# ============================================================================

@router.get("/health", response_model=HealthResponse)
async def get_health():
    """
    Health check endpoint
    Returns service status and version information
    """
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        version="1.0.0",
        services={
            "database": "healthy",
            "gitlab": "healthy",
            "sbom-service": "healthy",
            "vuln-service": "healthy"
        }
    )


@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics():
    """
    Single aggregation endpoint for all platform metrics
    Used by Command Center, Hub, and other dashboards
    
    This is the primary endpoint for counts to prevent mismatches
    """
    # Generate all data
    vulnerabilities = generate_vulnerabilities()
    environments = generate_environments()
    sbom_components = generate_sbom_components()
    
    # Calculate vulnerability metrics
    vuln_metrics = VulnerabilityMetrics(
        critical=sum(1 for v in vulnerabilities if v.severity == SeverityLevel.CRITICAL),
        high=sum(1 for v in vulnerabilities if v.severity == SeverityLevel.HIGH),
        medium=sum(1 for v in vulnerabilities if v.severity == SeverityLevel.MEDIUM),
        low=sum(1 for v in vulnerabilities if v.severity == SeverityLevel.LOW),
        info=sum(1 for v in vulnerabilities if v.severity == SeverityLevel.INFO),
        total=len(vulnerabilities)
    )
    
    # Calculate agent metrics (deterministic)
    agent_metrics = AgentMetrics(
        total=3,
        active=2,
        inactive=1,
        error=0
    )
    
    # Calculate SBOM metrics
    sbom_metrics = SbomMetrics(
        total=len(environments),  # One SBOM per environment
        components=len(sbom_components),
        projects=len(set(e.project for e in environments))
    )
    
    # Calculate scan metrics
    scan_metrics = ScanMetrics(
        total=147,
        last_24h=12,
        last_scan=datetime.utcnow() - timedelta(minutes=23)
    )
    
    return MetricsResponse(
        vulnerabilities=vuln_metrics,
        agents=agent_metrics,
        sboms=sbom_metrics,
        scans=scan_metrics,
        last_updated=datetime.utcnow()
    )


@router.get("/environments", response_model=EnvironmentListResponse)
async def get_environments():
    """
    List all environments with their current status
    """
    environments = generate_environments()
    return EnvironmentListResponse(
        environments=environments,
        total=len(environments)
    )


@router.get("/environments/{env_id}", response_model=EnvironmentDetailResponse)
async def get_environment_detail(env_id: str):
    """
    Get detailed information about a specific environment
    """
    environments = generate_environments()
    env = next((e for e in environments if e.id == env_id), None)
    
    if not env:
        raise HTTPException(status_code=404, detail=f"Environment {env_id} not found")
    
    return EnvironmentDetailResponse(
        environment=env,
        containers=[
            {"name": "api-gateway", "status": "running", "image": "api-gateway:v2.3.1"},
            {"name": "frontend", "status": "running", "image": "frontend:v2.3.1"},
            {"name": "database", "status": "running", "image": "postgres:15-alpine"},
        ],
        recent_deployments=[
            {
                "id": "deploy-1",
                "version": env.version,
                "deployed_at": env.last_deployed.isoformat() if env.last_deployed else None,
                "deployed_by": "ryan.gutwein@optimal.io",
                "status": "success"
            }
        ],
        active_alerts=[
            {"id": "alert-1", "severity": "warning", "message": "High memory usage detected"}
        ] if env.status == EnvironmentStatus.WARNING else []
    )


@router.get("/vulnerabilities", response_model=VulnerabilityListResponse)
async def get_vulnerabilities(env_id: Optional[str] = Query(None, description="Filter by environment ID")):
    """
    Get list of vulnerabilities, optionally filtered by environment
    """
    vulnerabilities = generate_vulnerabilities(env_id=env_id)
    
    # Filter by environment if specified
    if env_id:
        vulnerabilities = [v for v in vulnerabilities if v.environment_id == env_id]
    
    return VulnerabilityListResponse(
        vulnerabilities=vulnerabilities,
        total=len(vulnerabilities),
        filtered_by={"env_id": env_id} if env_id else None
    )


@router.get("/sbom", response_model=SbomListResponse)
async def get_sbom(env_id: Optional[str] = Query(None, description="Filter by environment ID")):
    """
    Get SBOM (Software Bill of Materials) components
    """
    components = generate_sbom_components(env_id=env_id)
    
    # Filter by environment if specified
    if env_id:
        components = [c for c in components if c.environment_id == env_id]
    
    return SbomListResponse(
        components=components,
        total=len(components),
        environment_id=env_id,
        generated_at=datetime.utcnow()
    )


@router.get("/poam", response_model=PoamListResponse)
async def get_poam(env_id: Optional[str] = Query(None, description="Filter by environment ID")):
    """
    Get POA&M (Plan of Action & Milestones) items
    """
    items = generate_poam_items(env_id=env_id)
    
    # Filter by environment if specified
    if env_id:
        items = [item for item in items if item.environment_id == env_id]
    
    return PoamListResponse(
        items=items,
        total=len(items),
        environment_id=env_id
    )


@router.post("/agents/run", response_model=AgentRunResponse)
async def create_agent_run(request: AgentRunRequest):
    """
    Create a new agent task run
    Stubbed implementation - returns immediately with pending status
    """
    run_id = str(uuid.uuid4())
    
    # Create run detail
    run_detail = AgentRunDetail(
        run_id=run_id,
        task_type=request.task_type,
        status=TaskStatus.PENDING,
        parameters=request.parameters,
        created_at=datetime.utcnow(),
        progress_percent=0
    )
    
    # Store in memory
    agent_runs_storage[run_id] = run_detail
    
    return AgentRunResponse(
        run_id=run_id,
        task_type=request.task_type,
        status=TaskStatus.PENDING,
        created_at=run_detail.created_at,
        estimated_completion=datetime.utcnow() + timedelta(minutes=5)
    )


@router.get("/agents/runs/{run_id}", response_model=AgentRunDetail)
async def get_agent_run(run_id: str):
    """
    Get status and results of an agent run
    Simulates realistic AI processing with progress updates
    """
    if run_id not in agent_runs_storage:
        raise HTTPException(status_code=404, detail=f"Agent run {run_id} not found")
    
    run = agent_runs_storage[run_id]
    
    # Simulate progress (in production, this would check actual task status)
    elapsed = (datetime.utcnow() - run.created_at).total_seconds()
    
    if elapsed > 10 and run.status == TaskStatus.PENDING:
        # Task completed
        run.status = TaskStatus.COMPLETED
        run.completed_at = datetime.utcnow()
        run.progress_percent = 100
        
        # Generate result based on task type and parameters
        if run.task_type == TaskType.TRIAGE_VULNERABILITIES:
            run.result = {
                "triaged": 12,
                "critical_for_review": 3,
                "false_positives": 2,
                "recommendations": [
                    "Update xz-utils immediately to version 5.6.2",
                    "Schedule OpenSSL upgrade for next maintenance window",
                    "Review and patch runc containers"
                ]
            }
        elif run.task_type == TaskType.GENERATE_POAM:
            # Extract vulnerability details from parameters
            params = run.parameters or {}
            cve_id = params.get("cve_id", "CVE-UNKNOWN")
            severity = params.get("severity", "high")
            package = params.get("package", "unknown-package")
            version = params.get("version", "unknown")
            asset = params.get("asset", "unknown-asset")
            
            # Generate realistic POA&M based on vulnerability
            poam_id = f"POAM-{datetime.utcnow().year}-{uuid.uuid4().hex[:6].upper()}"
            
            # Determine completion timeline based on severity
            days_to_complete = {
                "critical": 7,
                "high": 30,
                "medium": 90,
                "low": 180
            }.get(severity, 30)
            
            run.result = {
                "items_generated": 1,
                "poam_id": poam_id,
                "weakness_name": f"{cve_id} - Vulnerable {package} in {asset}",
                "description": f"Critical vulnerability {cve_id} detected in {package} version {version}. This vulnerability poses a significant security risk and requires immediate remediation.",
                "impact": f"Exploitation of this {severity} severity vulnerability could lead to unauthorized access, data breach, or service disruption affecting {asset}.",
                "recommendation": f"Upgrade {package} from version {version} to the latest patched version. Test in staging environment before deploying to production.",
                "scheduled_completion": (datetime.utcnow() + timedelta(days=days_to_complete)).isoformat(),
                "milestones": [
                    {
                        "description": "Risk assessment and impact analysis",
                        "due_date": (datetime.utcnow() + timedelta(days=2)).isoformat(),
                        "status": "pending"
                    },
                    {
                        "description": "Identify and test patch/upgrade path",
                        "due_date": (datetime.utcnow() + timedelta(days=int(days_to_complete * 0.4))).isoformat(),
                        "status": "pending"
                    },
                    {
                        "description": "Deploy fix to staging environment",
                        "due_date": (datetime.utcnow() + timedelta(days=int(days_to_complete * 0.7))).isoformat(),
                        "status": "pending"
                    },
                    {
                        "description": "Deploy fix to production and verify",
                        "due_date": (datetime.utcnow() + timedelta(days=days_to_complete)).isoformat(),
                        "status": "pending"
                    }
                ],
                "estimated_effort": f"{days_to_complete} days",
                "recommendations": [
                    f"Immediately update {package} to the latest secure version",
                    f"Scan all assets for similar vulnerabilities",
                    f"Implement automated dependency scanning in CI/CD pipeline",
                    f"Review and update vulnerability management procedures"
                ]
            }
    elif elapsed > 2 and run.status == TaskStatus.PENDING:
        # Task running
        run.status = TaskStatus.RUNNING
        run.started_at = datetime.utcnow()
        run.progress_percent = min(80, int(elapsed * 8))

    return run


# ============================================================================
# AI SECURITY ENDPOINTS
# ============================================================================

# In-memory storage for AI models and assessments
ai_models_storage: Dict[str, AIModel] = {}
ai_assessments_storage: Dict[str, AIAssessmentResult] = {}


def generate_sample_ai_models() -> List[AIModel]:
    """Generate sample AI models"""
    return [
        AIModel(
            id="model-1",
            name="GPT-4 Turbo",
            source=AIModelSource.OPENAI,
            model_type="text-generation",
            version="gpt-4-1106-preview",
            framework="OpenAI API",
            endpoint="https://api.openai.com/v1/chat/completions",
            overall_score=87,
            risk_level=AIRiskLevel.LOW,
            last_assessed=datetime.utcnow() - timedelta(days=1),
            license="Proprietary",
            tags=["llm", "chat", "production"]
        ),
        AIModel(
            id="model-2",
            name="Claude 3 Sonnet",
            source=AIModelSource.ANTHROPIC,
            model_type="text-generation",
            version="claude-3-sonnet-20240229",
            framework="Anthropic API",
            endpoint="https://api.anthropic.com/v1/messages",
            overall_score=92,
            risk_level=AIRiskLevel.LOW,
            last_assessed=datetime.utcnow() - timedelta(days=2),
            license="Proprietary",
            tags=["llm", "chat", "production"]
        ),
        AIModel(
            id="model-3",
            name="Llama 2 70B",
            source=AIModelSource.HUGGINGFACE,
            model_type="text-generation",
            version="2.0",
            framework="Transformers",
            huggingface_id="meta-llama/Llama-2-70b-chat-hf",
            author="Meta",
            downloads=1500000,
            overall_score=78,
            risk_level=AIRiskLevel.MEDIUM,
            last_assessed=datetime.utcnow() - timedelta(days=5),
            license="Llama 2 Community",
            tags=["llm", "open-source", "chat"]
        ),
        AIModel(
            id="model-4",
            name="Local Ollama - Llama3",
            source=AIModelSource.OLLAMA,
            model_type="text-generation",
            version="3.0",
            framework="Ollama",
            endpoint="http://localhost:11434",
            overall_score=65,
            risk_level=AIRiskLevel.MEDIUM,
            tags=["llm", "local", "development"]
        )
    ]


def generate_aisvs_scores() -> List[AISVSScore]:
    """Generate AISVS assessment scores"""
    categories = [
        (AISVSCategory.DATA_SECURITY, "Data Security"),
        (AISVSCategory.MODEL_SECURITY, "Model Security"),
        (AISVSCategory.INPUT_VALIDATION, "Input Validation"),
        (AISVSCategory.OUTPUT_SECURITY, "Output Security"),
        (AISVSCategory.ACCESS_CONTROL, "Access Control"),
        (AISVSCategory.MODEL_EXPLAINABILITY, "Model Explainability"),
        (AISVSCategory.PRIVACY_PROTECTION, "Privacy Protection"),
        (AISVSCategory.ADVERSARIAL_ROBUSTNESS, "Adversarial Robustness"),
        (AISVSCategory.MONITORING_LOGGING, "Monitoring & Logging"),
        (AISVSCategory.COMPLIANCE_GOVERNANCE, "Compliance & Governance")
    ]

    scores = []
    for cat, name in categories:
        score = random.randint(6, 10)
        percentage = score * 10
        status = "pass" if score >= 8 else "partial" if score >= 6 else "fail"

        scores.append(AISVSScore(
            category=cat,
            category_name=name,
            score=score,
            max_score=10,
            percentage=percentage,
            status=status,
            details=f"{name} assessment completed with {score}/10 controls verified.",
            controls_met=[f"{name} - Core controls implemented"] if score >= 7 else [],
            controls_failed=[f"{name} - Enhanced monitoring required"] if score < 10 else [],
            recommendations=[f"Implement additional {name.lower()} controls"] if score < 10 else []
        ))

    return scores


def generate_nist_scores() -> List[NISTAIRMFScore]:
    """Generate NIST AI RMF scores"""
    pillars = [
        (NISTAIRMFPillar.GOVERN, "Govern", "AI governance and accountability"),
        (NISTAIRMFPillar.MAP, "Map", "Risk identification and context understanding"),
        (NISTAIRMFPillar.MEASURE, "Measure", "Metrics and trustworthiness assessment"),
        (NISTAIRMFPillar.MANAGE, "Manage", "Risk response and improvement")
    ]

    scores = []
    for pillar, name, desc in pillars:
        score = random.randint(70, 95)
        status = "pass" if score >= 85 else "partial" if score >= 70 else "fail"

        scores.append(NISTAIRMFScore(
            pillar=pillar,
            pillar_name=name,
            score=score,
            status=status,
            details=f"{desc}: {score}% compliance achieved.",
            subcategories=[
                NISTSubcategory(
                    id=f"{pillar.value}-1",
                    name=f"{name} Policy",
                    description=f"{name} policy implementation",
                    score=random.randint(75, 95),
                    status="implemented"
                ),
                NISTSubcategory(
                    id=f"{pillar.value}-2",
                    name=f"{name} Process",
                    description=f"{name} process documentation",
                    score=random.randint(70, 90),
                    status="partial"
                )
            ],
            recommendations=[f"Enhance {name.lower()} documentation"] if score < 90 else []
        ))

    return scores


def generate_atlas_threats() -> List[ATLASThreat]:
    """Generate ATLAS threat assessment"""
    threats = [
        ("AML.T0001", "Model Inversion", SeverityLevel.HIGH),
        ("AML.T0020", "Data Poisoning", SeverityLevel.CRITICAL),
        ("AML.T0043", "Adversarial Examples", SeverityLevel.HIGH),
        ("AML.T0024", "Model Extraction", SeverityLevel.MEDIUM),
        ("AML.T0025", "Membership Inference", SeverityLevel.MEDIUM),
        ("AML.T0019", "Backdoor Attacks", SeverityLevel.CRITICAL),
        ("AML.T0051", "Prompt Injection", SeverityLevel.HIGH)
    ]

    return [
        ATLASThreat(
            threat_id=tid,
            threat_name=name,
            category=ATLASThreatCategory.ML_ATTACK_STAGING,
            description=f"{name} attack vector assessment",
            mitigated=random.random() > 0.3,
            severity=severity,
            mitigation_notes="Controls implemented and verified" if random.random() > 0.5 else None
        )
        for tid, name, severity in threats
    ]


def generate_red_team_results() -> List[RedTeamTest]:
    """Generate red team test results"""
    tests = [
        (RedTeamTestType.PROMPT_INJECTION, "Direct Prompt Injection", SeverityLevel.HIGH),
        (RedTeamTestType.PROMPT_INJECTION, "Indirect Prompt Injection", SeverityLevel.HIGH),
        (RedTeamTestType.JAILBREAK, "DAN Prompt Attempt", SeverityLevel.CRITICAL),
        (RedTeamTestType.JAILBREAK, "Role-playing Bypass", SeverityLevel.HIGH),
        (RedTeamTestType.PRIVACY_LEAKAGE, "PII Extraction Attempt", SeverityLevel.CRITICAL),
        (RedTeamTestType.HALLUCINATION, "Factuality Test", SeverityLevel.MEDIUM)
    ]

    return [
        RedTeamTest(
            id=f"test-{i+1}",
            test_type=test_type,
            test_name=name,
            description=f"Automated {name.lower()} security test",
            payload=f"[Test payload for {name}]",
            expected_behavior="Model should refuse or handle safely",
            actual_behavior="Model handled request safely" if random.random() > 0.2 else "Potential vulnerability detected",
            passed=random.random() > 0.2,
            severity=severity,
            timestamp=datetime.utcnow(),
            duration=random.randint(500, 2000)
        )
        for i, (test_type, name, severity) in enumerate(tests)
    ]


# Initialize sample models
for model in generate_sample_ai_models():
    ai_models_storage[model.id] = model


@router.get("/ai-models", response_model=AIModelListResponse)
async def get_ai_models(
    source: Optional[AIModelSource] = Query(None, description="Filter by source"),
    risk_level: Optional[AIRiskLevel] = Query(None, description="Filter by risk level")
):
    """
    Get list of registered AI models
    """
    models = list(ai_models_storage.values())

    if source:
        models = [m for m in models if m.source == source]
    if risk_level:
        models = [m for m in models if m.risk_level == risk_level]

    return AIModelListResponse(
        models=models,
        total=len(models)
    )


@router.post("/ai-models", response_model=AIModel, status_code=201)
async def create_ai_model(request: Dict[str, Any]):
    """
    Register a new AI model
    """
    model_id = f"model-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"

    model = AIModel(
        id=model_id,
        name=request.get("name", "Unknown Model"),
        source=AIModelSource(request.get("source", "local")),
        model_type=request.get("model_type", "unknown"),
        version=request.get("version", "1.0"),
        framework=request.get("framework", "unknown"),
        endpoint=request.get("endpoint"),
        huggingface_id=request.get("huggingface_id"),
        author=request.get("author"),
        license=request.get("license"),
        downloads=request.get("downloads"),
        tags=request.get("tags", []),
        overall_score=0,
        risk_level=AIRiskLevel.UNKNOWN
    )

    ai_models_storage[model_id] = model
    return model


@router.get("/ai-models/{model_id}", response_model=AIModel)
async def get_ai_model(model_id: str):
    """
    Get details of a specific AI model
    """
    if model_id not in ai_models_storage:
        raise HTTPException(status_code=404, detail=f"AI model {model_id} not found")
    return ai_models_storage[model_id]


@router.post("/ai-models/discover", response_model=ModelDiscoveryResponse)
async def discover_ai_models(request: ModelDiscoveryRequest):
    """
    Discover AI models from HuggingFace or local endpoints
    """
    discovered_models = []

    if request.source in [AIModelSource.HUGGINGFACE, AIModelSource.LOCAL]:
        # Generate mock discovered models
        if request.source == AIModelSource.HUGGINGFACE:
            mock_models = [
                AIModel(
                    id=f"hf-{datetime.utcnow().timestamp()}-1",
                    name="Llama-2-7b-chat-hf",
                    source=AIModelSource.HUGGINGFACE,
                    model_type="text-generation",
                    version="2.0",
                    framework="Transformers",
                    huggingface_id="meta-llama/Llama-2-7b-chat-hf",
                    author="Meta",
                    downloads=5000000,
                    overall_score=0,
                    risk_level=AIRiskLevel.UNKNOWN,
                    license="Llama 2 Community",
                    tags=["llm", "chat", "open-source"]
                ),
                AIModel(
                    id=f"hf-{datetime.utcnow().timestamp()}-2",
                    name="Mistral-7B-Instruct-v0.2",
                    source=AIModelSource.HUGGINGFACE,
                    model_type="text-generation",
                    version="0.2",
                    framework="Transformers",
                    huggingface_id="mistralai/Mistral-7B-Instruct-v0.2",
                    author="Mistral AI",
                    downloads=3000000,
                    overall_score=0,
                    risk_level=AIRiskLevel.UNKNOWN,
                    license="Apache 2.0",
                    tags=["llm", "instruct", "open-source"]
                )
            ]
            discovered_models = mock_models
        else:
            # Local models
            mock_local = [
                AIModel(
                    id=f"local-{datetime.utcnow().timestamp()}-1",
                    name="llama3:latest",
                    source=AIModelSource.OLLAMA,
                    model_type="text-generation",
                    version="3.0",
                    framework="Ollama",
                    endpoint="http://localhost:11434",
                    overall_score=0,
                    risk_level=AIRiskLevel.UNKNOWN,
                    tags=["local", "llm", "ollama"]
                )
            ]
            discovered_models = mock_local

    return ModelDiscoveryResponse(
        source=request.source,
        models=discovered_models,
        total=len(discovered_models)
    )


@router.post("/ai-assessments", response_model=AIAssessmentResult, status_code=201)
async def create_ai_assessment(request: AIAssessmentRequest):
    """
    Run a security assessment on an AI model
    """
    assessment_id = f"assess-{uuid.uuid4().hex[:12]}"

    # Generate assessment results
    aisvs_scores = generate_aisvs_scores() if request.config.include_aisvs else []
    nist_scores = generate_nist_scores() if request.config.include_nist_rmf else []
    atlas_threats = generate_atlas_threats() if request.config.include_atlas else []
    red_team_results = generate_red_team_results() if request.config.include_red_team else None

    # Calculate overall score
    scores_to_avg = []
    if aisvs_scores:
        scores_to_avg.append(sum(s.percentage for s in aisvs_scores) / len(aisvs_scores))
    if nist_scores:
        scores_to_avg.append(sum(s.score for s in nist_scores) / len(nist_scores))
    if atlas_threats:
        mitigated = sum(1 for t in atlas_threats if t.mitigated)
        scores_to_avg.append((mitigated / len(atlas_threats)) * 100)
    if red_team_results:
        passed = sum(1 for t in red_team_results if t.passed)
        scores_to_avg.append((passed / len(red_team_results)) * 100)

    overall_score = int(sum(scores_to_avg) / len(scores_to_avg)) if scores_to_avg else 0

    # Determine risk level
    if overall_score >= 80:
        risk_level = AIRiskLevel.LOW
    elif overall_score >= 60:
        risk_level = AIRiskLevel.MEDIUM
    elif overall_score >= 40:
        risk_level = AIRiskLevel.HIGH
    else:
        risk_level = AIRiskLevel.CRITICAL

    # Generate findings
    findings = []
    finding_id = 1

    for score in aisvs_scores:
        if score.status != "pass":
            findings.append(AssessmentFinding(
                id=f"finding-{finding_id}",
                type="compliance_gap",
                severity=SeverityLevel.HIGH if score.status == "fail" else SeverityLevel.MEDIUM,
                title=f"{score.category_name} Controls Incomplete",
                description=score.details,
                framework="AISVS",
                category=score.category.value,
                remediation=score.recommendations[0] if score.recommendations else "Implement missing controls",
                status="open"
            ))
            finding_id += 1

    for threat in atlas_threats:
        if not threat.mitigated:
            findings.append(AssessmentFinding(
                id=f"finding-{finding_id}",
                type="vulnerability",
                severity=threat.severity,
                title=f"{threat.threat_name} Not Mitigated",
                description=f"MITRE ATLAS threat {threat.threat_id}: {threat.threat_name} has not been adequately mitigated.",
                framework="ATLAS",
                remediation=f"Implement controls to mitigate {threat.threat_name} attack vector",
                status="open"
            ))
            finding_id += 1

    # Generate recommendations
    recommendations = []
    if overall_score < 80:
        recommendations.append("Enhance overall security posture to achieve compliance")
    if any(t for t in atlas_threats if not t.mitigated and t.severity == SeverityLevel.CRITICAL):
        recommendations.append("Address critical ATLAS threats immediately")
    if red_team_results and any(t for t in red_team_results if not t.passed and t.severity == SeverityLevel.CRITICAL):
        recommendations.append("Implement additional guardrails for critical vulnerabilities")

    assessment = AIAssessmentResult(
        assessment_id=assessment_id,
        model_id=request.model_id,
        model_name=request.model_name or request.model_id,
        model_source=request.model_source,
        status=AssessmentStatus.COMPLETED,
        progress=100,
        timestamp=datetime.utcnow(),
        duration=random.randint(10000, 40000),
        overall_score=overall_score,
        risk_level=risk_level,
        aisvs_scores=aisvs_scores,
        nist_scores=nist_scores,
        atlas_threats=atlas_threats,
        red_team_results=red_team_results,
        recommendations=recommendations,
        findings=findings
    )

    ai_assessments_storage[assessment_id] = assessment

    # Update model with assessment results
    if request.model_id in ai_models_storage:
        ai_models_storage[request.model_id].overall_score = overall_score
        ai_models_storage[request.model_id].risk_level = risk_level
        ai_models_storage[request.model_id].last_assessed = datetime.utcnow()

    return assessment


@router.get("/ai-assessments", response_model=AIAssessmentListResponse)
async def get_ai_assessments(
    model_id: Optional[str] = Query(None, description="Filter by model ID")
):
    """
    Get list of AI assessments
    """
    assessments = list(ai_assessments_storage.values())

    if model_id:
        assessments = [a for a in assessments if a.model_id == model_id]

    # Sort by timestamp (most recent first)
    assessments.sort(key=lambda a: a.timestamp, reverse=True)

    return AIAssessmentListResponse(
        assessments=assessments,
        total=len(assessments)
    )


@router.get("/ai-assessments/{assessment_id}", response_model=AIAssessmentResult)
async def get_ai_assessment(assessment_id: str):
    """
    Get details of a specific assessment
    """
    if assessment_id not in ai_assessments_storage:
        raise HTTPException(status_code=404, detail=f"Assessment {assessment_id} not found")
    return ai_assessments_storage[assessment_id]


