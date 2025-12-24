"""
Optimal Platform - Agent OAuth Authentication
OAuth 2.0 Client Credentials flow for agent authentication.

Provides:
- Token acquisition using client credentials
- Automatic token refresh before expiry
- Token caching and management
- Fallback for demo/development mode
"""

import asyncio
import logging
import os
import time
from dataclasses import dataclass
from typing import Optional

import aiohttp

logger = logging.getLogger("optimal.agent.auth")


@dataclass
class OAuthConfig:
    """OAuth configuration for agent authentication"""
    client_id: str = ""
    client_secret: str = ""
    token_endpoint: str = ""
    scopes: str = "agent:read agent:write scan:submit"

    # Token refresh buffer (seconds before expiry to refresh)
    refresh_buffer: int = 30

    @classmethod
    def from_env(cls) -> "OAuthConfig":
        """Load OAuth configuration from environment variables"""
        api_url = os.getenv("OPTIMAL_API_URL", os.getenv("API_GATEWAY_URL", "http://localhost:3000"))

        return cls(
            client_id=os.getenv("OPTIMAL_CLIENT_ID", os.getenv("AGENT_CLIENT_ID", "")),
            client_secret=os.getenv("OPTIMAL_CLIENT_SECRET", os.getenv("AGENT_CLIENT_SECRET", "")),
            token_endpoint=os.getenv("OPTIMAL_TOKEN_ENDPOINT", f"{api_url.rstrip('/')}/api/auth/agent/token"),
            scopes=os.getenv("OPTIMAL_SCOPES", "agent:read agent:write scan:submit"),
            refresh_buffer=int(os.getenv("OPTIMAL_TOKEN_REFRESH_BUFFER", "30")),
        )

    @property
    def is_configured(self) -> bool:
        """Check if OAuth credentials are configured"""
        return bool(self.client_id and self.client_secret)


@dataclass
class TokenInfo:
    """OAuth token information"""
    access_token: str
    token_type: str
    expires_in: int
    expires_at: float  # Unix timestamp
    scopes: str = ""

    @property
    def is_expired(self) -> bool:
        """Check if token is expired"""
        return time.time() >= self.expires_at

    @property
    def should_refresh(self) -> bool:
        """Check if token should be refreshed (within buffer of expiry)"""
        return time.time() >= (self.expires_at - 30)  # 30 second buffer

    @property
    def time_until_expiry(self) -> float:
        """Seconds until token expires"""
        return max(0, self.expires_at - time.time())


class OAuthTokenManager:
    """
    Manages OAuth tokens for agent authentication.

    Handles:
    - Token acquisition via client credentials grant
    - Automatic token refresh before expiry
    - Thread-safe token access
    - Error handling and retry logic
    """

    def __init__(self, config: OAuthConfig = None, verify_ssl: bool = True):
        self.config = config or OAuthConfig.from_env()
        self.verify_ssl = verify_ssl
        self._token: Optional[TokenInfo] = None
        self._lock = asyncio.Lock()
        self._session: Optional[aiohttp.ClientSession] = None

        logger.info(f"OAuth token manager initialized")
        logger.info(f"Client ID: {self.config.client_id[:20]}..." if self.config.client_id else "Client ID: Not configured")
        logger.info(f"Token endpoint: {self.config.token_endpoint}")

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session for token requests"""
        if self._session is None or self._session.closed:
            connector = aiohttp.TCPConnector(ssl=self.verify_ssl)
            self._session = aiohttp.ClientSession(
                connector=connector,
                timeout=aiohttp.ClientTimeout(total=10)
            )
        return self._session

    async def close(self):
        """Close the HTTP session"""
        if self._session and not self._session.closed:
            await self._session.close()

    async def get_token(self) -> Optional[str]:
        """
        Get a valid access token, refreshing if necessary.

        Returns:
            Access token string, or None if unable to obtain token
        """
        async with self._lock:
            # Check if we have a valid token
            if self._token and not self._token.should_refresh:
                return self._token.access_token

            # Need to refresh or acquire new token
            logger.info("Acquiring new OAuth token...")
            token_info = await self._fetch_token()

            if token_info:
                self._token = token_info
                logger.info(f"Token acquired, expires in {token_info.expires_in}s")
                return token_info.access_token

            # If refresh failed but we have an unexpired token, use it
            if self._token and not self._token.is_expired:
                logger.warning("Token refresh failed, using existing token")
                return self._token.access_token

            logger.error("Failed to acquire valid token")
            return None

    async def _fetch_token(self) -> Optional[TokenInfo]:
        """
        Fetch a new token from the token endpoint.

        Uses OAuth 2.0 Client Credentials Grant.
        """
        if not self.config.is_configured:
            logger.warning("OAuth not configured, skipping token fetch")
            return None

        try:
            session = await self._get_session()

            # Prepare request (form-urlencoded per OAuth spec)
            data = {
                "grant_type": "client_credentials",
                "client_id": self.config.client_id,
                "client_secret": self.config.client_secret,
            }

            if self.config.scopes:
                data["scope"] = self.config.scopes

            async with session.post(
                self.config.token_endpoint,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()

                    expires_in = result.get("expires_in", 300)

                    return TokenInfo(
                        access_token=result["access_token"],
                        token_type=result.get("token_type", "Bearer"),
                        expires_in=expires_in,
                        expires_at=time.time() + expires_in - self.config.refresh_buffer,
                        scopes=result.get("scope", ""),
                    )
                elif resp.status == 401:
                    text = await resp.text()
                    logger.error(f"Authentication failed (401): {text}")
                else:
                    text = await resp.text()
                    logger.error(f"Token request failed ({resp.status}): {text}")

        except aiohttp.ClientError as e:
            logger.error(f"Connection error during token fetch: {e}")
        except Exception as e:
            logger.error(f"Unexpected error during token fetch: {e}")

        return None

    async def invalidate(self):
        """Invalidate the current token, forcing refresh on next access"""
        async with self._lock:
            self._token = None
            logger.info("Token invalidated")

    @property
    def has_valid_token(self) -> bool:
        """Check if we have a valid, non-expired token"""
        return self._token is not None and not self._token.is_expired

    @property
    def token_info(self) -> Optional[TokenInfo]:
        """Get current token info (may be expired)"""
        return self._token


class DemoTokenProvider:
    """
    Provides demo tokens for development/testing.

    Used when OAuth is not configured or platform is in demo mode.
    """

    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self._token: Optional[str] = None

    async def get_token(self) -> str:
        """Get a demo token"""
        if not self._token:
            # Generate a demo token (not cryptographically secure)
            import base64
            import json

            header = base64.urlsafe_b64encode(
                json.dumps({"alg": "none", "typ": "JWT"}).encode()
            ).decode().rstrip("=")

            payload = base64.urlsafe_b64encode(
                json.dumps({
                    "sub": self.agent_id,
                    "type": "demo",
                    "iat": int(time.time()),
                    "exp": int(time.time()) + 86400,  # 24 hours
                }).encode()
            ).decode().rstrip("=")

            self._token = f"{header}.{payload}."

        return self._token

    @property
    def has_valid_token(self) -> bool:
        """Demo tokens are always valid"""
        return True


def create_token_manager(
    config: OAuthConfig = None,
    agent_id: str = None,
    verify_ssl: bool = True
) -> OAuthTokenManager:
    """
    Factory function to create the appropriate token manager.

    Returns OAuth manager if configured, otherwise raises an error.
    """
    oauth_config = config or OAuthConfig.from_env()

    if not oauth_config.is_configured:
        # Check for legacy API token
        legacy_token = os.getenv("OPTIMAL_API_TOKEN", os.getenv("AGENT_TOKEN", ""))
        if legacy_token:
            logger.info("Using legacy API token (consider migrating to OAuth)")
            # Return None to signal legacy mode
            return None

        logger.warning("OAuth not configured - agent will operate in demo mode")

    return OAuthTokenManager(oauth_config, verify_ssl)
