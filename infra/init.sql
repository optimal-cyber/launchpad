-- Create the optimal_platform database
CREATE DATABASE optimal_platform;
\c optimal_platform;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS integrations;
CREATE SCHEMA IF NOT EXISTS sbom;
CREATE SCHEMA IF NOT EXISTS vuln;

-- GitLab integration tables
CREATE TABLE integrations.gitlab_projects (
    id SERIAL PRIMARY KEY,
    gitlab_project_id INTEGER UNIQUE NOT NULL,
    optimal_project_id UUID NOT NULL,
    default_branch TEXT NOT NULL,
    repo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE integrations.gitlab_jobs (
    id SERIAL PRIMARY KEY,
    gitlab_project_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    pipeline_id INTEGER NOT NULL,
    sha TEXT NOT NULL,
    ref TEXT NOT NULL,
    status TEXT NOT NULL,
    web_url TEXT,
    artifact_fetched BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(gitlab_project_id, pipeline_id, job_id)
);

-- SBOM tables
CREATE TABLE sbom.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    format TEXT NOT NULL,
    document JSONB NOT NULL,
    gitlab_project_id INTEGER,
    pipeline_id INTEGER,
    job_id INTEGER,
    sha TEXT,
    image_digest TEXT,
    image_tag TEXT,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sbom.components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sbom_id UUID REFERENCES sbom.documents(id) ON DELETE CASCADE,
    purl TEXT,
    name TEXT NOT NULL,
    version TEXT,
    type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vulnerability tables
CREATE TABLE vuln.findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vuln_id TEXT NOT NULL,
    severity TEXT,
    epss_score DECIMAL(5,4),
    epss_percentile DECIMAL(5,2),
    status TEXT DEFAULT 'OPEN',
    gitlab_project_id INTEGER,
    pipeline_id INTEGER,
    job_id INTEGER,
    sha TEXT,
    image_digest TEXT,
    image_tag TEXT,
    source_url TEXT,
    grype_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE vuln.vex_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_gitlab_projects_gitlab_id ON integrations.gitlab_projects(gitlab_project_id);
CREATE INDEX idx_gitlab_jobs_pipeline ON integrations.gitlab_jobs(pipeline_id, job_id);
CREATE INDEX idx_sbom_documents_gitlab ON sbom.documents(gitlab_project_id, pipeline_id, job_id);
CREATE INDEX idx_vuln_findings_gitlab ON vuln.findings(gitlab_project_id, pipeline_id, job_id);
CREATE INDEX idx_vuln_findings_vuln_id ON vuln.findings(vuln_id);
CREATE INDEX idx_sbom_components_purl ON sbom.components(purl);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_sbom_documents_updated_at BEFORE UPDATE ON sbom.documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vuln_findings_updated_at BEFORE UPDATE ON vuln.findings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

