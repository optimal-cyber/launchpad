"""
Provider-Agnostic Integration Service

Uses the adapter pattern to work with any supported CI/CD provider
(GitLab, GitHub, Jenkins, Azure DevOps, etc.)

This service provides a unified API for:
- Ticket/Issue management
- CI/CD pipeline operations
- Source code management
- Webhook handling
"""

import os
import sys
import logging
from typing import Any, Dict, List, Optional

# Add parent directory to path to import adapters
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from adapters import (
    get_provider,
    get_ticket_provider,
    get_ci_provider,
    get_scm_provider,
    ProviderType,
    TicketPriority,
    TicketStatus,
    PipelineStatus,
    TicketCreateRequest,
    TicketUpdateRequest,
    Ticket,
    Pipeline,
    WebhookEvent,
    IntegrationProvider,
)

logger = logging.getLogger(__name__)


class ProviderService:
    """
    Provider-agnostic service for CI/CD integrations.

    Automatically detects the configured provider from environment variables
    or can be explicitly configured for a specific provider.
    """

    def __init__(self, provider_type: ProviderType = None):
        """
        Initialize the provider service.

        Args:
            provider_type: Optional explicit provider type. If not specified,
                          auto-detects from OPTIMAL_PROVIDER env var or
                          presence of GITLAB_TOKEN/GITHUB_TOKEN.
        """
        self._provider = get_provider(provider_type)
        self._provider_type = self._provider.config.provider_type
        logger.info(f"Initialized ProviderService with {self._provider_type.value} provider")

    @property
    def provider(self) -> IntegrationProvider:
        """Get the underlying provider instance"""
        return self._provider

    @property
    def provider_type(self) -> ProviderType:
        """Get the current provider type"""
        return self._provider_type

    @property
    def supports_tickets(self) -> bool:
        return self._provider.supports_tickets

    @property
    def supports_ci(self) -> bool:
        return self._provider.supports_ci

    @property
    def supports_scm(self) -> bool:
        return self._provider.supports_scm

    # =========================================================================
    # Ticket Operations
    # =========================================================================

    async def create_vulnerability_ticket(
        self,
        project_id: str,
        vulnerability_id: str,
        title: str,
        severity: str,
        description: str,
        cve_id: str = None,
        affected_component: str = None,
        environment: str = None,
        assignee: str = None,
        labels: List[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a ticket for a vulnerability finding.
        Works with any supported ticket provider.
        """
        if not self.supports_tickets:
            return {"error": f"Provider {self._provider_type} does not support tickets"}

        # Map severity to priority
        priority = self._severity_to_priority(severity)

        # Build labels
        ticket_labels = labels or []
        ticket_labels.extend([
            self._provider.config.extra.get("vuln_label", "vulnerability"),
            self._provider.config.extra.get("auto_label", "auto-created"),
            f"severity:{severity.lower()}",
        ])
        if environment:
            ticket_labels.append(f"env:{environment}")

        # Build description
        full_description = self._build_vulnerability_description(
            description=description,
            vulnerability_id=vulnerability_id,
            cve_id=cve_id,
            severity=severity,
            affected_component=affected_component,
            environment=environment,
        )

        request = TicketCreateRequest(
            project_id=project_id,
            title=title,
            description=full_description,
            priority=priority,
            labels=ticket_labels,
            assignee=assignee,
        )

        return await self._provider.ticket_provider.create_ticket(request)

    async def create_misconfiguration_ticket(
        self,
        project_id: str,
        finding_id: str,
        title: str,
        severity: str,
        description: str,
        resource_type: str = None,
        resource_name: str = None,
        compliance_frameworks: List[str] = None,
        environment: str = None,
        assignee: str = None,
        labels: List[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a ticket for a misconfiguration finding.
        """
        if not self.supports_tickets:
            return {"error": f"Provider {self._provider_type} does not support tickets"}

        priority = self._severity_to_priority(severity)

        ticket_labels = labels or []
        ticket_labels.extend([
            self._provider.config.extra.get("misconfig_label", "misconfiguration"),
            self._provider.config.extra.get("auto_label", "auto-created"),
            f"severity:{severity.lower()}",
        ])
        if environment:
            ticket_labels.append(f"env:{environment}")
        if compliance_frameworks:
            for framework in compliance_frameworks:
                ticket_labels.append(f"compliance:{framework}")

        full_description = self._build_misconfiguration_description(
            description=description,
            finding_id=finding_id,
            severity=severity,
            resource_type=resource_type,
            resource_name=resource_name,
            compliance_frameworks=compliance_frameworks,
            environment=environment,
        )

        request = TicketCreateRequest(
            project_id=project_id,
            title=title,
            description=full_description,
            priority=priority,
            labels=ticket_labels,
            assignee=assignee,
        )

        return await self._provider.ticket_provider.create_ticket(request)

    async def create_poam_ticket(
        self,
        project_id: str,
        poam_id: str,
        title: str,
        description: str,
        weakness_name: str = None,
        controls: List[str] = None,
        milestones: List[Dict] = None,
        scheduled_completion: str = None,
        assignee: str = None,
        labels: List[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a POA&M (Plan of Action and Milestones) ticket.
        """
        if not self.supports_tickets:
            return {"error": f"Provider {self._provider_type} does not support tickets"}

        ticket_labels = labels or []
        ticket_labels.extend([
            self._provider.config.extra.get("poam_label", "poam"),
            self._provider.config.extra.get("auto_label", "auto-created"),
            "compliance",
        ])

        full_description = self._build_poam_description(
            description=description,
            poam_id=poam_id,
            weakness_name=weakness_name,
            controls=controls,
            milestones=milestones,
            scheduled_completion=scheduled_completion,
        )

        request = TicketCreateRequest(
            project_id=project_id,
            title=title,
            description=full_description,
            priority=TicketPriority.HIGH,
            labels=ticket_labels,
            assignee=assignee,
            due_date=scheduled_completion,
        )

        return await self._provider.ticket_provider.create_ticket(request)

    async def get_ticket(self, project_id: str, ticket_id: str) -> Optional[Dict]:
        """Get a ticket by ID"""
        if not self.supports_tickets:
            return None
        return await self._provider.ticket_provider.get_ticket(project_id, ticket_id)

    async def update_ticket(
        self,
        project_id: str,
        ticket_id: str,
        title: str = None,
        description: str = None,
        status: TicketStatus = None,
        labels: List[str] = None,
        assignee: str = None,
    ) -> Dict[str, Any]:
        """Update an existing ticket"""
        if not self.supports_tickets:
            return {"error": f"Provider {self._provider_type} does not support tickets"}

        request = TicketUpdateRequest(
            project_id=project_id,
            ticket_id=ticket_id,
            title=title,
            description=description,
            status=status,
            labels=labels,
            assignee=assignee,
        )
        return await self._provider.ticket_provider.update_ticket(request)

    async def close_ticket(self, project_id: str, ticket_id: str) -> Dict[str, Any]:
        """Close a ticket"""
        if not self.supports_tickets:
            return {"error": f"Provider {self._provider_type} does not support tickets"}
        return await self._provider.ticket_provider.close_ticket(project_id, ticket_id)

    async def add_comment(self, project_id: str, ticket_id: str, body: str) -> Dict[str, Any]:
        """Add a comment to a ticket"""
        if not self.supports_tickets:
            return {"error": f"Provider {self._provider_type} does not support tickets"}
        return await self._provider.ticket_provider.add_comment(project_id, ticket_id, body)

    async def search_tickets(
        self,
        project_id: str,
        labels: List[str] = None,
        status: str = None,
        search: str = None,
    ) -> List[Dict]:
        """Search for tickets"""
        if not self.supports_tickets:
            return []
        return await self._provider.ticket_provider.search_tickets(
            project_id=project_id,
            labels=labels,
            status=status,
            search=search,
        )

    async def find_existing_ticket(
        self,
        project_id: str,
        finding_id: str,
        finding_type: str = "vulnerability",
    ) -> Optional[Dict]:
        """
        Find an existing ticket for a finding to avoid duplicates.
        Searches by finding ID in ticket descriptions.
        """
        if not self.supports_tickets:
            return None

        # Search for tickets with matching finding ID
        tickets = await self.search_tickets(
            project_id=project_id,
            search=finding_id,
        )

        for ticket in tickets:
            desc = ticket.get("description", "")
            if finding_id in desc:
                return ticket

        return None

    # =========================================================================
    # CI/CD Operations
    # =========================================================================

    async def get_pipeline(self, project_id: str, pipeline_id: str) -> Optional[Dict]:
        """Get pipeline details"""
        if not self.supports_ci:
            return None
        return await self._provider.ci_provider.get_pipeline(project_id, pipeline_id)

    async def get_pipeline_jobs(self, project_id: str, pipeline_id: str) -> List[Dict]:
        """Get jobs for a pipeline"""
        if not self.supports_ci:
            return []
        return await self._provider.ci_provider.get_pipeline_jobs(project_id, pipeline_id)

    async def get_artifact(
        self,
        project_id: str,
        job_id: str,
        artifact_path: str,
    ) -> Optional[bytes]:
        """Download an artifact from a job"""
        if not self.supports_ci:
            return None
        return await self._provider.ci_provider.get_artifact(
            project_id, job_id, artifact_path
        )

    # =========================================================================
    # SCM Operations
    # =========================================================================

    async def get_repository(self, project_id: str) -> Optional[Dict]:
        """Get repository information"""
        if not self.supports_scm:
            return None
        return await self._provider.scm_provider.get_repository(project_id)

    async def get_file(
        self,
        project_id: str,
        file_path: str,
        ref: str = "main",
    ) -> Optional[str]:
        """Get file contents from repository"""
        if not self.supports_scm:
            return None
        return await self._provider.scm_provider.get_file(project_id, file_path, ref)

    # =========================================================================
    # Webhook Operations
    # =========================================================================

    async def verify_webhook(self, payload: bytes, signature: str) -> bool:
        """Verify a webhook signature"""
        return await self._provider.webhook_handler.verify_signature(payload, signature)

    async def parse_webhook(self, payload: Dict) -> WebhookEvent:
        """Parse a webhook payload into a normalized event"""
        return await self._provider.webhook_handler.parse_event(payload)

    # =========================================================================
    # Utility Methods
    # =========================================================================

    async def test_connection(self) -> Dict[str, Any]:
        """Test the connection to the provider"""
        return await self._provider.test_connection()

    async def close(self):
        """Close any open connections"""
        if hasattr(self._provider, 'close'):
            await self._provider.close()

    def _severity_to_priority(self, severity: str) -> TicketPriority:
        """Map severity string to TicketPriority"""
        mapping = {
            "critical": TicketPriority.CRITICAL,
            "high": TicketPriority.HIGH,
            "medium": TicketPriority.MEDIUM,
            "low": TicketPriority.LOW,
            "informational": TicketPriority.INFORMATIONAL,
            "info": TicketPriority.INFORMATIONAL,
        }
        return mapping.get(severity.lower(), TicketPriority.MEDIUM)

    def _build_vulnerability_description(
        self,
        description: str,
        vulnerability_id: str,
        cve_id: str = None,
        severity: str = None,
        affected_component: str = None,
        environment: str = None,
    ) -> str:
        """Build a formatted vulnerability description"""
        lines = [
            f"## Vulnerability Details",
            f"",
            f"**Finding ID:** `{vulnerability_id}`",
        ]

        if cve_id:
            lines.append(f"**CVE:** [{cve_id}](https://nvd.nist.gov/vuln/detail/{cve_id})")
        if severity:
            lines.append(f"**Severity:** {severity.upper()}")
        if affected_component:
            lines.append(f"**Affected Component:** `{affected_component}`")
        if environment:
            lines.append(f"**Environment:** {environment}")

        lines.extend([
            f"",
            f"## Description",
            f"",
            description,
            f"",
            f"---",
            f"*Auto-generated by Optimal Platform*",
        ])

        return "\n".join(lines)

    def _build_misconfiguration_description(
        self,
        description: str,
        finding_id: str,
        severity: str = None,
        resource_type: str = None,
        resource_name: str = None,
        compliance_frameworks: List[str] = None,
        environment: str = None,
    ) -> str:
        """Build a formatted misconfiguration description"""
        lines = [
            f"## Misconfiguration Details",
            f"",
            f"**Finding ID:** `{finding_id}`",
        ]

        if severity:
            lines.append(f"**Severity:** {severity.upper()}")
        if resource_type:
            lines.append(f"**Resource Type:** {resource_type}")
        if resource_name:
            lines.append(f"**Resource Name:** `{resource_name}`")
        if environment:
            lines.append(f"**Environment:** {environment}")
        if compliance_frameworks:
            lines.append(f"**Compliance:** {', '.join(compliance_frameworks)}")

        lines.extend([
            f"",
            f"## Description",
            f"",
            description,
            f"",
            f"---",
            f"*Auto-generated by Optimal Platform*",
        ])

        return "\n".join(lines)

    def _build_poam_description(
        self,
        description: str,
        poam_id: str,
        weakness_name: str = None,
        controls: List[str] = None,
        milestones: List[Dict] = None,
        scheduled_completion: str = None,
    ) -> str:
        """Build a formatted POA&M description"""
        lines = [
            f"## POA&M Details",
            f"",
            f"**POA&M ID:** `{poam_id}`",
        ]

        if weakness_name:
            lines.append(f"**Weakness:** {weakness_name}")
        if controls:
            lines.append(f"**NIST Controls:** {', '.join(controls)}")
        if scheduled_completion:
            lines.append(f"**Scheduled Completion:** {scheduled_completion}")

        lines.extend([
            f"",
            f"## Description",
            f"",
            description,
        ])

        if milestones:
            lines.extend([
                f"",
                f"## Milestones",
                f"",
            ])
            for i, milestone in enumerate(milestones, 1):
                lines.append(f"{i}. **{milestone.get('name', 'Milestone')}** - Due: {milestone.get('due_date', 'TBD')}")

        lines.extend([
            f"",
            f"---",
            f"*Auto-generated by Optimal Platform*",
        ])

        return "\n".join(lines)


# =============================================================================
# Auto-create from scan results
# =============================================================================

async def auto_create_tickets_from_scan(
    service: ProviderService,
    project_id: str,
    scan_results: Dict[str, Any],
    environment: str,
    severity_threshold: str = "high",
) -> Dict[str, Any]:
    """
    Automatically create tickets from scan results.

    Args:
        service: ProviderService instance
        project_id: Target project ID
        scan_results: Scan results containing vulnerabilities and/or misconfigurations
        environment: Environment name (prod, staging, dev)
        severity_threshold: Minimum severity to create tickets for

    Returns:
        Summary of created tickets
    """
    severity_order = ["critical", "high", "medium", "low", "informational"]
    threshold_idx = severity_order.index(severity_threshold.lower())

    results = {
        "created": [],
        "skipped": [],
        "errors": [],
    }

    # Process vulnerabilities
    vulnerabilities = scan_results.get("vulnerabilities", [])
    for vuln in vulnerabilities:
        severity = vuln.get("severity", "medium").lower()
        if severity_order.index(severity) > threshold_idx:
            results["skipped"].append({
                "id": vuln.get("id"),
                "reason": f"Severity {severity} below threshold {severity_threshold}",
            })
            continue

        vuln_id = vuln.get("id", vuln.get("vulnerability_id", "unknown"))

        # Check for existing ticket
        existing = await service.find_existing_ticket(
            project_id=project_id,
            finding_id=vuln_id,
            finding_type="vulnerability",
        )

        if existing:
            results["skipped"].append({
                "id": vuln_id,
                "reason": f"Ticket already exists: #{existing.get('iid', existing.get('number'))}",
            })
            continue

        try:
            result = await service.create_vulnerability_ticket(
                project_id=project_id,
                vulnerability_id=vuln_id,
                title=f"[{severity.upper()}] {vuln.get('title', vuln.get('name', 'Vulnerability'))}",
                severity=severity,
                description=vuln.get("description", "No description provided"),
                cve_id=vuln.get("cve_id") or vuln.get("identifiers", {}).get("CVE"),
                affected_component=vuln.get("location", {}).get("file") or vuln.get("package"),
                environment=environment,
            )
            results["created"].append(result)
        except Exception as e:
            results["errors"].append({
                "id": vuln_id,
                "error": str(e),
            })

    # Process misconfigurations
    misconfigs = scan_results.get("misconfigurations", [])
    for misconfig in misconfigs:
        severity = misconfig.get("severity", "medium").lower()
        if severity_order.index(severity) > threshold_idx:
            results["skipped"].append({
                "id": misconfig.get("id"),
                "reason": f"Severity {severity} below threshold {severity_threshold}",
            })
            continue

        finding_id = misconfig.get("id", misconfig.get("finding_id", "unknown"))

        existing = await service.find_existing_ticket(
            project_id=project_id,
            finding_id=finding_id,
            finding_type="misconfiguration",
        )

        if existing:
            results["skipped"].append({
                "id": finding_id,
                "reason": f"Ticket already exists: #{existing.get('iid', existing.get('number'))}",
            })
            continue

        try:
            result = await service.create_misconfiguration_ticket(
                project_id=project_id,
                finding_id=finding_id,
                title=f"[{severity.upper()}] {misconfig.get('title', misconfig.get('name', 'Misconfiguration'))}",
                severity=severity,
                description=misconfig.get("description", "No description provided"),
                resource_type=misconfig.get("resource_type"),
                resource_name=misconfig.get("resource_name"),
                compliance_frameworks=misconfig.get("compliance", []),
                environment=environment,
            )
            results["created"].append(result)
        except Exception as e:
            results["errors"].append({
                "id": finding_id,
                "error": str(e),
            })

    return {
        "summary": {
            "total_findings": len(vulnerabilities) + len(misconfigs),
            "created": len(results["created"]),
            "skipped": len(results["skipped"]),
            "errors": len(results["errors"]),
        },
        "details": results,
    }


# =============================================================================
# Module-level instance (lazy initialization)
# =============================================================================

_service_instance: Optional[ProviderService] = None


def get_service() -> ProviderService:
    """Get the singleton ProviderService instance"""
    global _service_instance
    if _service_instance is None:
        _service_instance = ProviderService()
    return _service_instance


async def close_service():
    """Close the service and release resources"""
    global _service_instance
    if _service_instance is not None:
        await _service_instance.close()
        _service_instance = None
