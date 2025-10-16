from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import json
import logging
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SBOM Service", version="1.0.0")

# Models
class ProjectInfo(BaseModel):
    gitlab_project_id: int

class SourceInfo(BaseModel):
    pipeline_id: int
    job_id: int
    sha: str
    ref: str
    image_tag: Optional[str] = None
    image_digest: Optional[str] = None
    web_url: Optional[str] = None

class SBOMIngestRequest(BaseModel):
    format: str
    document: Dict[str, Any]
    project: ProjectInfo
    source: SourceInfo

class Component(BaseModel):
    purl: Optional[str] = None
    name: str
    version: Optional[str] = None
    type: Optional[str] = None

# Database models (simplified for MVP)
class Database:
    def __init__(self):
        # In MVP, we'll use simple in-memory storage
        # In production, this would be PostgreSQL
        self.sbom_documents = {}
        self.components = {}
    
    def upsert_sbom(self, sbom_data: dict, project_info: ProjectInfo, source_info: SourceInfo):
        # Generate unique ID for the SBOM
        sbom_id = str(uuid.uuid4())
        
        # Create SBOM document record
        sbom_doc = {
            "id": sbom_id,
            "format": sbom_data.get("format", "cyclonedx"),
            "document": sbom_data,
            "gitlab_project_id": project_info.gitlab_project_id,
            "pipeline_id": source_info.pipeline_id,
            "job_id": source_info.job_id,
            "sha": source_info.sha,
            "image_digest": source_info.image_digest,
            "image_tag": source_info.image_tag,
            "source_url": source_info.web_url,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        self.sbom_documents[sbom_id] = sbom_doc
        
        # Extract and store components
        components = self._extract_components(sbom_data)
        for comp in components:
            comp_id = str(uuid.uuid4())
            comp_record = {
                "id": comp_id,
                "sbom_id": sbom_id,
                "purl": comp.purl,
                "name": comp.name,
                "version": comp.version,
                "type": comp.type,
                "created_at": datetime.utcnow().isoformat()
            }
            self.components[comp_id] = comp_record
        
        logger.info(f"Stored SBOM {sbom_id} with {len(components)} components")
        return {"sbom_id": sbom_id, "components_count": len(components)}
    
    def _extract_components(self, sbom_data: dict) -> List[Component]:
        """Extract components from CycloneDX SBOM"""
        components = []
        
        # Handle CycloneDX format
        if "components" in sbom_data:
            for comp in sbom_data["components"]:
                component = Component(
                    purl=comp.get("purl"),
                    name=comp.get("name", "unknown"),
                    version=comp.get("version"),
                    type=comp.get("type")
                )
                components.append(component)
        
        return components
    
    def get_sbom_by_project(self, gitlab_project_id: int) -> List[dict]:
        """Get all SBOMs for a specific GitLab project"""
        return [
            doc for doc in self.sbom_documents.values()
            if doc["gitlab_project_id"] == gitlab_project_id
        ]
    
    def get_sbom_by_pipeline(self, gitlab_project_id: int, pipeline_id: int) -> Optional[dict]:
        """Get SBOM for a specific pipeline"""
        for doc in self.sbom_documents.values():
            if (doc["gitlab_project_id"] == gitlab_project_id and 
                doc["pipeline_id"] == pipeline_id):
                return doc
        return None

db = Database()

# Routes
@app.get("/api/sboms")
async def get_all_sboms():
    """Get all SBOMs"""
    try:
        # Return all SBOM documents
        sboms = list(db.sbom_documents.values())
        return sboms
    except Exception as e:
        logger.error(f"Error retrieving all SBOMs: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve SBOMs")

@app.post("/api/sboms/ingest")
async def ingest_sbom(request: SBOMIngestRequest):
    """Ingest a new SBOM document"""
    try:
        logger.info(f"Ingesting SBOM for project {request.project.gitlab_project_id}, pipeline {request.source.pipeline_id}")
        
        # Validate format
        if request.format.lower() != "cyclonedx":
            raise HTTPException(status_code=400, detail="Only CycloneDX format is supported")
        
        # Store SBOM and extract components
        result = db.upsert_sbom(
            request.document,
            request.project,
            request.source
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error ingesting SBOM: {e}")
        raise HTTPException(status_code=500, detail="Failed to ingest SBOM")

@app.get("/api/sboms/project/{gitlab_project_id}")
async def get_project_sboms(gitlab_project_id: int):
    """Get all SBOMs for a GitLab project"""
    try:
        sboms = db.get_sbom_by_project(gitlab_project_id)
        return {
            "project_id": gitlab_project_id,
            "sbom_count": len(sboms),
            "sboms": sboms
        }
    except Exception as e:
        logger.error(f"Error retrieving SBOMs: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve SBOMs")

@app.get("/api/sboms/pipeline/{gitlab_project_id}/{pipeline_id}")
async def get_pipeline_sbom(gitlab_project_id: int, pipeline_id: int):
    """Get SBOM for a specific pipeline"""
    try:
        sbom = db.get_sbom_by_pipeline(gitlab_project_id, pipeline_id)
        if not sbom:
            raise HTTPException(status_code=404, detail="SBOM not found")
        return sbom
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving pipeline SBOM: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve pipeline SBOM")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "sbom-service"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "SBOM Service", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
