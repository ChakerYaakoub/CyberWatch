from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Deploy-sensitive values come from environment / .env — no secret defaults."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "CyberWatch Scanner Worker"
    app_env: str = "development"
    host: str = "0.0.0.0"
    port: int = 8001
    log_level: str = "INFO"

    http_timeout_seconds: float = 8.0
    dns_timeout_seconds: float = 8.0
    port_timeout_seconds: float = 2.0
    user_agent: str = "CyberWatch-Scanner/1.0 (+passive-external-scan)"

    # Required — same PostgreSQL as Go API (set in .env)
    database_host: str
    database_port: int
    database_user: str
    database_password: str
    database_name: str
    database_sslmode: str = "disable"

    # RabbitMQ — URL required when running the consumer (no guest/guest default)
    rabbitmq_url: str = ""
    queue_name: str = "scan_jobs"
    exchange_name: str = "cyberwatch.scans"
    dead_letter_exchange: str = "cyberwatch.scans.dlx"
    dead_letter_queue: str = "scan_dead_letter"
    routing_key: str = "scan.start"
    max_attempts: int = 3

    @field_validator("database_password")
    @classmethod
    def password_must_be_set(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("DATABASE_PASSWORD is required")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


def require_rabbitmq_url(settings: Settings) -> None:
    if not settings.rabbitmq_url.strip():
        raise RuntimeError(
            "RABBITMQ_URL is required to run the consumer (set it in worker/.env)"
        )
