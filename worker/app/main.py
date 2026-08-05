"""
CyberWatch scanner worker entry (HTTP / FastAPI mode).

Run: uvicorn app.main:app --host 0.0.0.0 --port 8001
Compose default uses app.consumer instead (RabbitMQ).
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import get_settings
from app.utils.logging_config import configure_logging, get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()
    configure_logging(settings.log_level)
    logger.info("worker_starting", env=settings.app_env, port=settings.port)
    yield
    logger.info("worker_stopping")


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        description="CyberWatch passive external scanner (HTTP API + shared ScanService).",
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.include_router(router)
    return application


app = create_app()
