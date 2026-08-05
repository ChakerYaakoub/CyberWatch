"""Security response header checks."""

from __future__ import annotations

from app.models.schemas import Finding, HeaderCheck, Severity
from app.utils.logging_config import get_logger

logger = get_logger(__name__)

SECURITY_HEADERS: dict[str, tuple[Severity, str, str]] = {
    "strict-transport-security": (
        Severity.HIGH,
        "Missing Strict-Transport-Security",
        "Configure HSTS so browsers only use HTTPS for this host.",
    ),
    "content-security-policy": (
        Severity.MEDIUM,
        "Missing Content Security Policy",
        "Configure a Content-Security-Policy header.",
    ),
    "x-frame-options": (
        Severity.MEDIUM,
        "Missing X-Frame-Options",
        "Set X-Frame-Options (or CSP frame-ancestors) to mitigate clickjacking.",
    ),
    "x-content-type-options": (
        Severity.LOW,
        "Missing X-Content-Type-Options",
        "Set X-Content-Type-Options: nosniff.",
    ),
    "referrer-policy": (
        Severity.LOW,
        "Missing Referrer-Policy",
        "Set a Referrer-Policy appropriate for your application.",
    ),
    "permissions-policy": (
        Severity.LOW,
        "Missing Permissions-Policy",
        "Set Permissions-Policy to restrict powerful browser features.",
    ),
}


def scan_headers(response_headers: dict[str, str] | None) -> tuple[list[HeaderCheck], list[Finding]]:
    """Check presence of SECURITY_HEADERS; missing ones become Findings."""
    headers_lower = {k.lower(): v for k, v in (response_headers or {}).items()}
    checks: list[HeaderCheck] = []
    findings: list[Finding] = []

    for name, (severity, title, recommendation) in SECURITY_HEADERS.items():
        value = headers_lower.get(name)
        present = value is not None and value.strip() != ""
        checks.append(HeaderCheck(name=name, present=present, value=value if present else None))
        if not present:
            findings.append(
                Finding(
                    title=title,
                    description=f"The server does not return a {name} header.",
                    severity=severity,
                    recommendation=recommendation,
                )
            )

    logger.info(
        "headers_analyzed",
        present=sum(1 for c in checks if c.present),
        missing=sum(1 for c in checks if not c.present),
    )
    return checks, findings
