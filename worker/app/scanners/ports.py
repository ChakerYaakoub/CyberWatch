"""Limited common-port TCP probes with short timeouts.

Risky services require a short protocol banner so CDN/firewall
accept-then-drop behavior is not reported as a real exposure.
"""

from __future__ import annotations

import socket

from app.config import Settings
from app.models.schemas import Finding, PortCheck, Severity
from app.utils.logging_config import get_logger

logger = get_logger(__name__)

COMMON_PORTS: dict[int, str] = {
    80: "HTTP",
    443: "HTTPS",
    22: "SSH",
    21: "FTP",
    3306: "MySQL",
    5432: "PostgreSQL",
    6379: "Redis",
    5672: "AMQP",
}

# Ports that only count as open when a service banner/handshake is seen
BANNER_PORTS = {21, 22, 3306, 5432, 6379, 5672}

RISKY_PORTS: dict[int, tuple[Severity, str, str]] = {
    22: (
        Severity.HIGH,
        "SSH service exposed",
        "Restrict SSH to trusted networks or require VPN / bastion access.",
    ),
    21: (
        Severity.HIGH,
        "FTP service exposed",
        "Disable FTP or replace it with SFTP/FTPS and restrict access.",
    ),
    3306: (
        Severity.CRITICAL,
        "MySQL port exposed",
        "Do not expose database ports to the Internet; bind to private networks only.",
    ),
    5432: (
        Severity.CRITICAL,
        "PostgreSQL port exposed",
        "Do not expose database ports to the Internet; bind to private networks only.",
    ),
    6379: (
        Severity.CRITICAL,
        "Redis port exposed",
        "Do not expose Redis publicly; require authentication and private networking.",
    ),
    5672: (
        Severity.HIGH,
        "AMQP / RabbitMQ port exposed",
        "Do not expose message brokers to the Internet without strong controls.",
    ),
}


def _tcp_connect(host: str, port: int, timeout: float) -> socket.socket | None:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    try:
        sock.connect((host, port))
        return sock
    except OSError:
        sock.close()
        return None


def _recv_preview(sock: socket.socket, timeout: float, size: int = 64) -> bytes:
    sock.settimeout(timeout)
    try:
        return sock.recv(size)
    except OSError:
        return b""


def _confirm_service(sock: socket.socket, port: int, timeout: float) -> bool:
    """Return True only when the open socket looks like the expected service."""
    if port == 21:
        data = _recv_preview(sock, timeout)
        return data.startswith(b"220")
    if port == 22:
        data = _recv_preview(sock, timeout)
        return data.startswith(b"SSH-")
    if port == 3306:
        data = _recv_preview(sock, timeout)
        # MySQL greeting starts with packet length + protocol version
        return len(data) >= 5 and data[4] in (10, 9)
    if port == 5432:
        # PostgreSQL does not banner first; send SSLRequest-ish invalid startup and look for N/E
        try:
            sock.sendall(b"\x00\x00\x00\x08\x04\xd2\x16\x2f")
            data = _recv_preview(sock, timeout)
            return len(data) > 0 and data[:1] in (b"N", b"E", b"S")
        except OSError:
            return False
    if port == 6379:
        try:
            sock.sendall(b"PING\r\n")
            data = _recv_preview(sock, timeout)
            return b"PONG" in data or b"NOAUTH" in data or data.startswith(b"-")
        except OSError:
            return False
    if port == 5672:
        try:
            sock.sendall(b"AMQP\x00\x00\x09\x01")
            data = _recv_preview(sock, timeout)
            return data.startswith(b"AMQP") or len(data) > 0
        except OSError:
            return False
    return True


def _is_open(host: str, port: int, timeout: float) -> bool:
    sock = _tcp_connect(host, port, timeout)
    if sock is None:
        return False
    try:
        if port in BANNER_PORTS:
            return _confirm_service(sock, port, timeout)
        return True
    finally:
        sock.close()


def scan_ports(
    host: str,
    settings: Settings,
) -> tuple[list[PortCheck], list[Finding]]:
    checks: list[PortCheck] = []
    findings: list[Finding] = []

    for port, service in COMMON_PORTS.items():
        open_ = _is_open(host, port, settings.port_timeout_seconds)
        checks.append(PortCheck(port=port, open=open_, service=service))
        if open_ and port in RISKY_PORTS:
            severity, title, recommendation = RISKY_PORTS[port]
            findings.append(
                Finding(
                    title=title,
                    description=f"TCP port {port} ({service}) appears open on {host}.",
                    severity=severity,
                    recommendation=recommendation,
                )
            )

    open_ports = [c.port for c in checks if c.open]
    logger.info("ports_checked", host=host, open_ports=open_ports)
    return checks, findings
