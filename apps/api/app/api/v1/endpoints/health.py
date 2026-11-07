from fastapi import APIRouter, status

from app import __version__
from app.core.config import settings
from app.schemas.health import HealthCheckResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Application Health Check",
    description="Returns current service status and environment info without leaking sensitive state.",
)
async def health_check() -> HealthCheckResponse:
    return HealthCheckResponse(
        status="ok",
        app=settings.APP_NAME,
        version=__version__,
        environment=settings.APP_ENV,
    )
