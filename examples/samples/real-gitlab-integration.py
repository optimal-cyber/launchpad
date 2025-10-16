#!/usr/bin/env python3
"""
Real GitLab Integration for Optimal Platform
Pulls actual data from GitLab projects to demonstrate environment visibility
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GitLabProjectFetcher:
    def __init__(self, gitlab_token: str, gitlab_base_url: str = "https://gitlab.com"):
        self.gitlab_token = gitlab_token
        self.gitlab_base_url = gitlab_base_url
        self.headers = {
            "PRIVATE-TOKEN": gitlab_token,
            "Content-Type": "application/json"
        }
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession(headers=self.headers)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def fetch_projects(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch user's GitLab projects"""
        try:
            url = f"{self.gitlab_base_url}/api/v4/projects"
            params = {
                "membership": "true",
                "per_page": limit,
                "order_by": "last_activity_at",
                "sort": "desc"
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    projects = await response.json()
                    logger.info(f"Fetched {len(projects)} projects from GitLab")
                    return projects
                else:
                    logger.error(f"Failed to fetch projects: {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching projects: {e}")
            return []

    async def fetch_project_details(self, project_id: int) -> Dict[str, Any]:
        """Fetch detailed information about a specific project"""
        try:
            url = f"{self.gitlab_base_url}/api/v4/projects/{project_id}"
            async with self.session.get(url) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.error(f"Failed to fetch project {project_id}: {response.status}")
                    return {}
        except Exception as e:
            logger.error(f"Error fetching project {project_id}: {e}")
            return {}

    async def fetch_pipeline_data(self, project_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch recent pipeline data for a project"""
        try:
            url = f"{self.gitlab_base_url}/api/v4/projects/{project_id}/pipelines"
            params = {
                "per_page": limit,
                "order_by": "updated_at",
                "sort": "desc"
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    pipelines = await response.json()
                    logger.info(f"Fetched {len(pipelines)} pipelines for project {project_id}")
                    return pipelines
                else:
                    logger.error(f"Failed to fetch pipelines for project {project_id}: {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching pipelines for project {project_id}: {e}")
            return []

    async def fetch_job_data(self, project_id: int, pipeline_id: int) -> List[Dict[str, Any]]:
        """Fetch job data for a specific pipeline"""
        try:
            url = f"{self.gitlab_base_url}/api/v4/projects/{project_id}/pipelines/{pipeline_id}/jobs"
            async with self.session.get(url) as response:
                if response.status == 200:
                    jobs = await response.json()
                    logger.info(f"Fetched {len(jobs)} jobs for pipeline {pipeline_id}")
                    return jobs
                else:
                    logger.error(f"Failed to fetch jobs for pipeline {pipeline_id}: {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching jobs for pipeline {pipeline_id}: {e}")
            return []

    async def fetch_commits(self, project_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch recent commits for a project"""
        try:
            url = f"{self.gitlab_base_url}/api/v4/projects/{project_id}/repository/commits"
            params = {
                "per_page": limit,
                "order_by": "created_at",
                "sort": "desc"
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    commits = await response.json()
                    logger.info(f"Fetched {len(commits)} commits for project {project_id}")
                    return commits
                else:
                    logger.error(f"Failed to fetch commits for project {project_id}: {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching commits for project {project_id}: {e}")
            return []

    async def fetch_merge_requests(self, project_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch recent merge requests for a project"""
        try:
            url = f"{self.gitlab_base_url}/api/v4/projects/{project_id}/merge_requests"
            params = {
                "per_page": limit,
                "order_by": "updated_at",
                "sort": "desc",
                "state": "opened"
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    mrs = await response.json()
                    logger.info(f"Fetched {len(mrs)} merge requests for project {project_id}")
                    return mrs
                else:
                    logger.error(f"Failed to fetch merge requests for project {project_id}: {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching merge requests for project {project_id}: {e}")
            return []

    async def fetch_issues(self, project_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch recent issues for a project"""
        try:
            url = f"{self.gitlab_base_url}/api/v4/projects/{project_id}/issues"
            params = {
                "per_page": limit,
                "order_by": "updated_at",
                "sort": "desc",
                "state": "opened"
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    issues = await response.json()
                    logger.info(f"Fetched {len(issues)} issues for project {project_id}")
                    return issues
                else:
                    logger.error(f"Failed to fetch issues for project {project_id}: {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching issues for project {project_id}: {e}")
            return []

    async def fetch_container_registry_data(self, project_id: int) -> List[Dict[str, Any]]:
        """Fetch container registry data for a project"""
        try:
            url = f"{self.gitlab_base_url}/api/v4/projects/{project_id}/registry/repositories"
            async with self.session.get(url) as response:
                if response.status == 200:
                    registries = await response.json()
                    logger.info(f"Fetched {len(registries)} container registries for project {project_id}")
                    return registries
                else:
                    logger.error(f"Failed to fetch container registries for project {project_id}: {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching container registries for project {project_id}: {e}")
            return []

    async def fetch_security_reports(self, project_id: int) -> Dict[str, Any]:
        """Fetch security reports (SAST, dependency scanning, etc.) for a project"""
        try:
            # Fetch security reports from the latest pipeline
            pipelines = await self.fetch_pipeline_data(project_id, 1)
            if not pipelines:
                return {}
            
            latest_pipeline = pipelines[0]
            jobs = await self.fetch_job_data(project_id, latest_pipeline['id'])
            
            security_jobs = []
            for job in jobs:
                if any(keyword in job.get('name', '').lower() for keyword in ['sast', 'dependency', 'security', 'scan']):
                    security_jobs.append(job)
            
            return {
                'pipeline_id': latest_pipeline['id'],
                'pipeline_status': latest_pipeline['status'],
                'security_jobs': security_jobs,
                'total_jobs': len(jobs)
            }
        except Exception as e:
            logger.error(f"Error fetching security reports for project {project_id}: {e}")
            return {}

async def main():
    """Main function to demonstrate GitLab integration"""
    # Get GitLab token from environment
    gitlab_token = os.getenv("GITLAB_TOKEN")
    if not gitlab_token:
        print("Please set GITLAB_TOKEN environment variable")
        return
    
    print("🔍 Optimal Platform - GitLab Integration Demo")
    print("=" * 50)
    
    async with GitLabProjectFetcher(gitlab_token) as fetcher:
        # Fetch user's projects
        print("\n📁 Fetching your GitLab projects...")
        projects = await fetcher.fetch_projects(limit=5)
        
        if not projects:
            print("❌ No projects found. Please check your GitLab token and permissions.")
            return
        
        print(f"✅ Found {len(projects)} projects")
        
        # Process each project
        for i, project in enumerate(projects[:3], 1):  # Limit to first 3 projects
            print(f"\n🔧 Project {i}: {project['name']}")
            print(f"   ID: {project['id']}")
            print(f"   URL: {project['web_url']}")
            print(f"   Last Activity: {project.get('last_activity_at', 'Unknown')}")
            print(f"   Visibility: {project.get('visibility', 'Unknown')}")
            
            # Fetch detailed project information
            project_details = await fetcher.fetch_project_details(project['id'])
            if project_details:
                print(f"   Description: {project_details.get('description', 'No description')[:100]}...")
                print(f"   Default Branch: {project_details.get('default_branch', 'Unknown')}")
                print(f"   Star Count: {project_details.get('star_count', 0)}")
                print(f"   Fork Count: {project_details.get('forks_count', 0)}")
            
            # Fetch recent pipelines
            print(f"\n   🚀 Recent Pipelines:")
            pipelines = await fetcher.fetch_pipeline_data(project['id'], limit=3)
            for pipeline in pipelines:
                status_emoji = "✅" if pipeline['status'] == 'success' else "❌" if pipeline['status'] == 'failed' else "🔄"
                print(f"      {status_emoji} {pipeline['status'].upper()} - {pipeline.get('ref', 'Unknown branch')} ({pipeline.get('created_at', 'Unknown date')})")
            
            # Fetch recent commits
            print(f"\n   📝 Recent Commits:")
            commits = await fetcher.fetch_commits(project['id'], limit=3)
            for commit in commits:
                print(f"      • {commit.get('title', 'No title')[:50]}... ({commit.get('author_name', 'Unknown')})")
            
            # Fetch open merge requests
            print(f"\n   🔀 Open Merge Requests:")
            mrs = await fetcher.fetch_merge_requests(project['id'], limit=3)
            for mr in mrs:
                print(f"      • {mr.get('title', 'No title')[:50]}... (by {mr.get('author', {}).get('name', 'Unknown')})")
            
            # Fetch open issues
            print(f"\n   🐛 Open Issues:")
            issues = await fetcher.fetch_issues(project['id'], limit=3)
            for issue in issues:
                print(f"      • {issue.get('title', 'No title')[:50]}... (by {issue.get('author', {}).get('name', 'Unknown')})")
            
            # Fetch security reports
            print(f"\n   🔒 Security Status:")
            security_data = await fetcher.fetch_security_reports(project['id'])
            if security_data:
                print(f"      Pipeline Status: {security_data.get('pipeline_status', 'Unknown')}")
                print(f"      Security Jobs: {len(security_data.get('security_jobs', []))}")
                print(f"      Total Jobs: {security_data.get('total_jobs', 0)}")
            
            # Fetch container registry data
            print(f"\n   📦 Container Registry:")
            registries = await fetcher.fetch_container_registry_data(project['id'])
            if registries:
                print(f"      Found {len(registries)} container repositories")
                for registry in registries[:2]:  # Show first 2
                    print(f"      • {registry.get('name', 'Unknown')} ({registry.get('tags_count', 0)} tags)")
            else:
                print("      No container registries found")
            
            print("   " + "-" * 40)
    
    print(f"\n🎉 GitLab integration demo completed!")
    print(f"📊 Summary: Analyzed {len(projects)} projects with real data from your GitLab account")
    print(f"🔗 This demonstrates how Optimal Platform can provide visibility into your specific environments")

if __name__ == "__main__":
    asyncio.run(main())
