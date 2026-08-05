"""Passive DNS analysis — A, CNAME, NS only (no aggressive enumeration)."""

from __future__ import annotations

import socket

import dns.exception
import dns.resolver

from app.config import Settings
from app.models.schemas import DnsResult
from app.utils.logging_config import get_logger

logger = get_logger(__name__)


def _resolve_a_system(domain: str, timeout: float) -> str | None:
    """Fallback when dnspython times out — uses the OS resolver (same path as browsers/HTTP)."""
    previous = socket.getdefaulttimeout()
    socket.setdefaulttimeout(timeout)
    try:
        infos = socket.getaddrinfo(domain, None, family=socket.AF_INET, type=socket.SOCK_STREAM)
        for info in infos:
            ip = info[4][0]
            if ip:
                return ip
    except OSError as exc:
        logger.warning("dns_system_fallback_failed", domain=domain, error=str(exc))
        return None
    finally:
        socket.setdefaulttimeout(previous)
    return None


def scan_dns(domain: str, settings: Settings) -> DnsResult:
    """Resolve A / CNAME / NS; fall back to OS resolver if dnspython times out."""
    resolver = dns.resolver.Resolver()
    resolver.lifetime = settings.dns_timeout_seconds
    resolver.timeout = settings.dns_timeout_seconds

    ip: str | None = None
    cname: str | None = None
    nameservers: list[str] = []
    dns_error: str | None = None

    try:
        a_answers = resolver.resolve(domain, "A")
        ip = next((rdata.address for rdata in a_answers), None)
    except dns.resolver.NXDOMAIN as exc:
        logger.warning("dns_nxdomain", domain=domain)
        return DnsResult(resolved=False, error=f"Domain does not exist (NXDOMAIN): {exc}")
    except (dns.resolver.NoAnswer, dns.resolver.NoNameservers, dns.exception.Timeout) as exc:
        dns_error = str(exc)
        logger.warning("dns_a_retry_system", domain=domain, error=dns_error)
        ip = _resolve_a_system(domain, settings.dns_timeout_seconds)
    except Exception as exc:  # noqa: BLE001
        dns_error = str(exc)
        logger.warning("dns_unexpected_retry_system", domain=domain, error=dns_error)
        ip = _resolve_a_system(domain, settings.dns_timeout_seconds)

    if not ip:
        return DnsResult(
            resolved=False,
            error=dns_error or "DNS A lookup failed",
        )

    try:
        cname_answers = resolver.resolve(domain, "CNAME")
        cname = next((str(rdata.target).rstrip(".") for rdata in cname_answers), None)
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.exception.DNSException):
        cname = None

    try:
        ns_answers = resolver.resolve(domain, "NS")
        nameservers = sorted({str(rdata.target).rstrip(".") for rdata in ns_answers})
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.exception.DNSException):
        nameservers = []

    logger.info("dns_resolved", domain=domain, ip=ip, cname=cname, nameservers=nameservers)
    return DnsResult(resolved=True, ip=ip, cname=cname, nameservers=nameservers)
