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


@lru_cache
def get_settings() -> Settings:
    return Settings()
