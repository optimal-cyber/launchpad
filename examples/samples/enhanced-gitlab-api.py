#!/usr/bin/env python3
"""
Enhanced GitLab API Integration for Optimal Platform
Provides real-time visibility into GitLab projects and environments
"""

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import asyncio
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Enhanced GitLab Integration API",
    description="Real-time GitLab project visibility for Optimal Platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
GITLAB_TOKEN = os.getenv("GITLAB_TOKEN")
GITLAB_BASE_URL = os.getenv("GITLAB_BASE_URL", "https://gitlab.com")

if not GITLAB_TOKEN:
    logger.warning("GITLAB_TOKEN not set. Some features will be limited.")

# GitLab API client
class GitLabAPIClient:
    def __init__(self, token: str, base_url: str):
        self.token = token
        self.base_url = base_url
        self.headers = {
            "PRIVATE-TOKEN": token,
            "Content-Type": "application/json"
        } if token else {}

    async def fetch_projects(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch user's GitLab projects with enhanced data"""
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/api/v4/projects"
                params = {
                    "membership": "true",
                    "per_page": limit,
                    "order_by": "last_activity_at",
                    "sort": "desc",
                    "statistics": "true"
                }
                
                response = await client.get(url, params=params, headers=self.headers)
                if response.status_code == 200:
                    projects = response.json()
                    logger.info(f"Fetched {len(projects)} projects from GitLab")
                    return projects
                else:
                    logger.error(f"Failed to fetch projects: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching projects: {e}")
            return []

    async def fetch_project_pipelines(self, project_id: int, limit: int = 5) -> List[Dict[str, Any]]:
        """Fetch recent pipelines for a project"""
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/api/v4/projects/{project_id}/pipelines"
                params = {
                    "per_page": limit,
                    "order_by": "updated_at",
                    "sort": "desc"
                }
                
                response = await client.get(url, params=params, headers=self.headers)
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to fetch pipelines for project {project_id}: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching pipelines for project {project_id}: {e}")
            return []

    async def fetch_project_jobs(self, project_id: int, pipeline_id: int) -> List[Dict[str, Any]]:
        """Fetch jobs for a specific pipeline"""
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/api/v4/projects/{project_id}/pipelines/{pipeline_id}/jobs"
                response = await client.get(url, headers=self.headers)
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to fetch jobs for pipeline {pipeline_id}: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching jobs for pipeline {pipeline_id}: {e}")
            return []

    async def fetch_project_commits(self, project_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch recent commits for a project"""
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/api/v4/projects/{project_id}/repository/commits"
                params = {
                    "per_page": limit,
                    "order_by": "created_at",
                    "sort": "desc"
                }
                
                response = await client.get(url, params=params, headers=self.headers)
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to fetch commits for project {project_id}: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching commits for project {project_id}: {e}")
            return []

    async def fetch_project_merge_requests(self, project_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch recent merge requests for a project"""
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/api/v4/projects/{project_id}/merge_requests"
                params = {
                    "per_page": limit,
                    "order_by": "updated_at",
                    "sort": "desc",
                    "state": "opened"
                }
                
                response = await client.get(url, params=params, headers=self.headers)
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to fetch merge requests for project {project_id}: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching merge requests for project {project_id}: {e}")
            return []

    async def fetch_project_issues(self, project_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch recent issues for a project"""
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/api/v4/projects/{project_id}/issues"
                params = {
                    "per_page": limit,
                    "order_by": "updated_at",
                    "sort": "desc",
                    "state": "opened"
                }
                
                response = await client.get(url, params=params, headers=self.headers)
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to fetch issues for project {project_id}: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching issues for project {project_id}: {e}")
            return []

    async def fetch_container_registry(self, project_id: int) -> List[Dict[str, Any]]:
        """Fetch container registry data for a project"""
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/api/v4/projects/{project_id}/registry/repositories"
                response = await client.get(url, headers=self.headers)
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to fetch container registries for project {project_id}: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching container registries for project {project_id}: {e}")
            return []

# Initialize GitLab client
gitlab_client = GitLabAPIClient(GITLAB_TOKEN, GITLAB_BASE_URL)

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Enhanced GitLab Integration API",
        "version": "1.0.0",
        "endpoints": {
            "projects": "/projects",
            "project_details": "/projects/{project_id}",
            "project_pipelines": "/projects/{project_id}/pipelines",
            "project_commits": "/projects/{project_id}/commits",
            "project_merge_requests": "/projects/{project_id}/merge_requests",
            "project_issues": "/projects/{project_id}/issues",
            "project_containers": "/projects/{project_id}/containers",
            "dashboard_data": "/dashboard"
        }
    }

@app.get("/projects")
async def get_projects(limit: int = Query(20, ge=1, le=100)):
    """Get user's GitLab projects with basic information"""
    try:
        projects = await gitlab_client.fetch_projects(limit)
        
        # Transform data for dashboard
        transformed_projects = []
        for project in projects:
            transformed_projects.append({
                "id": project["id"],
                "name": project["name"],
                "description": project.get("description", ""),
                "web_url": project["web_url"],
                "visibility": project.get("visibility", "private"),
                "last_activity_at": project.get("last_activity_at"),
                "star_count": project.get("star_count", 0),
                "forks_count": project.get("forks_count", 0),
                "default_branch": project.get("default_branch", "main"),
                "statistics": project.get("statistics", {}),
                "created_at": project.get("created_at"),
                "updated_at": project.get("updated_at")
            })
        
        return {
            "success": True,
            "count": len(transformed_projects),
            "projects": transformed_projects
        }
    except Exception as e:
        logger.error(f"Error fetching projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects/{project_id}")
async def get_project_details(project_id: int):
    """Get detailed information about a specific project"""
    try:
        # Fetch basic project info
        projects = await gitlab_client.fetch_projects(100)  # Get more projects to find the specific one
        project = next((p for p in projects if p["id"] == project_id), None)
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Fetch additional data
        pipelines = await gitlab_client.fetch_project_pipelines(project_id, 5)
        commits = await gitlab_client.fetch_project_commits(project_id, 10)
        merge_requests = await gitlab_client.fetch_project_merge_requests(project_id, 10)
        issues = await gitlab_client.fetch_project_issues(project_id, 10)
        containers = await gitlab_client.fetch_container_registry(project_id)
        
        # Calculate metrics
        total_pipelines = len(pipelines)
        successful_pipelines = len([p for p in pipelines if p.get("status") == "success"])
        failed_pipelines = len([p for p in pipelines if p.get("status") == "failed"])
        running_pipelines = len([p for p in pipelines if p.get("status") == "running"])
        
        # Calculate security metrics
        security_jobs = []
        for pipeline in pipelines:
            jobs = await gitlab_client.fetch_project_jobs(project_id, pipeline["id"])
            for job in jobs:
                if any(keyword in job.get("name", "").lower() for keyword in ["sast", "dependency", "security", "scan", "trivy", "syft"]):
                    security_jobs.append(job)
        
        return {
            "success": True,
            "project": {
                "id": project["id"],
                "name": project["name"],
                "description": project.get("description", ""),
                "web_url": project["web_url"],
                "visibility": project.get("visibility", "private"),
                "default_branch": project.get("default_branch", "main"),
                "created_at": project.get("created_at"),
                "updated_at": project.get("updated_at"),
                "last_activity_at": project.get("last_activity_at"),
                "statistics": project.get("statistics", {})
            },
            "metrics": {
                "total_pipelines": total_pipelines,
                "successful_pipelines": successful_pipelines,
                "failed_pipelines": failed_pipelines,
                "running_pipelines": running_pipelines,
                "success_rate": (successful_pipelines / total_pipelines * 100) if total_pipelines > 0 else 0,
                "open_merge_requests": len(merge_requests),
                "open_issues": len(issues),
                "recent_commits": len(commits),
                "container_repositories": len(containers),
                "security_jobs": len(security_jobs)
            },
            "recent_activity": {
                "pipelines": pipelines[:5],
                "commits": commits[:5],
                "merge_requests": merge_requests[:5],
                "issues": issues[:5],
                "containers": containers[:5]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching project details for {project_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects/{project_id}/pipelines")
async def get_project_pipelines(project_id: int, limit: int = Query(10, ge=1, le=50)):
    """Get recent pipelines for a project"""
    try:
        pipelines = await gitlab_client.fetch_project_pipelines(project_id, limit)
        return {
            "success": True,
            "count": len(pipelines),
            "pipelines": pipelines
        }
    except Exception as e:
        logger.error(f"Error fetching pipelines for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects/{project_id}/commits")
async def get_project_commits(project_id: int, limit: int = Query(10, ge=1, le=50)):
    """Get recent commits for a project"""
    try:
        commits = await gitlab_client.fetch_project_commits(project_id, limit)
        return {
            "success": True,
            "count": len(commits),
            "commits": commits
        }
    except Exception as e:
        logger.error(f"Error fetching commits for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects/{project_id}/merge_requests")
async def get_project_merge_requests(project_id: int, limit: int = Query(10, ge=1, le=50)):
    """Get recent merge requests for a project"""
    try:
        merge_requests = await gitlab_client.fetch_project_merge_requests(project_id, limit)
        return {
            "success": True,
            "count": len(merge_requests),
            "merge_requests": merge_requests
        }
    except Exception as e:
        logger.error(f"Error fetching merge requests for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects/{project_id}/issues")
async def get_project_issues(project_id: int, limit: int = Query(10, ge=1, le=50)):
    """Get recent issues for a project"""
    try:
        issues = await gitlab_client.fetch_project_issues(project_id, limit)
        return {
            "success": True,
            "count": len(issues),
            "issues": issues
        }
    except Exception as e:
        logger.error(f"Error fetching issues for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects/{project_id}/containers")
async def get_project_containers(project_id: int):
    """Get container registry data for a project"""
    try:
        containers = await gitlab_client.fetch_container_registry(project_id)
        return {
            "success": True,
            "count": len(containers),
            "containers": containers
        }
    except Exception as e:
        logger.error(f"Error fetching containers for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboard")
async def get_dashboard_data():
    """Get comprehensive dashboard data from all projects"""
    try:
        # Fetch all projects
        projects = await gitlab_client.fetch_projects(20)
        
        if not projects:
            return {
                "success": True,
                "message": "No projects found. Please check your GitLab token and permissions.",
                "data": {
                    "total_projects": 0,
                    "total_pipelines": 0,
                    "total_commits": 0,
                    "total_merge_requests": 0,
                    "total_issues": 0,
                    "total_containers": 0,
                    "projects": []
                }
            }
        
        # Aggregate data from all projects
        total_pipelines = 0
        total_commits = 0
        total_merge_requests = 0
        total_issues = 0
        total_containers = 0
        successful_pipelines = 0
        failed_pipelines = 0
        
        project_summaries = []
        
        for project in projects[:10]:  # Limit to first 10 projects for performance
            project_id = project["id"]
            
            # Fetch project-specific data
            pipelines = await gitlab_client.fetch_project_pipelines(project_id, 5)
            commits = await gitlab_client.fetch_project_commits(project_id, 5)
            merge_requests = await gitlab_client.fetch_project_merge_requests(project_id, 5)
            issues = await gitlab_client.fetch_project_issues(project_id, 5)
            containers = await gitlab_client.fetch_container_registry(project_id)
            
            # Count pipelines by status
            for pipeline in pipelines:
                if pipeline.get("status") == "success":
                    successful_pipelines += 1
                elif pipeline.get("status") == "failed":
                    failed_pipelines += 1
            
            # Aggregate totals
            total_pipelines += len(pipelines)
            total_commits += len(commits)
            total_merge_requests += len(merge_requests)
            total_issues += len(issues)
            total_containers += len(containers)
            
            # Create project summary
            project_summary = {
                "id": project["id"],
                "name": project["name"],
                "description": project.get("description", "")[:100] + "..." if project.get("description", "") else "No description",
                "web_url": project["web_url"],
                "visibility": project.get("visibility", "private"),
                "last_activity_at": project.get("last_activity_at"),
                "metrics": {
                    "pipelines": len(pipelines),
                    "commits": len(commits),
                    "merge_requests": len(merge_requests),
                    "issues": len(issues),
                    "containers": len(containers)
                },
                "recent_pipelines": pipelines[:3],
                "recent_commits": commits[:3],
                "recent_merge_requests": merge_requests[:3],
                "recent_issues": issues[:3]
            }
            
            project_summaries.append(project_summary)
        
        # Calculate overall metrics
        total_projects = len(projects)
        pipeline_success_rate = (successful_pipelines / total_pipelines * 100) if total_pipelines > 0 else 0
        
        return {
            "success": True,
            "data": {
                "total_projects": total_projects,
                "total_pipelines": total_pipelines,
                "total_commits": total_commits,
                "total_merge_requests": total_merge_requests,
                "total_issues": total_issues,
                "total_containers": total_containers,
                "successful_pipelines": successful_pipelines,
                "failed_pipelines": failed_pipelines,
                "pipeline_success_rate": round(pipeline_success_rate, 2),
                "projects": project_summaries
            }
        }
    except Exception as e:
        logger.error(f"Error fetching dashboard data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
