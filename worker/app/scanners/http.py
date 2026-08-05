"""Passive HTTP(S) reachability and response metadata."""

from __future__ import annotations

import time
from typing import Any

import requests
from requests.exceptions import RequestException, SSLError, Timeout

from app.config import Settings
from app.models.schemas import HttpResult
from app.utils.logging_config import get_logger

logger = get_logger(__name__)


def _probe(url: str, settings: Settings) -> tuple[requests.Response | None, float | None, str | None]:
    started = time.perf_counter()
    try:
        response = requests.get(
            url,
            timeout=settings.http_timeout_seconds,
            allow_redirects=True,
            headers={"User-Agent": settings.user_agent},
        )
        elapsed_ms = (time.perf_counter() - started) * 1000
        return response, elapsed_ms, None
    except SSLError as exc:
        return None, None, f"SSL error: {exc}"
    except Timeout:
        return None, None, "HTTP request timed out"
    except RequestException as exc:
        return None, None, f"Connection error: {exc}"


def _to_result(
    response: requests.Response,
    elapsed_ms: float,
    requested_url: str,
) -> HttpResult:
    history = response.history
    redirected = len(history) > 0
    redirect_target = response.url if redirected and response.url != requested_url else None
    headers: dict[str, Any] = {k.lower(): v for k, v in response.headers.items()}

    return HttpResult(
        reachable=True,
        final_url=response.url,
        protocol="https" if response.url.startswith("https://") else "http",
        status_code=response.status_code,
        response_time_ms=round(elapsed_ms, 2),
        redirected=redirected,
        redirect_target=redirect_target,
        server=headers.get("server"),
        powered_by=headers.get("x-powered-by"),
    )


def scan_http(domain: str, settings: Settings) -> tuple[HttpResult, requests.Response | None]:
    """Try HTTPS first, then HTTP. Returns (summary, raw response) for header/tech reuse."""
    https_url = f"https://{domain}"
    response, elapsed_ms, error = _probe(https_url, settings)
    if response is not None and elapsed_ms is not None:
        logger.info("https_reachable", domain=domain, status=response.status_code)
        return _to_result(response, elapsed_ms, https_url), response

    logger.info("https_failed_try_http", domain=domain, error=error)
    http_url = f"http://{domain}"
    response, elapsed_ms, http_error = _probe(http_url, settings)
    if response is not None and elapsed_ms is not None:
        logger.info("http_reachable", domain=domain, status=response.status_code)
        return _to_result(response, elapsed_ms, http_url), response

    message = http_error or error or "Host unreachable"
    logger.warning("http_unreachable", domain=domain, error=message)
    return HttpResult(reachable=False, error=message), None
