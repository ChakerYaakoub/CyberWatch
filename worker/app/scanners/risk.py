"""Risk score calculation from findings and scan context."""

from __future__ import annotations

from app.models.schemas import Finding, HttpResult, RiskLevel, Severity
from app.utils.logging_config import get_logger

logger = get_logger(__name__)

# Explicit penalties aligned with CyberWatch Phase 4 spec
FINDING_PENALTIES: dict[str, int] = {
    "HTTPS unavailable": 30,
    "Host unreachable over HTTP/HTTPS": 30,
    "Missing Strict-Transport-Security": 10,
    "Missing Content Security Policy": 10,
    "Missing X-Frame-Options": 8,
    "Missing X-Content-Type-Options": 5,
    "Missing Referrer-Policy": 5,
    "Missing Permissions-Policy": 5,
    "SSH service exposed": 15,
    "FTP service exposed": 20,
    "MySQL port exposed": 40,
    "PostgreSQL port exposed": 40,
    "Redis port exposed": 40,
    "AMQP / RabbitMQ port exposed": 25,
}

FALLBACK_PENALTY: dict[Severity, int] = {
    Severity.INFO: 0,
    Severity.LOW: 5,
    Severity.MEDIUM: 10,
    Severity.HIGH: 15,
    Severity.CRITICAL: 40,
}


def _level_from_score(score: int) -> RiskLevel:
    if score >= 80:
        return RiskLevel.LOW
    if score >= 60:
        return RiskLevel.MEDIUM
    if score >= 40:
        return RiskLevel.HIGH
    return RiskLevel.CRITICAL


def calculate_risk(
    http: HttpResult,
    findings: list[Finding],
) -> tuple[int, RiskLevel, list[Finding]]:
    enriched = list(findings)

    if not http.reachable:
        enriched.append(
            Finding(
                title="Host unreachable over HTTP/HTTPS",
                description="Neither HTTPS nor HTTP responded successfully.",
                severity=Severity.HIGH,
                recommendation="Verify DNS, firewall rules, and that the web service is online.",
            )
        )
    elif http.protocol == "http":
        enriched.append(
            Finding(
                title="HTTPS unavailable",
                description="The site was only reachable over plain HTTP.",
                severity=Severity.HIGH,
                recommendation="Enable TLS and redirect all traffic to HTTPS.",
            )
        )

    score = 100
    seen: set[str] = set()
    for finding in enriched:
        if finding.title in seen:
            continue
        seen.add(finding.title)
        penalty = FINDING_PENALTIES.get(finding.title)
        if penalty is None:
            penalty = FALLBACK_PENALTY.get(finding.severity, 5)
        score -= penalty

    score = max(0, min(100, score))
    level = _level_from_score(score)
    logger.info("risk_calculated", risk_score=score, risk_level=level.value, findings=len(enriched))
    return score, level, enriched
