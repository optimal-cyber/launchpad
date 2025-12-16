-- =============================================================================
-- Optimal Platform - Master Platform Database Schema
-- =============================================================================
-- This database stores platform-wide data: tenants, billing, etc.
-- Each tenant gets their own isolated database.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TENANT MANAGEMENT
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS platform;

-- Tenants table - each tenant gets their own database
CREATE TABLE platform.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(63) NOT NULL UNIQUE,  -- Used for database name, subdomain
    status VARCHAR(50) DEFAULT 'active',  -- active, suspended, pending, deleted
    tier VARCHAR(50) DEFAULT 'starter',   -- starter, professional, enterprise

    -- Keycloak integration
    keycloak_realm VARCHAR(255),
    keycloak_client_id VARCHAR(255),

    -- Database connection (dynamically provisioned)
    database_host VARCHAR(255),
    database_port INTEGER DEFAULT 5432,
    database_name VARCHAR(255),
    database_user VARCHAR(255),
    database_password_encrypted BYTEA,  -- Encrypted with platform key

    -- Limits based on tier
    max_agents INTEGER DEFAULT 10,
    max_users INTEGER DEFAULT 5,
    max_projects INTEGER DEFAULT 10,
    retention_days INTEGER DEFAULT 90,

    -- Metadata
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Tenant API keys for agent authentication
CREATE TABLE platform.tenant_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,  -- SHA-256 hash of the API key
    key_prefix VARCHAR(10) NOT NULL,  -- First 10 chars for identification
    scopes TEXT[] DEFAULT ARRAY['agent:write', 'scan:write'],
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- Tenant users (linked to Keycloak)
CREATE TABLE platform.tenant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    keycloak_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'viewer',  -- admin, editor, viewer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, keycloak_user_id)
);

-- Audit log for platform operations
CREATE TABLE platform.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES platform.tenants(id),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_tenants_slug ON platform.tenants(slug);
CREATE INDEX idx_tenants_status ON platform.tenants(status);
CREATE INDEX idx_tenant_api_keys_tenant ON platform.tenant_api_keys(tenant_id);
CREATE INDEX idx_tenant_api_keys_prefix ON platform.tenant_api_keys(key_prefix);
CREATE INDEX idx_tenant_users_tenant ON platform.tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_keycloak ON platform.tenant_users(keycloak_user_id);
CREATE INDEX idx_audit_log_tenant ON platform.audit_log(tenant_id, created_at DESC);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON platform.tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_users_updated_at
    BEFORE UPDATE ON platform.tenant_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
