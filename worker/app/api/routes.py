from fastapi import APIRouter, Depends, HTTPException, status

from app.config import Settings, get_settings
from app.models.schemas import ErrorResponse, ScanRequest, ScanResult
from app.services.scan_service import DomainValidationError, ScanService

router = APIRouter()


def get_scan_service(settings: Settings = Depends(get_settings)) -> ScanService:
    return ScanService(settings=settings)


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "cyberwatch-worker"}


@router.post(
    "/scan",
    response_model=ScanResult,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
def run_scan(
    body: ScanRequest,
    service: ScanService = Depends(get_scan_service),
) -> ScanResult:
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
