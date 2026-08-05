"""Scan orchestration — transport-agnostic business logic."""

from __future__ import annotations

from app.config import Settings, get_settings
from app.models.schemas import Finding, ScanResult, Severity
from app.scanners import (
    calculate_risk,
    detect_technologies,
    scan_dns,
    scan_headers,
    scan_http,
    scan_ports,
)
from app.utils.domain import validate_domain
from app.utils.logging_config import get_logger

logger = get_logger(__name__)


class DomainValidationError(ValueError):
    """Raised when the requested domain is invalid."""


class ScanService:
    """Runs the passive scanner pipeline. Safe to call from HTTP or a future queue consumer."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def run(self, raw_domain: str) -> ScanResult:
        try:
            domain = validate_domain(raw_domain)
        except ValueError as exc:
            raise DomainValidationError(str(exc)) from exc

        logger.info("scan_started", domain=domain)

        dns = scan_dns(domain, self.settings)
        findings: list[Finding] = []

        http, response = scan_http(domain, self.settings)
        response_headers = dict(response.headers) if response is not None else None
        html = response.text if response is not None else None

        # Only raise DNS as a finding when the host is also unreachable over HTTP(S)
        if not dns.resolved and not http.reachable:
            findings.append(
                Finding(
                    title="DNS resolution failed",
                    description=dns.error or "Could not resolve domain A record.",
                    severity=Severity.HIGH,
                    recommendation="Verify the domain exists and public DNS is configured correctly.",
                )
            )

        header_checks: list = []
        if http.reachable and response_headers is not None:
            header_checks, header_findings = scan_headers(response_headers)
            findings.extend(header_findings)
        technologies = detect_technologies(response_headers, html) if http.reachable else []

        port_host = dns.ip or domain
        port_checks, port_findings = scan_ports(port_host, self.settings)
        findings.extend(port_findings)
        risk_score, risk_level, all_findings = calculate_risk(http, findings)

        result = ScanResult(
            domain=domain,
            ip=dns.ip,
            dns=dns,
            http=http,
            technologies=technologies,
            headers=header_checks,
            ports=port_checks,
            riskScore=risk_score,
            riskLevel=risk_level,
            findings=all_findings,
        )

        logger.info(
            "scan_completed",
            domain=domain,
            risk_score=risk_score,
            risk_level=risk_level.value,
            findings=len(all_findings),
        )
        return result
