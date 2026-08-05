"""Transport-agnostic job execution around ScanService."""

from __future__ import annotations

from app.config import Settings, get_settings
from app.models.job import ScanJob
from app.services.result_store import ResultStore
from app.services.scan_service import DomainValidationError, ScanService
from app.utils.logging_config import get_logger

logger = get_logger(__name__)


class JobProcessor:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.scanner = ScanService(settings=self.settings)
        self.store = ResultStore(self.settings)

    def process(self, job: ScanJob) -> None:
        logger.info(
            "job_received",
            scan_id=job.scanId,
            domain=job.domain,
            attempt=job.attempt,
            requested_by=job.requestedBy,
        )
        self.store.mark_running(job.scanId)
        try:
            result = self.scanner.run(job.domain)
            self.store.save_success(job.scanId, result)
            logger.info("job_completed", scan_id=job.scanId, risk_score=result.riskScore)
        except DomainValidationError as exc:
            self.store.mark_failed(job.scanId, str(exc))
            raise
        except Exception as exc:
            self.store.mark_failed(job.scanId, str(exc))
            raise
