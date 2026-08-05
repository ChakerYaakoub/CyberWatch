"""ScanJob payload — field names match Go messaging.ScanJob JSON (camelCase)."""

from datetime import datetime

from pydantic import BaseModel, Field


class ScanJob(BaseModel):
    version: int = 1
    scanId: int
    companyId: int
    domain: str = Field(..., min_length=1)
    requestedBy: str = "system"
    createdAt: datetime | None = None
    attempt: int = 1
