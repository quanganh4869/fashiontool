from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.v1.router import api_router
from app.core.config import settings
from app.schemas.health import HealthCheckResponse

app = FastAPI(
    title=settings.APP_NAME,
    version=__version__,
    description="TrendMotion Studio - Fashion Affiliate Research & Video Production Platform Backend API",
    docs_url=f"{settings.API_PREFIX}/docs"
    if settings.APP_ENV != "production"
    else None,
    redoc_url=f"{settings.API_PREFIX}/redoc"
    if settings.APP_ENV != "production"
    else None,
    openapi_url=f"{settings.API_PREFIX}/openapi.json"
    if settings.APP_ENV != "production"
    else None,
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root health check endpoint
@app.get(
    "/health",
    response_model=HealthCheckResponse,
    tags=["Health"],
    summary="Root Service Health Probe",
)
async def root_health_check() -> HealthCheckResponse:
    return HealthCheckResponse(
        status="ok",
        app=settings.APP_NAME,
        version=__version__,
        environment=settings.APP_ENV,
    )


# Include API v1 Router
app.include_router(api_router, prefix=settings.API_PREFIX)
