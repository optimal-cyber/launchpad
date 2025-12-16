-- =============================================================================
-- Optimal Platform - Tenant Database Schema
-- =============================================================================
-- This schema is created for each tenant's isolated database.
-- Contains: agents, scans, vulnerabilities, SBOMs, compliance, integrations
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- SCHEMAS
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS agents;
CREATE SCHEMA IF NOT EXISTS scans;
CREATE SCHEMA IF NOT EXISTS vulns;
CREATE SCHEMA IF NOT EXISTS sbom;
CREATE SCHEMA IF NOT EXISTS compliance;
CREATE SCHEMA IF NOT EXISTS integrations;
CREATE SCHEMA IF NOT EXISTS assets;

-- =============================================================================
-- AGENTS SCHEMA - Security agents deployed in tenant environments
-- =============================================================================

-- Registered agents (DaemonSets, standalone scanners)
CREATE TABLE agents.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id VARCHAR(255) NOT NULL UNIQUE,  -- External identifier
    name VARCHAR(255),
    agent_type VARCHAR(100) NOT NULL,  -- daemonset, standalone, sidecar
    version VARCHAR(50),

    -- Environment info
    environment VARCHAR(50),  -- production, staging, development
    cluster_name VARCHAR(255),
    node_name VARCHAR(255),
    namespace VARCHAR(255),

    -- Status
    status VARCHAR(50) DEFAULT 'pending',  -- pending, active, inactive, error
    last_heartbeat TIMESTAMP WITH TIME ZONE,

    -- Capabilities
    capabilities TEXT[] DEFAULT ARRAY[]::TEXT[],  -- vulnerability_scan, runtime_security, sbom_generation

    -- Resource usage (from heartbeat)
    cpu_percent DECIMAL(5,2),
    memory_percent DECIMAL(5,2),
    disk_percent DECIMAL(5,2),

    -- Statistics
    containers_monitored INTEGER DEFAULT 0,
    scans_completed INTEGER DEFAULT 0,
    scans_failed INTEGER DEFAULT 0,

    -- Metadata
    labels JSONB DEFAULT '{}',
    annotations JSONB DEFAULT '{}',
    config JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent heartbeats (for history and debugging)
CREATE TABLE agents.heartbeats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents.agents(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    cpu_percent DECIMAL(5,2),
    memory_percent DECIMAL(5,2),
    disk_percent DECIMAL(5,2),
    containers_monitored INTEGER,
    message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Containers monitored by agents
CREATE TABLE agents.containers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents.agents(id) ON DELETE CASCADE,
    container_id VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    image VARCHAR(512),
    image_digest VARCHAR(255),
    status VARCHAR(50),  -- running, stopped, paused

    -- Resource usage
    cpu_usage DECIMAL(10,2),
    memory_usage BIGINT,  -- bytes
    network_rx_bytes BIGINT,
    network_tx_bytes BIGINT,

    -- Metadata
    labels JSONB DEFAULT '{}',
    ports JSONB DEFAULT '[]',

    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(agent_id, container_id)
);

-- =============================================================================
-- SCANS SCHEMA - Scan jobs and results
-- =============================================================================

-- Scan jobs
CREATE TABLE scans.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents.agents(id),
    scan_type VARCHAR(100) NOT NULL,  -- vulnerability, sbom, secret, compliance, runtime
    target_type VARCHAR(100) NOT NULL,  -- container, image, filesystem, repository
    target VARCHAR(512) NOT NULL,  -- Image name, path, etc.

    -- Status
    status VARCHAR(50) DEFAULT 'pending',  -- pending, running, completed, failed
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,

    -- Results summary
    findings_count INTEGER DEFAULT 0,
    critical_count INTEGER DEFAULT 0,
    high_count INTEGER DEFAULT 0,
    medium_count INTEGER DEFAULT 0,
    low_count INTEGER DEFAULT 0,

    -- Source info
    source_type VARCHAR(100),  -- gitlab, github, harbor, manual, scheduled
    source_ref VARCHAR(255),  -- Pipeline ID, PR number, etc.

    -- Metadata
    config JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scan results (raw findings)
CREATE TABLE scans.results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES scans.jobs(id) ON DELETE CASCADE,
    finding_type VARCHAR(100) NOT NULL,  -- vulnerability, secret, misconfiguration

    -- Finding details
    rule_id VARCHAR(255),
    title VARCHAR(512),
    description TEXT,
    severity VARCHAR(50),  -- critical, high, medium, low, info

    -- Location
    file_path VARCHAR(512),
    line_number INTEGER,
    package_name VARCHAR(255),
    package_version VARCHAR(100),

    -- Vulnerability specific
    cve_id VARCHAR(50),
    cvss_score DECIMAL(3,1),
    cvss_vector VARCHAR(255),
    epss_score DECIMAL(5,4),

    -- Remediation
    fix_available BOOLEAN DEFAULT FALSE,
    fixed_version VARCHAR(100),
    remediation TEXT,

    -- Status
    status VARCHAR(50) DEFAULT 'open',  -- open, acknowledged, fixed, false_positive, risk_accepted

    -- Raw data
    raw_data JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- VULNS SCHEMA - Aggregated vulnerability management
-- =============================================================================

-- Unique vulnerabilities (deduplicated across scans)
CREATE TABLE vulns.vulnerabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cve_id VARCHAR(50) UNIQUE,
    title VARCHAR(512),
    description TEXT,
    severity VARCHAR(50),

    -- CVSS
    cvss_v3_score DECIMAL(3,1),
    cvss_v3_vector VARCHAR(255),
    cvss_v2_score DECIMAL(3,1),

    -- EPSS (Exploit Prediction Scoring System)
    epss_score DECIMAL(5,4),
    epss_percentile DECIMAL(5,2),

    -- KEV (Known Exploited Vulnerabilities)
    is_kev BOOLEAN DEFAULT FALSE,
    kev_due_date DATE,

    -- References
    references JSONB DEFAULT '[]',

    -- NVD data
    nvd_data JSONB,

    published_at TIMESTAMP WITH TIME ZONE,
    modified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vulnerability instances (occurrences in tenant's environment)
CREATE TABLE vulns.instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vulnerability_id UUID REFERENCES vulns.vulnerabilities(id),
    scan_result_id UUID REFERENCES scans.results(id),

    -- Where it was found
    asset_type VARCHAR(100),  -- container, image, package
    asset_id VARCHAR(255),
    asset_name VARCHAR(255),
    environment VARCHAR(50),

    -- Affected package
    package_name VARCHAR(255),
    package_version VARCHAR(100),
    package_type VARCHAR(50),  -- npm, pip, maven, go, etc.

    -- Status tracking
    status VARCHAR(50) DEFAULT 'open',
    assigned_to VARCHAR(255),
    due_date DATE,

    -- Ticket integration
    ticket_id VARCHAR(255),
    ticket_url VARCHAR(512),

    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- SBOM SCHEMA - Software Bill of Materials
-- =============================================================================

-- SBOM documents
CREATE TABLE sbom.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    format VARCHAR(50) NOT NULL,  -- cyclonedx, spdx
    version VARCHAR(50),

    -- Source
    source_type VARCHAR(100),  -- container, repository, pipeline
    source_ref VARCHAR(512),
    image_name VARCHAR(512),
    image_digest VARCHAR(255),

    -- Document
    document JSONB NOT NULL,

    -- Statistics
    component_count INTEGER DEFAULT 0,
    license_count INTEGER DEFAULT 0,
    vulnerability_count INTEGER DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SBOM components (extracted from documents)
CREATE TABLE sbom.components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sbom_id UUID NOT NULL REFERENCES sbom.documents(id) ON DELETE CASCADE,

    -- Package identifiers
    purl VARCHAR(512),  -- Package URL
    cpe VARCHAR(512),   -- Common Platform Enumeration

    -- Package info
    name VARCHAR(255) NOT NULL,
    version VARCHAR(100),
    type VARCHAR(50),  -- library, application, framework, operating-system

    -- License
    licenses TEXT[],

    -- Supplier
    supplier VARCHAR(255),

    -- Hashes
    hashes JSONB DEFAULT '{}',

    -- Metadata
    properties JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- COMPLIANCE SCHEMA - POA&M, Controls, Evidence
-- =============================================================================

-- Security controls (NIST 800-53, etc.)
CREATE TABLE compliance.controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    framework VARCHAR(100) NOT NULL,  -- nist-800-53, fedramp, soc2
    control_id VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    description TEXT,

    -- Implementation
    implementation_status VARCHAR(50),  -- implemented, partially, planned, not_applicable
    implementation_notes TEXT,

    -- Evidence
    evidence_requirements TEXT[],

    -- Responsibility
    responsible_role VARCHAR(100),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(framework, control_id)
);

-- POA&M items
CREATE TABLE compliance.poam (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poam_id VARCHAR(100) NOT NULL UNIQUE,

    -- Weakness info
    weakness_name VARCHAR(255) NOT NULL,
    weakness_description TEXT,

    -- Source
    source_type VARCHAR(100),  -- scan, audit, assessment
    source_ref VARCHAR(255),

    -- Related controls
    control_ids TEXT[],

    -- Risk
    severity VARCHAR(50),
    risk_rating VARCHAR(50),  -- very_high, high, moderate, low

    -- Status
    status VARCHAR(50) DEFAULT 'open',  -- open, in_progress, completed, risk_accepted

    -- Dates
    identified_date DATE,
    scheduled_completion DATE,
    actual_completion DATE,

    -- Assignment
    assigned_to VARCHAR(255),

    -- Milestones
    milestones JSONB DEFAULT '[]',

    -- Ticket
    ticket_id VARCHAR(255),
    ticket_url VARCHAR(512),

    -- Comments
    comments JSONB DEFAULT '[]',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance evidence
CREATE TABLE compliance.evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    control_id UUID REFERENCES compliance.controls(id),
    poam_id UUID REFERENCES compliance.poam(id),

    title VARCHAR(255) NOT NULL,
    description TEXT,
    evidence_type VARCHAR(100),  -- screenshot, log, report, configuration

    -- File storage
    file_name VARCHAR(255),
    file_path VARCHAR(512),
    file_size INTEGER,
    mime_type VARCHAR(100),

    -- Collection
    collected_by VARCHAR(255),
    collected_at TIMESTAMP WITH TIME ZONE,

    -- Validity
    valid_from DATE,
    valid_until DATE,

    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INTEGRATIONS SCHEMA - External tool connections
-- =============================================================================

-- Integration configurations
CREATE TABLE integrations.connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(100) NOT NULL,  -- gitlab, github, harbor, jira, etc.
    name VARCHAR(255) NOT NULL,

    -- Connection details (encrypted)
    config_encrypted BYTEA,

    -- Status
    status VARCHAR(50) DEFAULT 'active',
    last_sync TIMESTAMP WITH TIME ZONE,
    last_error TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook configurations
CREATE TABLE integrations.webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID REFERENCES integrations.connections(id) ON DELETE CASCADE,

    event_type VARCHAR(100) NOT NULL,
    url VARCHAR(512),
    secret_hash VARCHAR(255),

    status VARCHAR(50) DEFAULT 'active',
    last_triggered TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ASSETS SCHEMA - Cloud and infrastructure assets
-- =============================================================================

-- Discovered assets
CREATE TABLE assets.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_type VARCHAR(100) NOT NULL,  -- ec2, rds, s3, container, pod, etc.
    provider VARCHAR(50),  -- aws, gcp, azure, kubernetes

    -- Identifiers
    external_id VARCHAR(255),
    arn VARCHAR(512),
    name VARCHAR(255),

    -- Location
    region VARCHAR(100),
    zone VARCHAR(100),
    namespace VARCHAR(255),
    cluster VARCHAR(255),

    -- Classification
    environment VARCHAR(50),
    criticality VARCHAR(50),  -- critical, high, medium, low
    data_classification VARCHAR(50),

    -- Status
    status VARCHAR(50),

    -- Configuration
    config JSONB DEFAULT '{}',
    tags JSONB DEFAULT '{}',

    -- Risk
    risk_score INTEGER,
    vulnerability_count INTEGER DEFAULT 0,
    misconfiguration_count INTEGER DEFAULT 0,

    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Agents
CREATE INDEX idx_agents_status ON agents.agents(status);
CREATE INDEX idx_agents_environment ON agents.agents(environment);
CREATE INDEX idx_heartbeats_agent ON agents.heartbeats(agent_id, created_at DESC);
CREATE INDEX idx_containers_agent ON agents.containers(agent_id);

-- Scans
CREATE INDEX idx_scan_jobs_status ON scans.jobs(status);
CREATE INDEX idx_scan_jobs_agent ON scans.jobs(agent_id);
CREATE INDEX idx_scan_results_job ON scans.results(job_id);
CREATE INDEX idx_scan_results_severity ON scans.results(severity);
CREATE INDEX idx_scan_results_cve ON scans.results(cve_id);

-- Vulns
CREATE INDEX idx_vulns_cve ON vulns.vulnerabilities(cve_id);
CREATE INDEX idx_vulns_severity ON vulns.vulnerabilities(severity);
CREATE INDEX idx_vuln_instances_status ON vulns.instances(status);
CREATE INDEX idx_vuln_instances_env ON vulns.instances(environment);

-- SBOM
CREATE INDEX idx_sbom_docs_image ON sbom.documents(image_name);
CREATE INDEX idx_sbom_components_purl ON sbom.components(purl);
CREATE INDEX idx_sbom_components_name ON sbom.components(name);

-- Compliance
CREATE INDEX idx_poam_status ON compliance.poam(status);
CREATE INDEX idx_controls_framework ON compliance.controls(framework);

-- Assets
CREATE INDEX idx_assets_type ON assets.inventory(asset_type);
CREATE INDEX idx_assets_provider ON assets.inventory(provider);
CREATE INDEX idx_assets_environment ON assets.inventory(environment);

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

-- Apply to all tables with updated_at
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents.agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scan_jobs_updated_at BEFORE UPDATE ON scans.jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scan_results_updated_at BEFORE UPDATE ON scans.results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vulns_updated_at BEFORE UPDATE ON vulns.vulnerabilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vuln_instances_updated_at BEFORE UPDATE ON vulns.instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sbom_docs_updated_at BEFORE UPDATE ON sbom.documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_poam_updated_at BEFORE UPDATE ON compliance.poam
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_controls_updated_at BEFORE UPDATE ON compliance.controls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON integrations.connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets.inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
