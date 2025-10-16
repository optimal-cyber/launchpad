# SBOM Analyzer Service

SBOM analysis and vulnerability correlation service for the Optimal DevSecOps Platform.

## Overview

The SBOM Analyzer service is responsible for:
- Accepting SBOM uploads in multiple formats (CycloneDX preferred)
- Parsing and analyzing SBOM components
- Detecting vulnerable components and linking to known CVEs
- Storing metadata in PostgreSQL
- Providing SBOM reports and analytics

## Features

- **Multi-format support**: CycloneDX, SPDX, SWID, JSON, XML
- **Component analysis**: Dependency tree visualization
- **Vulnerability correlation**: Link components to known CVEs
- **License compliance**: Check component licenses
- **Automated remediation**: Suggest fixes for vulnerable components
- **SBOM versioning**: Track changes over time

## API Endpoints

- `POST /sbom/upload` - Upload SBOM for analysis
- `GET /sbom/{repo}` - Get SBOM analysis report
- `GET /sbom/{repo}/components` - Get component breakdown
- `GET /sbom/{repo}/vulnerabilities` - Get vulnerabilities in SBOM
- `POST /sbom/scan` - Trigger new SBOM scan
- `GET /sbom/stats` - Get SBOM statistics

## Analysis Tools

- **Syft**: SBOM generation and component detection
- **Grype**: Vulnerability scanning
- **Trivy**: Container and dependency scanning

## Data Sources

- PostgreSQL for SBOM metadata storage
- Redis for caching
- S3 for SBOM file storage
- Elasticsearch for search

## Integrations

- GitLab CI/CD
- GitHub Actions
- Jenkins
- Argo CD
- Vulnerability databases (NVD, OSV)

## Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --port 8002

# Run tests
pytest tests/
```

## Configuration

Set environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `S3_BUCKET`: S3 bucket for SBOM storage
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `ELASTICSEARCH_URL`: Elasticsearch connection string 