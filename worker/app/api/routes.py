"""HTTP routes for the worker FastAPI app (dev / SCAN_MODE=http)."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import Settings, get_settings
from app.models.job import ScanJob
from app.models.schemas import ErrorResponse, ScanRequest, ScanResult
from app.services.job_processor import JobProcessor
from app.services.scan_service import DomainValidationError, ScanService

router = APIRouter()


def get_scan_service(settings: Settings = Depends(get_settings)) -> ScanService:
    return ScanService(settings=settings)


def get_job_processor(settings: Settings = Depends(get_settings)) -> JobProcessor:
    return JobProcessor(settings=settings)


@router.get("/health")
def health() -> dict[str, str]:
    """Liveness for local uvicorn (Compose consumer does not expose this by default)."""
    return {"status": "ok", "service": "cyberwatch-worker"}


@router.post(
    "/scan",
    response_model=ScanResult,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
def run_scan(
    body: ScanRequest,
    service: ScanService = Depends(get_scan_service),
) -> ScanResult:
    """Synchronous passive scan (manual / debug). Does not touch PostgreSQL."""
    try:
        return service.run(body.domain)
    except DomainValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "invalid_domain", "detail": str(exc)},
        ) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "scan_failed", "detail": str(exc)},
        ) from exc


@router.post(
    "/jobs",
    status_code=status.HTTP_202_ACCEPTED,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
def accept_job(
    job: ScanJob,
    processor: JobProcessor = Depends(get_job_processor),
) -> dict[str, str | int]:
    """
    Development transport: Go HTTPPublisher POSTs a ScanJob here.
    Work runs in a daemon thread so the API can return 202 immediately.
    """
    import threading

    from app.utils.logging_config import get_logger

    log = get_logger(__name__)

    def _run() -> None:
        try:
            processor.process(job)
        except Exception as exc:  # noqa: BLE001
            log.exception("background_job_failed", scan_id=job.scanId, error=str(exc))

    threading.Thread(target=_run, name=f"scan-job-{job.scanId}", daemon=True).start()
    return {"status": "accepted", "scanId": job.scanId}
