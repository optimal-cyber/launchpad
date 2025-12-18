"""
HuggingFace Hub Client for AI Model Discovery
Provides integration with HuggingFace Hub API for model search, retrieval, and security analysis
"""

import os
import httpx
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
import asyncio
import logging

logger = logging.getLogger(__name__)

# Environment configuration
HF_API_BASE = os.getenv("HUGGINGFACE_HUB_URL", "https://huggingface.co")
HF_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN", "")

# Default endpoints for local model discovery
DEFAULT_LOCAL_ENDPOINTS = [
    "http://localhost:11434",  # Ollama
    "http://localhost:8000",   # vLLM / FastAPI
    "http://localhost:8501",   # TensorFlow Serving
    "http://localhost:8080",   # Triton Inference Server
]


class HuggingFaceModelInfo(BaseModel):
    """HuggingFace model information from API"""
    model_id: str
    author: str
    sha: Optional[str] = None
    last_modified: Optional[datetime] = None
    private: bool = False
    downloads: int = 0
    likes: int = 0
    tags: List[str] = []
    pipeline_tag: Optional[str] = None
    library: Optional[str] = None
    license: Optional[str] = None
    model_card: Optional[str] = None
    security_scan: Optional[Dict[str, Any]] = None


class ModelFileAnalysis(BaseModel):
    """Security analysis of model files"""
    has_pickle: bool = False
    has_potential_issues: bool = False
    issues: List[str] = []
    scanned_files: List[str] = []
    safe_tensors_available: bool = False


class HuggingFaceClient:
    """
    Async client for HuggingFace Hub API
    Supports model search, retrieval, and basic security analysis
    """

    def __init__(self, api_token: Optional[str] = None, base_url: Optional[str] = None):
        self.api_token = api_token or HF_API_TOKEN
        self.base_url = base_url or HF_API_BASE
        self.headers = {}
        if self.api_token:
            self.headers["Authorization"] = f"Bearer {self.api_token}"

    async def search_models(
        self,
        query: Optional[str] = None,
        author: Optional[str] = None,
        task: Optional[str] = None,
        library: Optional[str] = None,
        sort: str = "downloads",
        direction: str = "-1",
        limit: int = 20
    ) -> List[HuggingFaceModelInfo]:
        """
        Search for models on HuggingFace Hub

        Args:
            query: Search query string
            author: Filter by author/organization
            task: Filter by task (text-generation, text-classification, etc.)
            library: Filter by library (transformers, pytorch, etc.)
            sort: Sort field (downloads, likes, lastModified)
            direction: Sort direction (1 for asc, -1 for desc)
            limit: Maximum number of results

        Returns:
            List of HuggingFaceModelInfo objects
        """
        params = {
            "sort": sort,
            "direction": direction,
            "limit": str(limit)
        }

        if query:
            params["search"] = query
        if author:
            params["author"] = author
        if task:
            params["pipeline_tag"] = task
        if library:
            params["library"] = library

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/models",
                    params=params,
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()

                models_data = response.json()
                models = []

                for model_data in models_data:
                    model_id = model_data.get("id", model_data.get("modelId", ""))
                    author = model_id.split("/")[0] if "/" in model_id else "unknown"

                    model = HuggingFaceModelInfo(
                        model_id=model_id,
                        author=author,
                        sha=model_data.get("sha"),
                        last_modified=model_data.get("lastModified"),
                        private=model_data.get("private", False),
                        downloads=model_data.get("downloads", 0),
                        likes=model_data.get("likes", 0),
                        tags=model_data.get("tags", []),
                        pipeline_tag=model_data.get("pipeline_tag"),
                        library=model_data.get("library_name"),
                        license=model_data.get("license")
                    )
                    models.append(model)

                return models

            except httpx.HTTPStatusError as e:
                logger.error(f"HuggingFace API error: {e.response.status_code}")
                raise
            except httpx.RequestError as e:
                logger.error(f"HuggingFace request error: {e}")
                raise

    async def get_model_details(self, model_id: str) -> HuggingFaceModelInfo:
        """
        Get detailed information about a specific model

        Args:
            model_id: Full model ID (e.g., "meta-llama/Llama-2-7b-chat-hf")

        Returns:
            HuggingFaceModelInfo with detailed information
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/models/{model_id}",
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()

                data = response.json()
                author = model_id.split("/")[0] if "/" in model_id else "unknown"

                return HuggingFaceModelInfo(
                    model_id=model_id,
                    author=author,
                    sha=data.get("sha"),
                    last_modified=data.get("lastModified"),
                    private=data.get("private", False),
                    downloads=data.get("downloads", 0),
                    likes=data.get("likes", 0),
                    tags=data.get("tags", []),
                    pipeline_tag=data.get("pipeline_tag"),
                    library=data.get("library_name"),
                    license=data.get("cardData", {}).get("license") or data.get("license")
                )

            except httpx.HTTPStatusError as e:
                logger.error(f"HuggingFace API error for model {model_id}: {e.response.status_code}")
                raise
            except httpx.RequestError as e:
                logger.error(f"HuggingFace request error for model {model_id}: {e}")
                raise

    async def get_model_card(self, model_id: str) -> Optional[str]:
        """
        Get the model card (README) content for a model

        Args:
            model_id: Full model ID

        Returns:
            Model card content as string, or None if not found
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/{model_id}/raw/main/README.md",
                    headers=self.headers,
                    timeout=30.0
                )
                if response.status_code == 200:
                    return response.text
                return None

            except httpx.RequestError as e:
                logger.warning(f"Could not fetch model card for {model_id}: {e}")
                return None

    async def analyze_model_files(self, model_id: str) -> ModelFileAnalysis:
        """
        Analyze model files for potential security issues
        Checks for pickle files, unsafe serialization, etc.

        Args:
            model_id: Full model ID

        Returns:
            ModelFileAnalysis with security findings
        """
        analysis = ModelFileAnalysis()

        async with httpx.AsyncClient() as client:
            try:
                # Get file listing
                response = await client.get(
                    f"{self.base_url}/api/models/{model_id}/tree/main",
                    headers=self.headers,
                    timeout=30.0
                )

                if response.status_code != 200:
                    analysis.issues.append("Could not access model repository")
                    return analysis

                files = response.json()

                for file_info in files:
                    filename = file_info.get("path", "")
                    analysis.scanned_files.append(filename)

                    # Check for pickle files (potential security risk)
                    if filename.endswith((".pkl", ".pickle", ".bin")):
                        analysis.has_pickle = True
                        if not analysis.has_potential_issues:
                            analysis.issues.append(
                                f"Model contains serialized files ({filename}) which may pose security risks"
                            )
                            analysis.has_potential_issues = True

                    # Check for safetensors (safer format)
                    if filename.endswith(".safetensors"):
                        analysis.safe_tensors_available = True

                # Add recommendation if only pickle available
                if analysis.has_pickle and not analysis.safe_tensors_available:
                    analysis.issues.append(
                        "Model does not provide safetensors format. Consider using models with safetensors for enhanced security."
                    )

                return analysis

            except httpx.RequestError as e:
                logger.warning(f"Could not analyze files for {model_id}: {e}")
                analysis.issues.append(f"File analysis failed: {str(e)}")
                return analysis


class LocalModelDiscovery:
    """
    Discover locally running AI model endpoints
    Supports Ollama, vLLM, TensorFlow Serving, Triton, etc.
    """

    def __init__(self, endpoints: Optional[List[str]] = None):
        self.endpoints = endpoints or DEFAULT_LOCAL_ENDPOINTS

    async def discover_ollama_models(self, endpoint: str) -> List[Dict[str, Any]]:
        """Discover models from Ollama endpoint"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{endpoint}/api/tags",
                    timeout=5.0
                )
                if response.status_code == 200:
                    data = response.json()
                    return [
                        {
                            "name": model.get("name", "unknown"),
                            "source": "ollama",
                            "endpoint": endpoint,
                            "size": model.get("size"),
                            "modified_at": model.get("modified_at"),
                            "digest": model.get("digest")
                        }
                        for model in data.get("models", [])
                    ]
            except Exception as e:
                logger.debug(f"Ollama not available at {endpoint}: {e}")
        return []

    async def discover_vllm_models(self, endpoint: str) -> List[Dict[str, Any]]:
        """Discover models from vLLM/OpenAI-compatible endpoint"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{endpoint}/v1/models",
                    timeout=5.0
                )
                if response.status_code == 200:
                    data = response.json()
                    return [
                        {
                            "name": model.get("id", "unknown"),
                            "source": "vllm",
                            "endpoint": endpoint,
                            "created": model.get("created"),
                            "owned_by": model.get("owned_by")
                        }
                        for model in data.get("data", [])
                    ]
            except Exception as e:
                logger.debug(f"vLLM not available at {endpoint}: {e}")
        return []

    async def discover_triton_models(self, endpoint: str) -> List[Dict[str, Any]]:
        """Discover models from Triton Inference Server"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{endpoint}/v2/models",
                    timeout=5.0
                )
                if response.status_code == 200:
                    data = response.json()
                    return [
                        {
                            "name": model.get("name", "unknown"),
                            "source": "triton",
                            "endpoint": endpoint,
                            "version": model.get("version"),
                            "state": model.get("state")
                        }
                        for model in data.get("models", [])
                    ]
            except Exception as e:
                logger.debug(f"Triton not available at {endpoint}: {e}")
        return []

    async def discover_all(self) -> List[Dict[str, Any]]:
        """
        Discover all models from configured endpoints

        Returns:
            List of discovered models with source and endpoint info
        """
        all_models = []

        discovery_tasks = []
        for endpoint in self.endpoints:
            # Try each discovery method for each endpoint
            discovery_tasks.extend([
                self.discover_ollama_models(endpoint),
                self.discover_vllm_models(endpoint),
                self.discover_triton_models(endpoint)
            ])

        results = await asyncio.gather(*discovery_tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, list):
                all_models.extend(result)

        return all_models


# Singleton instance for reuse
_hf_client: Optional[HuggingFaceClient] = None


def get_huggingface_client() -> HuggingFaceClient:
    """Get or create HuggingFace client singleton"""
    global _hf_client
    if _hf_client is None:
        _hf_client = HuggingFaceClient()
    return _hf_client


def get_local_discovery(endpoints: Optional[List[str]] = None) -> LocalModelDiscovery:
    """Create LocalModelDiscovery instance"""
    return LocalModelDiscovery(endpoints)
