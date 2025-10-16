from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import asyncio
import structlog
from datetime import datetime
import subprocess
import tempfile
import os

# Configure structured logging
logger = structlog.get_logger()

app = FastAPI(
    title="SBOM Analyzer Service",
    description="Software Bill of Materials analysis and vulnerability correlation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class SBOMComponent(BaseModel):
    name: str
    version: str
    type: str
    purl: Optional[str]
    licenses: List[str]
    vulnerabilities: List[str]
    dependencies: List[str]
    parent_dependencies: List[str] = []
    transitive_dependencies: List[str] = []
    risk_level: str = "low"
    last_updated: Optional[datetime] = None
    maintainer: Optional[str] = None
    repository: Optional[str] = None

class SBOMAnalysis(BaseModel):
    id: str
    filename: str
    format: str
    components_count: int
    vulnerabilities_count: int
    risk_score: float
    created_at: datetime
    components: List[SBOMComponent]
    metadata: Dict[str, Any]
    dependency_tree: Dict[str, List[str]] = {}
    license_summary: Dict[str, int] = {}
    risk_distribution: Dict[str, int] = {}

class AnalysisRequest(BaseModel):
    filename: str
    format: str
    auto_scan: bool = True

# Mock data store (replace with database in production)
sbom_store: Dict[str, SBOMAnalysis] = {}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "sbom-analyzer", "timestamp": datetime.utcnow()}

@app.post("/analyze", response_model=SBOMAnalysis)
async def analyze_sbom(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    """Analyze an uploaded SBOM file"""
    
    # Validate file type
    if not file.filename.endswith(('.json', '.xml', '.spdx', '.cdx')):
        raise HTTPException(status_code=400, detail="Unsupported file format")
    
    try:
        # Read file content
        content = await file.read()
        
        # Create analysis ID
        analysis_id = f"sbom_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        
        # Parse SBOM content
        if file.filename.endswith('.json'):
            sbom_data = json.loads(content.decode())
            analysis = await parse_json_sbom(sbom_data, file.filename, analysis_id)
        else:
            # For other formats, create basic analysis
            analysis = await create_basic_analysis(file.filename, analysis_id)
        
        # Store analysis
        sbom_store[analysis_id] = analysis
        
        # Background task for vulnerability scanning
        if background_tasks:
            background_tasks.add_task(scan_vulnerabilities, analysis_id)
        
        logger.info("SBOM analysis completed", analysis_id=analysis_id, components_count=analysis.components_count)
        
        return analysis
        
    except Exception as e:
        logger.error("Error analyzing SBOM", error=str(e), filename=file.filename)
        raise HTTPException(status_code=500, detail=f"Error analyzing SBOM: {str(e)}")

@app.get("/analyses", response_model=List[SBOMAnalysis])
async def get_analyses(limit: int = 100):
    """Get all SBOM analyses"""
    analyses = list(sbom_store.values())
    return sorted(analyses, key=lambda x: x.created_at, reverse=True)[:limit]

@app.get("/analyses/{analysis_id}", response_model=SBOMAnalysis)
async def get_analysis(analysis_id: str):
    """Get a specific SBOM analysis by ID"""
    if analysis_id not in sbom_store:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return sbom_store[analysis_id]

@app.post("/analyses/{analysis_id}/rescan")
async def rescan_analysis(analysis_id: str, background_tasks: BackgroundTasks):
    """Rescan an existing SBOM analysis for vulnerabilities"""
    if analysis_id not in sbom_store:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    background_tasks.add_task(scan_vulnerabilities, analysis_id)
    return {"message": "Rescan started", "analysis_id": analysis_id}

@app.get("/metrics")
async def get_metrics():
    """Get service metrics for Prometheus"""
    total_analyses = len(sbom_store)
    total_components = sum(analysis.components_count for analysis in sbom_store.values())
    total_vulnerabilities = sum(analysis.vulnerabilities_count for analysis in sbom_store.values())
    
    return {
        "total_analyses": total_analyses,
        "total_components": total_components,
        "total_vulnerabilities": total_vulnerabilities,
        "average_risk_score": sum(analysis.risk_score for analysis in sbom_store.values()) / total_analyses if total_analyses > 0 else 0
    }

@app.get("/analyses/{analysis_id}/dependency-tree")
async def get_dependency_tree(analysis_id: str):
    """Get dependency tree for a specific analysis"""
    if analysis_id not in sbom_store:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    analysis = sbom_store[analysis_id]
    return {
        "analysis_id": analysis_id,
        "dependency_tree": analysis.dependency_tree,
        "component_count": analysis.components_count
    }

@app.get("/analyses/{analysis_id}/components/{component_name}")
async def get_component_details(analysis_id: str, component_name: str):
    """Get detailed information about a specific component"""
    if analysis_id not in sbom_store:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    analysis = sbom_store[analysis_id]
    component = next((comp for comp in analysis.components if comp.name == component_name), None)
    
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    
    return {
        "analysis_id": analysis_id,
        "component": component,
        "related_components": [comp.name for comp in analysis.components if component_name in comp.dependencies]
    }

@app.get("/analyses/{analysis_id}/risk-analysis")
async def get_risk_analysis(analysis_id: str):
    """Get detailed risk analysis for a specific analysis"""
    if analysis_id not in sbom_store:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    analysis = sbom_store[analysis_id]
    
    # Calculate risk distribution
    risk_distribution = {}
    for component in analysis.components:
        risk_level = component.risk_level
        risk_distribution[risk_level] = risk_distribution.get(risk_level, 0) + 1
    
    # Calculate license summary
    license_summary = {}
    for component in analysis.components:
        for license in component.licenses:
            license_summary[license] = license_summary.get(license, 0) + 1
    
    return {
        "analysis_id": analysis_id,
        "risk_distribution": risk_distribution,
        "license_summary": license_summary,
        "overall_risk_score": analysis.risk_score,
        "critical_components": [comp.name for comp in analysis.components if comp.risk_level == "critical"],
        "high_risk_components": [comp.name for comp in analysis.components if comp.risk_level == "high"]
    }

async def parse_json_sbom(sbom_data: Dict, filename: str, analysis_id: str) -> SBOMAnalysis:
    """Parse JSON SBOM data"""
    components = []
    
    # Handle different SBOM formats
    if "components" in sbom_data:
        # CycloneDX format
        for comp in sbom_data["components"]:
            component = SBOMComponent(
                name=comp.get("name", "unknown"),
                version=comp.get("version", "unknown"),
                type=comp.get("type", "library"),
                purl=comp.get("purl"),
                licenses=comp.get("licenses", []),
                vulnerabilities=[],
                dependencies=[]
            )
            components.append(component)
    elif "packages" in sbom_data:
        # SPDX format
        for pkg in sbom_data["packages"]:
            component = SBOMComponent(
                name=pkg.get("name", "unknown"),
                version=pkg.get("versionInfo", "unknown"),
                type="library",
                purl=pkg.get("externalRefs", []),
                licenses=pkg.get("licenseInfoFromFiles", []),
                vulnerabilities=[],
                dependencies=[]
            )
            components.append(component)
    
    return SBOMAnalysis(
        id=analysis_id,
        filename=filename,
        format="json",
        components_count=len(components),
        vulnerabilities_count=0,
        risk_score=0.0,
        created_at=datetime.utcnow(),
        components=components,
        metadata=sbom_data.get("metadata", {})
    )

async def create_basic_analysis(filename: str, analysis_id: str) -> SBOMAnalysis:
    """Create basic analysis for unsupported formats"""
    return SBOMAnalysis(
        id=analysis_id,
        filename=filename,
        format="unknown",
        components_count=0,
        vulnerabilities_count=0,
        risk_score=0.0,
        created_at=datetime.utcnow(),
        components=[],
        metadata={"note": "Format not fully supported"}
    )

async def scan_vulnerabilities(analysis_id: str):
    """Scan components for vulnerabilities using external tools"""
    try:
        if analysis_id not in sbom_store:
            return
        
        analysis = sbom_store[analysis_id]
        
        # Simulate vulnerability scanning
        for component in analysis.components:
            # Mock vulnerability detection
            if "log4j" in component.name.lower():
                component.vulnerabilities.append("CVE-2021-44228")
            elif "spring" in component.name.lower():
                component.vulnerabilities.append("CVE-2022-22965")
        
        # Update analysis
        analysis.vulnerabilities_count = sum(len(comp.vulnerabilities) for comp in analysis.components)
        analysis.risk_score = min(10.0, analysis.vulnerabilities_count * 2.0)
        
        # Update store
        sbom_store[analysis_id] = analysis
        
        logger.info("Vulnerability scan completed", analysis_id=analysis_id, vulnerabilities_found=analysis.vulnerabilities_count)
        
    except Exception as e:
        logger.error("Error scanning vulnerabilities", analysis_id=analysis_id, error=str(e))

# Initialize with sample data
@app.on_event("startup")
async def startup_event():
    """Initialize service with sample data"""
    sample_analysis = SBOMAnalysis(
        id="sample_sbom_001",
        filename="sample-project.cdx",
        format="cyclonedx",
        components_count=15,
        vulnerabilities_count=3,
        risk_score=6.5,
        created_at=datetime.utcnow(),
        components=[
            SBOMComponent(
                name="log4j-core",
                version="2.14.1",
                type="library",
                purl="pkg:maven/org.apache.logging.log4j/log4j-core@2.14.1",
                licenses=["Apache-2.0"],
                vulnerabilities=["CVE-2021-44228"],
                dependencies=[]
            )
        ],
        metadata={"project": "Sample Project", "version": "1.0.0"}
    )
    
    sbom_store[sample_analysis.id] = sample_analysis
    logger.info("SBOM Analyzer service started", sample_analyses_count=1)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
