"""Pydantic models for scan I/O (API responses and internal pipeline results)."""

from enum import Enum

from pydantic import BaseModel, Field


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"
    INFO = "INFO"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ScanRequest(BaseModel):
    domain: str = Field(..., min_length=1, max_length=253, examples=["example.com"])


class Finding(BaseModel):
    title: str
    description: str
    severity: Severity
    recommendation: str


class HeaderCheck(BaseModel):
    name: str
    present: bool
    value: str | None = None


class PortCheck(BaseModel):
    port: int
    open: bool
    service: str


class DnsResult(BaseModel):
    resolved: bool
    ip: str | None = None
    cname: str | None = None
    nameservers: list[str] = Field(default_factory=list)
    error: str | None = None


class HttpResult(BaseModel):
    reachable: bool
    final_url: str | None = None
    protocol: str | None = None
    status_code: int | None = None
    response_time_ms: float | None = None
    redirected: bool = False
    redirect_target: str | None = None
    server: str | None = None
    powered_by: str | None = None
    error: str | None = None


class ScanResult(BaseModel):
    domain: str
    ip: str | None = None
    dns: DnsResult
    http: HttpResult
    technologies: list[str] = Field(default_factory=list)
    headers: list[HeaderCheck] = Field(default_factory=list)
    ports: list[PortCheck] = Field(default_factory=list)
    riskScore: int
    riskLevel: RiskLevel
    findings: list[Finding] = Field(default_factory=list)


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
