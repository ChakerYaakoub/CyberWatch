from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
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

    # Shared PostgreSQL (same DB as Go API) — required to persist job results
    database_host: str = "localhost"
    database_port: int = 5432
    database_user: str = "postgres"
    database_password: str = ""
    database_name: str = "cyberwatch"
    database_sslmode: str = "disable"

    # RabbitMQ consumer
    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"
    queue_name: str = "scan_jobs"
    exchange_name: str = "cyberwatch.scans"
    dead_letter_exchange: str = "cyberwatch.scans.dlx"
    dead_letter_queue: str = "scan_dead_letter"
    routing_key: str = "scan.start"
    max_attempts: int = 3


@lru_cache
def get_settings() -> Settings:
    return Settings()
