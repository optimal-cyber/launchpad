import os
import logging
import httpx
import json
from typing import Dict, Any
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
GITLAB_BASE_URL = os.getenv("GITLAB_BASE_URL", "https://gitlab.com")
GITLAB_TOKEN = os.getenv("GITLAB_TOKEN")
SBOM_SERVICE_URL = os.getenv("SBOM_SERVICE_URL", "http://sbom-service:8002")
VULN_SERVICE_URL = os.getenv("VULN_SERVICE_URL", "http://vuln-service:8003")

class GitLabWorker:
    def __init__(self):
        self.gitlab_headers = {
            "Authorization": f"Bearer {GITLAB_TOKEN}",
            "Content-Type": "application/json"
        }
    
    async def fetch_artifacts(self, job_id: int, project_id: int):
        """Fetch artifacts from a GitLab job"""
        try:
            logger.info(f"Fetching artifacts for job {job_id} in project {project_id}")
            
            # Get job details
            job_url = f"{GITLAB_BASE_URL}/api/v4/projects/{project_id}/jobs/{job_id}"
            
            async with httpx.AsyncClient() as client:
                # Get job information
                job_response = await client.get(job_url, headers=self.gitlab_headers)
                if job_response.status_code != 200:
                    logger.error(f"Failed to get job info: {job_response.status_code}")
                    return False
                
                job_data = job_response.json()
                pipeline_id = job_data.get("pipeline", {}).get("id")
                sha = job_data.get("commit", {}).get("id")
                ref = job_data.get("ref")
                
                if not all([pipeline_id, sha, ref]):
                    logger.error("Missing required job metadata")
                    return False
                
                # Download artifacts
                artifacts_url = f"{job_url}/artifacts"
                artifacts_response = await client.get(artifacts_url, headers=self.gitlab_headers)
                
                if artifacts_response.status_code != 200:
                    logger.error(f"Failed to download artifacts: {artifacts_response.status_code}")
                    return False
                
                # Process artifacts (in production, this would extract the ZIP)
                # For MVP, we'll simulate the processing
                logger.info(f"Successfully downloaded artifacts for job {job_id}")
                
                # Simulate processing SBOM and vulnerability data
                await self._process_artifacts(project_id, pipeline_id, job_id, sha, ref)
                
                return True
                
        except Exception as e:
            logger.error(f"Error fetching artifacts: {e}")
            return False
    
    async def _process_artifacts(self, project_id: int, pipeline_id: int, job_id: int, sha: str, ref: str):
        """Process downloaded artifacts and send to services"""
        try:
            # In production, this would:
            # 1. Extract the artifacts ZIP
            # 2. Parse sbom.cdx.json and grype.json
            # 3. Send to respective services
            
            logger.info(f"Processing artifacts for pipeline {pipeline_id}, job {job_id}")
            
            # Simulate successful processing
            logger.info(f"Artifacts processed successfully for project {project_id}")
            
        except Exception as e:
            logger.error(f"Error processing artifacts: {e}")

# Main worker loop (simplified for MVP)
async def main():
    """Main worker loop"""
    logger.info("Starting GitLab Worker Service")
    
    worker = GitLabWorker()
    
    # In production, this would be a Celery worker
    # For MVP, we'll just keep the service running
    while True:
        try:
            # Simulate checking for new jobs
            logger.info("Worker service running...")
            await asyncio.sleep(60)  # Check every minute
            
        except KeyboardInterrupt:
            logger.info("Worker service stopping...")
            break
        except Exception as e:
            logger.error(f"Worker error: {e}")
            await asyncio.sleep(10)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())

