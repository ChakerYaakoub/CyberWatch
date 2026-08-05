"""PostgreSQL persistence for scan results — used by HTTP /jobs and RabbitMQ consumer."""

from __future__ import annotations

from datetime import datetime, timezone

import psycopg2

from app.config import Settings
from app.models.schemas import ScanResult
from app.utils.logging_config import get_logger

logger = get_logger(__name__)

STATUS_QUEUED = "QUEUED"
STATUS_RUNNING = "RUNNING"
STATUS_COMPLETED = "COMPLETED"
STATUS_FAILED = "FAILED"


class ResultStore:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def _connect(self):
        return psycopg2.connect(
            host=self.settings.database_host,
            port=self.settings.database_port,
            user=self.settings.database_user,
            password=self.settings.database_password,
            dbname=self.settings.database_name,
            sslmode=self.settings.database_sslmode,
            connect_timeout=5,
        )

    def mark_running(self, scan_id: int) -> None:
        now = datetime.now(timezone.utc)
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE scans
                    SET status = %s, started_at = COALESCE(started_at, %s), updated_at = %s
                    WHERE id = %s
                    """,
                    (STATUS_RUNNING, now, now, scan_id),
                )
            conn.commit()
        logger.info("scan_status_running", scan_id=scan_id)

    def mark_failed(self, scan_id: int, reason: str) -> None:
        now = datetime.now(timezone.utc)
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE scans
                    SET status = %s, finished_at = %s, updated_at = %s
                    WHERE id = %s
                    """,
                    (STATUS_FAILED, now, now, scan_id),
                )
            conn.commit()
        logger.warning("scan_status_failed", scan_id=scan_id, reason=reason)

    def save_success(self, scan_id: int, result: ScanResult) -> None:
        now = datetime.now(timezone.utc)
        findings = [f for f in result.findings if f.severity.value != "INFO"] or result.findings

        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM vulnerabilities WHERE scan_id = %s", (scan_id,))
                for finding in findings:
                    severity = finding.severity.value
                    if severity == "INFO":
                        severity = "LOW"
                    description = finding.description
                    if finding.recommendation:
                        description = f"{description}\n\nRecommendation: {finding.recommendation}"
                    cur.execute(
                        """
                        INSERT INTO vulnerabilities (scan_id, title, severity, description, created_at)
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (scan_id, finding.title[:255], severity, description, now),
                    )
                cur.execute(
                    """
                    UPDATE scans
                    SET status = %s, risk_score = %s, finished_at = %s, updated_at = %s,
                        started_at = COALESCE(started_at, %s)
                    WHERE id = %s
                    """,
                    (STATUS_COMPLETED, result.riskScore, now, now, now, scan_id),
                )
            conn.commit()
        logger.info(
            "scan_results_stored",
            scan_id=scan_id,
            risk_score=result.riskScore,
            findings=len(findings),
        )
