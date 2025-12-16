"""
Optimal Platform - Tenant Management Service

Handles:
- Tenant provisioning and management
- Database creation per tenant
- Keycloak realm/client setup
- API key generation for agents
"""

import os
import secrets
import hashlib
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI, HTTPException, Depends, Header, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================================================
# Configuration
# =============================================================================

PLATFORM_DATABASE_URL = os.getenv("PLATFORM_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/optimal_platform")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_ADMIN_USER = os.getenv("POSTGRES_ADMIN_USER", "postgres")
POSTGRES_ADMIN_PASSWORD = os.getenv("POSTGRES_ADMIN_PASSWORD", "postgres")

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8080")
KEYCLOAK_ADMIN_USER = os.getenv("KEYCLOAK_ADMIN_USER", "admin")
KEYCLOAK_ADMIN_PASSWORD = os.getenv("KEYCLOAK_ADMIN_PASSWORD", "admin")
KEYCLOAK_MASTER_REALM = os.getenv("KEYCLOAK_MASTER_REALM", "master")

TENANT_SCHEMA_PATH = os.getenv("TENANT_SCHEMA_PATH", "/app/schema/tenant_schema.sql")

# =============================================================================
# Models
# =============================================================================

class TenantCreate(BaseModel):
    name: str
    slug: str
    tier: str = "starter"
    admin_email: EmailStr
    admin_name: str


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    tier: Optional[str] = None
    status: Optional[str] = None
    max_agents: Optional[int] = None
    max_users: Optional[int] = None


class TenantResponse(BaseModel):
    id: str
    name: str
    slug: str
    status: str
    tier: str
    keycloak_realm: Optional[str]
    max_agents: int
    max_users: int
    created_at: datetime


class APIKeyCreate(BaseModel):
    name: str
    scopes: List[str] = ["agent:write", "scan:write"]
    expires_days: Optional[int] = 365


class APIKeyResponse(BaseModel):
    id: str
    name: str
    key_prefix: str
    scopes: List[str]
    expires_at: Optional[datetime]
    created_at: datetime
    # Only returned on creation
    api_key: Optional[str] = None


# =============================================================================
# Database
# =============================================================================

class Database:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        self.pool = await asyncpg.create_pool(PLATFORM_DATABASE_URL)
        logger.info("Connected to platform database")

    async def disconnect(self):
        if self.pool:
            await self.pool.close()

    async def execute(self, query: str, *args):
        async with self.pool.acquire() as conn:
            return await conn.execute(query, *args)

    async def fetch(self, query: str, *args):
        async with self.pool.acquire() as conn:
            return await conn.fetch(query, *args)

    async def fetchrow(self, query: str, *args):
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(query, *args)

    async def fetchval(self, query: str, *args):
        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, *args)


db = Database()


# =============================================================================
# Keycloak Client
# =============================================================================

class KeycloakClient:
    def __init__(self):
        self.base_url = KEYCLOAK_URL
        self.admin_user = KEYCLOAK_ADMIN_USER
        self.admin_password = KEYCLOAK_ADMIN_PASSWORD
        self._token: Optional[str] = None
        self._token_expires: Optional[datetime] = None

    async def get_admin_token(self) -> str:
        """Get admin access token from Keycloak"""
        if self._token and self._token_expires and datetime.utcnow() < self._token_expires:
            return self._token

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/realms/{KEYCLOAK_MASTER_REALM}/protocol/openid-connect/token",
                data={
                    "grant_type": "password",
                    "client_id": "admin-cli",
                    "username": self.admin_user,
                    "password": self.admin_password,
                },
            )
            response.raise_for_status()
            data = response.json()
            self._token = data["access_token"]
            self._token_expires = datetime.utcnow() + timedelta(seconds=data["expires_in"] - 60)
            return self._token

    async def create_realm(self, realm_name: str, display_name: str) -> bool:
        """Create a new Keycloak realm for a tenant"""
        token = await self.get_admin_token()

        realm_config = {
            "realm": realm_name,
            "displayName": display_name,
            "enabled": True,
            "sslRequired": "external",
            "registrationAllowed": False,
            "loginWithEmailAllowed": True,
            "duplicateEmailsAllowed": False,
            "resetPasswordAllowed": True,
            "editUsernameAllowed": False,
            "bruteForceProtected": True,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/admin/realms",
                json=realm_config,
                headers={"Authorization": f"Bearer {token}"},
            )

            if response.status_code == 201:
                logger.info(f"Created Keycloak realm: {realm_name}")
                return True
            elif response.status_code == 409:
                logger.warning(f"Realm {realm_name} already exists")
                return True
            else:
                logger.error(f"Failed to create realm: {response.text}")
                return False

    async def create_client(self, realm_name: str, client_id: str, redirect_uris: List[str]) -> Optional[str]:
        """Create an OIDC client in a realm"""
        token = await self.get_admin_token()

        client_config = {
            "clientId": client_id,
            "name": f"{client_id} Portal",
            "enabled": True,
            "publicClient": True,
            "standardFlowEnabled": True,
            "implicitFlowEnabled": False,
            "directAccessGrantsEnabled": False,
            "redirectUris": redirect_uris,
            "webOrigins": ["*"],
            "protocol": "openid-connect",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/admin/realms/{realm_name}/clients",
                json=client_config,
                headers={"Authorization": f"Bearer {token}"},
            )

            if response.status_code == 201:
                # Get client ID from location header
                location = response.headers.get("location", "")
                client_uuid = location.split("/")[-1]
                logger.info(f"Created Keycloak client: {client_id}")
                return client_uuid
            else:
                logger.error(f"Failed to create client: {response.text}")
                return None

    async def create_user(self, realm_name: str, email: str, name: str, temporary_password: str) -> Optional[str]:
        """Create a user in a realm"""
        token = await self.get_admin_token()

        names = name.split(" ", 1)
        first_name = names[0]
        last_name = names[1] if len(names) > 1 else ""

        user_config = {
            "username": email,
            "email": email,
            "emailVerified": True,
            "enabled": True,
            "firstName": first_name,
            "lastName": last_name,
            "credentials": [{
                "type": "password",
                "value": temporary_password,
                "temporary": True,
            }],
            "realmRoles": ["admin"],
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/admin/realms/{realm_name}/users",
                json=user_config,
                headers={"Authorization": f"Bearer {token}"},
            )

            if response.status_code == 201:
                location = response.headers.get("location", "")
                user_id = location.split("/")[-1]
                logger.info(f"Created Keycloak user: {email}")
                return user_id
            else:
                logger.error(f"Failed to create user: {response.text}")
                return None

    async def configure_identity_provider(
        self,
        realm_name: str,
        provider_type: str,  # oidc, saml
        provider_alias: str,
        config: Dict[str, Any],
    ) -> bool:
        """Configure an external Identity Provider for a tenant"""
        token = await self.get_admin_token()

        idp_config = {
            "alias": provider_alias,
            "displayName": config.get("display_name", provider_alias),
            "providerId": provider_type,
            "enabled": True,
            "trustEmail": True,
            "storeToken": False,
            "addReadTokenRoleOnCreate": False,
            "firstBrokerLoginFlowAlias": "first broker login",
            "config": config,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/admin/realms/{realm_name}/identity-provider/instances",
                json=idp_config,
                headers={"Authorization": f"Bearer {token}"},
            )

            if response.status_code == 201:
                logger.info(f"Configured IDP {provider_alias} for realm {realm_name}")
                return True
            else:
                logger.error(f"Failed to configure IDP: {response.text}")
                return False


keycloak = KeycloakClient()


# =============================================================================
# Tenant Provisioning
# =============================================================================

async def provision_tenant_database(tenant_slug: str) -> Dict[str, str]:
    """Create a new database for a tenant"""
    db_name = f"tenant_{tenant_slug.replace('-', '_')}"
    db_user = f"tenant_{tenant_slug.replace('-', '_')}"
    db_password = secrets.token_urlsafe(32)

    # Connect to postgres as admin to create database
    admin_conn = await asyncpg.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        user=POSTGRES_ADMIN_USER,
        password=POSTGRES_ADMIN_PASSWORD,
        database="postgres",
    )

    try:
        # Create user and database
        await admin_conn.execute(f"CREATE USER {db_user} WITH PASSWORD '{db_password}'")
        await admin_conn.execute(f"CREATE DATABASE {db_name} OWNER {db_user}")
        logger.info(f"Created database {db_name} for tenant {tenant_slug}")
    except asyncpg.DuplicateObjectError:
        logger.warning(f"Database {db_name} already exists")
    finally:
        await admin_conn.close()

    # Connect to new database and apply schema
    tenant_conn = await asyncpg.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        user=POSTGRES_ADMIN_USER,
        password=POSTGRES_ADMIN_PASSWORD,
        database=db_name,
    )

    try:
        # Read and execute tenant schema
        if os.path.exists(TENANT_SCHEMA_PATH):
            with open(TENANT_SCHEMA_PATH, "r") as f:
                schema_sql = f.read()
            await tenant_conn.execute(schema_sql)
            logger.info(f"Applied tenant schema to {db_name}")
        else:
            logger.warning(f"Tenant schema not found at {TENANT_SCHEMA_PATH}")

        # Grant privileges
        await tenant_conn.execute(f"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA agents TO {db_user}")
        await tenant_conn.execute(f"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA scans TO {db_user}")
        await tenant_conn.execute(f"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA vulns TO {db_user}")
        await tenant_conn.execute(f"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA sbom TO {db_user}")
        await tenant_conn.execute(f"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA compliance TO {db_user}")
        await tenant_conn.execute(f"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA integrations TO {db_user}")
        await tenant_conn.execute(f"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA assets TO {db_user}")
        await tenant_conn.execute(f"GRANT USAGE ON ALL SEQUENCES IN SCHEMA agents TO {db_user}")
        await tenant_conn.execute(f"GRANT USAGE ON ALL SEQUENCES IN SCHEMA scans TO {db_user}")
        await tenant_conn.execute(f"GRANT USAGE ON ALL SEQUENCES IN SCHEMA vulns TO {db_user}")
        await tenant_conn.execute(f"GRANT USAGE ON ALL SEQUENCES IN SCHEMA sbom TO {db_user}")
        await tenant_conn.execute(f"GRANT USAGE ON ALL SEQUENCES IN SCHEMA compliance TO {db_user}")
        await tenant_conn.execute(f"GRANT USAGE ON ALL SEQUENCES IN SCHEMA integrations TO {db_user}")
        await tenant_conn.execute(f"GRANT USAGE ON ALL SEQUENCES IN SCHEMA assets TO {db_user}")
    finally:
        await tenant_conn.close()

    return {
        "host": POSTGRES_HOST,
        "port": str(POSTGRES_PORT),
        "database": db_name,
        "user": db_user,
        "password": db_password,
    }


def generate_api_key() -> tuple[str, str, str]:
    """Generate an API key and return (full_key, prefix, hash)"""
    key = f"opt_{secrets.token_urlsafe(32)}"
    prefix = key[:10]
    key_hash = hashlib.sha256(key.encode()).hexdigest()
    return key, prefix, key_hash


def encrypt_password(password: str) -> bytes:
    """Encrypt a password (simplified - use proper encryption in production)"""
    # In production, use proper encryption with a KMS
    return password.encode()


def decrypt_password(encrypted: bytes) -> str:
    """Decrypt a password"""
    return encrypted.decode()


# =============================================================================
# FastAPI App
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    yield
    await db.disconnect()


app = FastAPI(
    title="Optimal Platform - Tenant Service",
    version="1.0.0",
    description="Multi-tenant management and provisioning",
    lifespan=lifespan,
)

security = HTTPBearer()


# =============================================================================
# API Routes
# =============================================================================

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "tenant-service"}


@app.post("/api/tenants", response_model=TenantResponse)
async def create_tenant(tenant: TenantCreate, background_tasks: BackgroundTasks):
    """Create a new tenant with database and Keycloak realm"""

    # Validate slug
    if not tenant.slug.replace("-", "").isalnum():
        raise HTTPException(400, "Slug must be alphanumeric with hyphens only")

    # Check if slug exists
    existing = await db.fetchval(
        "SELECT id FROM platform.tenants WHERE slug = $1",
        tenant.slug
    )
    if existing:
        raise HTTPException(400, "Tenant slug already exists")

    try:
        # Provision database
        db_info = await provision_tenant_database(tenant.slug)

        # Create Keycloak realm
        realm_name = f"optimal-{tenant.slug}"
        await keycloak.create_realm(realm_name, tenant.name)

        # Create Keycloak client
        client_id = f"optimal-{tenant.slug}-portal"
        await keycloak.create_client(
            realm_name,
            client_id,
            redirect_uris=[f"https://{tenant.slug}.optimal.io/*", "http://localhost:3000/*"],
        )

        # Create admin user
        temp_password = secrets.token_urlsafe(16)
        await keycloak.create_user(realm_name, tenant.admin_email, tenant.admin_name, temp_password)

        # Store tenant in platform database
        tenant_id = await db.fetchval(
            """
            INSERT INTO platform.tenants (
                name, slug, tier, keycloak_realm, keycloak_client_id,
                database_host, database_port, database_name, database_user,
                database_password_encrypted
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
            """,
            tenant.name,
            tenant.slug,
            tenant.tier,
            realm_name,
            client_id,
            db_info["host"],
            int(db_info["port"]),
            db_info["database"],
            db_info["user"],
            encrypt_password(db_info["password"]),
        )

        # Add admin to tenant_users
        await db.execute(
            """
            INSERT INTO platform.tenant_users (tenant_id, keycloak_user_id, email, name, role)
            VALUES ($1, $2, $3, $4, 'admin')
            """,
            tenant_id,
            tenant.admin_email,  # Will be updated with actual Keycloak ID on first login
            tenant.admin_email,
            tenant.admin_name,
        )

        # Log audit
        await db.execute(
            """
            INSERT INTO platform.audit_log (tenant_id, action, resource_type, resource_id, details)
            VALUES ($1, 'tenant_created', 'tenant', $2, $3)
            """,
            tenant_id,
            str(tenant_id),
            {"admin_email": tenant.admin_email},
        )

        logger.info(f"Created tenant: {tenant.slug} (ID: {tenant_id})")

        return TenantResponse(
            id=str(tenant_id),
            name=tenant.name,
            slug=tenant.slug,
            status="active",
            tier=tenant.tier,
            keycloak_realm=realm_name,
            max_agents=10,
            max_users=5,
            created_at=datetime.utcnow(),
        )

    except Exception as e:
        logger.error(f"Failed to create tenant: {e}")
        raise HTTPException(500, f"Failed to create tenant: {str(e)}")


@app.get("/api/tenants", response_model=List[TenantResponse])
async def list_tenants(status: Optional[str] = None):
    """List all tenants"""
    query = """
        SELECT id, name, slug, status, tier, keycloak_realm, max_agents, max_users, created_at
        FROM platform.tenants
        WHERE deleted_at IS NULL
    """
    if status:
        query += f" AND status = '{status}'"
    query += " ORDER BY created_at DESC"

    rows = await db.fetch(query)
    return [
        TenantResponse(
            id=str(row["id"]),
            name=row["name"],
            slug=row["slug"],
            status=row["status"],
            tier=row["tier"],
            keycloak_realm=row["keycloak_realm"],
            max_agents=row["max_agents"],
            max_users=row["max_users"],
            created_at=row["created_at"],
        )
        for row in rows
    ]


@app.get("/api/tenants/{tenant_id}", response_model=TenantResponse)
async def get_tenant(tenant_id: str):
    """Get tenant details"""
    row = await db.fetchrow(
        """
        SELECT id, name, slug, status, tier, keycloak_realm, max_agents, max_users, created_at
        FROM platform.tenants
        WHERE id = $1 AND deleted_at IS NULL
        """,
        tenant_id,
    )
    if not row:
        raise HTTPException(404, "Tenant not found")

    return TenantResponse(
        id=str(row["id"]),
        name=row["name"],
        slug=row["slug"],
        status=row["status"],
        tier=row["tier"],
        keycloak_realm=row["keycloak_realm"],
        max_agents=row["max_agents"],
        max_users=row["max_users"],
        created_at=row["created_at"],
    )


@app.patch("/api/tenants/{tenant_id}", response_model=TenantResponse)
async def update_tenant(tenant_id: str, update: TenantUpdate):
    """Update tenant settings"""
    updates = []
    values = []
    idx = 1

    if update.name is not None:
        updates.append(f"name = ${idx}")
        values.append(update.name)
        idx += 1
    if update.tier is not None:
        updates.append(f"tier = ${idx}")
        values.append(update.tier)
        idx += 1
    if update.status is not None:
        updates.append(f"status = ${idx}")
        values.append(update.status)
        idx += 1
    if update.max_agents is not None:
        updates.append(f"max_agents = ${idx}")
        values.append(update.max_agents)
        idx += 1
    if update.max_users is not None:
        updates.append(f"max_users = ${idx}")
        values.append(update.max_users)
        idx += 1

    if not updates:
        raise HTTPException(400, "No updates provided")

    values.append(tenant_id)
    query = f"""
        UPDATE platform.tenants
        SET {', '.join(updates)}, updated_at = NOW()
        WHERE id = ${idx}
        RETURNING id, name, slug, status, tier, keycloak_realm, max_agents, max_users, created_at
    """

    row = await db.fetchrow(query, *values)
    if not row:
        raise HTTPException(404, "Tenant not found")

    return TenantResponse(
        id=str(row["id"]),
        name=row["name"],
        slug=row["slug"],
        status=row["status"],
        tier=row["tier"],
        keycloak_realm=row["keycloak_realm"],
        max_agents=row["max_agents"],
        max_users=row["max_users"],
        created_at=row["created_at"],
    )


# =============================================================================
# API Keys
# =============================================================================

@app.post("/api/tenants/{tenant_id}/api-keys", response_model=APIKeyResponse)
async def create_api_key(tenant_id: str, key_request: APIKeyCreate):
    """Create an API key for a tenant (used by agents)"""

    # Verify tenant exists
    tenant = await db.fetchrow(
        "SELECT id, max_agents FROM platform.tenants WHERE id = $1 AND status = 'active'",
        tenant_id,
    )
    if not tenant:
        raise HTTPException(404, "Tenant not found or inactive")

    # Generate API key
    api_key, prefix, key_hash = generate_api_key()

    # Calculate expiry
    expires_at = None
    if key_request.expires_days:
        expires_at = datetime.utcnow() + timedelta(days=key_request.expires_days)

    # Store key
    key_id = await db.fetchval(
        """
        INSERT INTO platform.tenant_api_keys (tenant_id, name, key_hash, key_prefix, scopes, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
        """,
        tenant_id,
        key_request.name,
        key_hash,
        prefix,
        key_request.scopes,
        expires_at,
    )

    logger.info(f"Created API key for tenant {tenant_id}: {prefix}...")

    return APIKeyResponse(
        id=str(key_id),
        name=key_request.name,
        key_prefix=prefix,
        scopes=key_request.scopes,
        expires_at=expires_at,
        created_at=datetime.utcnow(),
        api_key=api_key,  # Only returned on creation!
    )


@app.get("/api/tenants/{tenant_id}/api-keys", response_model=List[APIKeyResponse])
async def list_api_keys(tenant_id: str):
    """List API keys for a tenant"""
    rows = await db.fetch(
        """
        SELECT id, name, key_prefix, scopes, expires_at, created_at
        FROM platform.tenant_api_keys
        WHERE tenant_id = $1 AND revoked_at IS NULL
        ORDER BY created_at DESC
        """,
        tenant_id,
    )

    return [
        APIKeyResponse(
            id=str(row["id"]),
            name=row["name"],
            key_prefix=row["key_prefix"],
            scopes=row["scopes"],
            expires_at=row["expires_at"],
            created_at=row["created_at"],
        )
        for row in rows
    ]


@app.delete("/api/tenants/{tenant_id}/api-keys/{key_id}")
async def revoke_api_key(tenant_id: str, key_id: str):
    """Revoke an API key"""
    result = await db.execute(
        """
        UPDATE platform.tenant_api_keys
        SET revoked_at = NOW()
        WHERE id = $1 AND tenant_id = $2 AND revoked_at IS NULL
        """,
        key_id,
        tenant_id,
    )

    if result == "UPDATE 0":
        raise HTTPException(404, "API key not found")

    return {"status": "revoked"}


@app.post("/api/auth/validate-key")
async def validate_api_key(x_api_key: str = Header(...)):
    """Validate an API key and return tenant info"""
    key_hash = hashlib.sha256(x_api_key.encode()).hexdigest()

    row = await db.fetchrow(
        """
        SELECT k.tenant_id, k.scopes, k.expires_at, t.slug, t.database_name, t.database_host,
               t.database_port, t.database_user, t.database_password_encrypted
        FROM platform.tenant_api_keys k
        JOIN platform.tenants t ON k.tenant_id = t.id
        WHERE k.key_hash = $1 AND k.revoked_at IS NULL AND t.status = 'active'
        """,
        key_hash,
    )

    if not row:
        raise HTTPException(401, "Invalid API key")

    if row["expires_at"] and row["expires_at"] < datetime.utcnow():
        raise HTTPException(401, "API key expired")

    # Update last used
    await db.execute(
        "UPDATE platform.tenant_api_keys SET last_used_at = NOW() WHERE key_hash = $1",
        key_hash,
    )

    return {
        "tenant_id": str(row["tenant_id"]),
        "tenant_slug": row["slug"],
        "scopes": row["scopes"],
        "database": {
            "host": row["database_host"],
            "port": row["database_port"],
            "name": row["database_name"],
            "user": row["database_user"],
            "password": decrypt_password(row["database_password_encrypted"]),
        },
    }


# =============================================================================
# Main
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
