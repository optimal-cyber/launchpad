"""
GitLab Artifact Processor for Authorization Pipeline
Handles downloading, parsing, and processing artifacts from GitLab CI/CD pipelines
"""

import requests
import json
import tempfile
import zipfile
from pathlib import Path
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class ArtifactProcessor:
    """Processes artifacts from GitLab pipelines for authorization decisions"""
    
    def __init__(self, gitlab_token: str, gitlab_base_url: str):
        self.gitlab_token = gitlab_token
        self.gitlab_base_url = gitlab_base_url
        self.headers = {'PRIVATE-TOKEN': gitlab_token}
    
    def download_job_artifacts(self, project_id: int, job_id: int) -> Optional[Path]:
        """Download artifacts from a GitLab job"""
        url = f"{self.gitlab_base_url}/api/v4/projects/{project_id}/jobs/{job_id}/artifacts"
        
        try:
            response = requests.get(url, headers=self.headers, stream=True)
            if response.status_code == 200:
                # Save to temporary file
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
                for chunk in response.iter_content(chunk_size=8192):
                    temp_file.write(chunk)
                temp_file.close()
                
                logger.info(f"Downloaded artifacts from job {job_id} to {temp_file.name}")
                return Path(temp_file.name)
            else:
                logger.warning(f"No artifacts found for job {job_id}: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Error downloading artifacts from job {job_id}: {e}")
            return None
    
    def extract_artifacts(self, zip_path: Path, extract_dir: Path) -> List[Path]:
        """Extract artifacts from zip file"""
        extracted_files = []
        
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
                extracted_files = list(extract_dir.rglob('*'))
                logger.info(f"Extracted {len(extracted_files)} files from artifacts")
        except Exception as e:
            logger.error(f"Error extracting artifacts: {e}")
        
        return extracted_files
    
    def find_artifact_file(self, files: List[Path], patterns: List[str]) -> Optional[Path]:
        """Find specific artifact file by name patterns"""
        for pattern in patterns:
            for file_path in files:
                if file_path.is_file() and file_path.name == pattern:
                    logger.info(f"Found artifact file: {file_path}")
                    return file_path
        return None
    
    def parse_sbom(self, file_path: Path) -> Dict:
        """Parse CycloneDX SBOM"""
        try:
            with open(file_path, 'r') as f:
                sbom_data = json.load(f)
                
            return {
                'type': 'sbom',
                'format': 'cyclonedx',
                'components': len(sbom_data.get('components', [])),
                'data': sbom_data
            }
        except Exception as e:
            logger.error(f"Error parsing SBOM: {e}")
            return {}
    
    def parse_trivy_vulnerabilities(self, file_path: Path) -> Dict:
        """Parse Trivy vulnerability scan results"""
        try:
            with open(file_path, 'r') as f:
                trivy_data = json.load(f)
            
            # Count vulnerabilities by severity
            vuln_counts = {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0, 'UNKNOWN': 0}
            total_vulns = 0
            
            for result in trivy_data.get('Results', []):
                for vuln in result.get('Vulnerabilities', []):
                    severity = vuln.get('Severity', 'UNKNOWN')
                    vuln_counts[severity] = vuln_counts.get(severity, 0) + 1
                    total_vulns += 1
            
            return {
                'type': 'vulnerabilities',
                'scanner': 'trivy',
                'total_vulnerabilities': total_vulns,
                'by_severity': vuln_counts,
                'data': trivy_data
            }
        except Exception as e:
            logger.error(f"Error parsing Trivy results: {e}")
            return {}
    
    def parse_trivy_compliance(self, file_path: Path) -> Dict:
        """Parse Trivy compliance scan results"""
        try:
            with open(file_path, 'r') as f:
                compliance_data = json.load(f)
            
            # Extract compliance summary
            results = compliance_data.get('Results', [])
            total_checks = 0
            passed_checks = 0
            failed_checks = 0
            
            for result in results:
                for misconfig in result.get('Misconfigurations', []):
                    total_checks += 1
                    status = misconfig.get('Status', '')
                    if status == 'PASS':
                        passed_checks += 1
                    elif status == 'FAIL':
                        failed_checks += 1
            
            compliance_score = (passed_checks / total_checks * 100) if total_checks > 0 else 0
            
            return {
                'type': 'compliance',
                'scanner': 'trivy',
                'total_checks': total_checks,
                'passed': passed_checks,
                'failed': failed_checks,
                'compliance_score': round(compliance_score, 2),
                'data': compliance_data
            }
        except Exception as e:
            logger.error(f"Error parsing compliance results: {e}")
            return {}
    
    def parse_sast_results(self, file_path: Path) -> Dict:
        """Parse SAST (semgrep) results in GitLab security report format"""
        try:
            with open(file_path, 'r') as f:
                sast_data = json.load(f)
            
            vulnerabilities = sast_data.get('vulnerabilities', [])
            severity_counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
            
            for vuln in vulnerabilities:
                severity = vuln.get('severity', 'unknown').lower()
                if severity in severity_counts:
                    severity_counts[severity] += 1
            
            return {
                'type': 'sast',
                'scanner': 'semgrep',
                'total_issues': len(vulnerabilities),
                'by_severity': severity_counts,
                'data': sast_data
            }
        except Exception as e:
            logger.error(f"Error parsing SAST results: {e}")
            return {}
    
    def parse_secret_detection(self, file_path: Path) -> Dict:
        """Parse secret detection results"""
        try:
            with open(file_path, 'r') as f:
                secrets_data = json.load(f)
            
            vulnerabilities = secrets_data.get('vulnerabilities', [])
            
            return {
                'type': 'secrets',
                'scanner': 'gitleaks',
                'secrets_found': len(vulnerabilities),
                'data': secrets_data
            }
        except Exception as e:
            logger.error(f"Error parsing secret detection results: {e}")
            return {}
    
    def parse_scorecard(self, file_path: Path) -> Dict:
        """Parse OSSF Scorecard results"""
        try:
            with open(file_path, 'r') as f:
                scorecard_data = json.load(f)
            
            score = scorecard_data.get('score', 0)
            checks = scorecard_data.get('checks', [])
            
            passed_checks = sum(1 for check in checks if check.get('score', 0) >= 7)
            
            return {
                'type': 'scorecard',
                'overall_score': score,
                'total_checks': len(checks),
                'passed_checks': passed_checks,
                'data': scorecard_data
            }
        except Exception as e:
            logger.error(f"Error parsing scorecard results: {e}")
            return {}
    
    def calculate_authorization_status(self, scan_results: Dict) -> Dict:
        """Calculate authorization status based on scan results"""
        
        # Extract metrics
        critical_cves = scan_results.get('vulnerabilities', {}).get('by_severity', {}).get('CRITICAL', 0)
        high_cves = scan_results.get('vulnerabilities', {}).get('by_severity', {}).get('HIGH', 0)
        sast_critical = scan_results.get('sast', {}).get('by_severity', {}).get('critical', 0)
        sast_high = scan_results.get('sast', {}).get('by_severity', {}).get('high', 0)
        secrets_found = scan_results.get('secrets', {}).get('secrets_found', 0)
        compliance_score = scan_results.get('compliance', {}).get('compliance_score', 0)
        
        # Calculate risk score (0-100, lower is better)
        risk_score = (
            (critical_cves * 10) +  # Each critical CVE adds 10 points
            (high_cves * 5) +       # Each high CVE adds 5 points
            (sast_critical * 8) +    # Each critical SAST issue adds 8 points
            (sast_high * 4) +        # Each high SAST issue adds 4 points
            (secrets_found * 15) +   # Each secret adds 15 points
            ((100 - compliance_score) * 0.5)  # Compliance gap adds points
        )
        
        # Determine authorization level
        if critical_cves == 0 and sast_critical == 0 and secrets_found == 0 and high_cves <= 3 and compliance_score >= 80:
            status = 'AUTHORIZED'
            level = 'full'
            conditions = []
        elif critical_cves <= 1 and secrets_found == 0 and compliance_score >= 70:
            status = 'CONDITIONAL'
            level = 'conditional'
            conditions = [
                f"Remediate {critical_cves} critical CVEs within 14 days" if critical_cves > 0 else None,
                f"Remediate {high_cves} high CVEs within 30 days" if high_cves > 5 else None,
                "Document risk acceptance for remaining vulnerabilities"
            ]
            conditions = [c for c in conditions if c]  # Remove None values
        else:
            status = 'NOT_AUTHORIZED'
            level = 'blocked'
            conditions = [
                f"CRITICAL: {critical_cves} critical vulnerabilities must be resolved",
                f"CRITICAL: {secrets_found} exposed secrets must be removed" if secrets_found > 0 else None,
                f"Compliance score too low: {compliance_score}% (minimum 70% required)"
            ]
            conditions = [c for c in conditions if c]
        
        return {
            'status': status,
            'level': level,
            'risk_score': min(int(risk_score), 100),
            'conditions': conditions,
            'metrics': {
                'critical_cves': critical_cves,
                'high_cves': high_cves,
                'sast_critical': sast_critical,
                'sast_high': sast_high,
                'secrets_found': secrets_found,
                'compliance_score': compliance_score
            }
        }
    
    def process_pipeline_artifacts(self, project_id: int, pipeline_id: int, jobs: List[Dict]) -> Dict:
        """Process all artifacts from a pipeline"""
        scan_results = {}
        
        for job in jobs:
            job_name = job.get('name', '')
            job_id = job.get('id')
            job_status = job.get('status', '')
            
            # Only process successful jobs with artifacts
            if job_status != 'success' or not job.get('artifacts_file'):
                continue
            
            logger.info(f"Processing job: {job_name} (ID: {job_id})")
            
            # Download artifacts
            artifact_zip = self.download_job_artifacts(project_id, job_id)
            if not artifact_zip:
                continue
            
            # Extract artifacts
            extract_dir = Path(tempfile.mkdtemp())
            files = self.extract_artifacts(artifact_zip, extract_dir)
            
            # Parse based on job name
            if 'sbom' in job_name.lower():
                artifact_file = self.find_artifact_file(files, ['sbom.cdx.json', 'sbom-cdx.json'])
                if artifact_file:
                    scan_results['sbom'] = self.parse_sbom(artifact_file)
            
            elif 'container_scanning' in job_name.lower():
                artifact_file = self.find_artifact_file(files, ['trivy-report.json'])
                if artifact_file:
                    scan_results['vulnerabilities'] = self.parse_trivy_vulnerabilities(artifact_file)
            
            elif 'compliance' in job_name.lower():
                artifact_file = self.find_artifact_file(files, ['trivy-compliance.json'])
                if artifact_file:
                    scan_results['compliance'] = self.parse_trivy_compliance(artifact_file)
            
            elif 'sast' in job_name.lower():
                artifact_file = self.find_artifact_file(files, ['gl-sast-report.json'])
                if artifact_file:
                    scan_results['sast'] = self.parse_sast_results(artifact_file)
            
            elif 'secret' in job_name.lower():
                artifact_file = self.find_artifact_file(files, ['gl-secret-detection-report.json'])
                if artifact_file:
                    scan_results['secrets'] = self.parse_secret_detection(artifact_file)
            
            elif 'scorecard' in job_name.lower():
                artifact_file = self.find_artifact_file(files, ['scorecard.json'])
                if artifact_file:
                    scan_results['scorecard'] = self.parse_scorecard(artifact_file)
            
            # Cleanup
            artifact_zip.unlink()
        
        # Calculate authorization status
        authorization = self.calculate_authorization_status(scan_results)
        scan_results['authorization'] = authorization
        
        return scan_results
