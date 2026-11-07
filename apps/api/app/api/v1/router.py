from fastapi import APIRouter

from app.api.v1.endpoints import (
    assets,
    health,
    models,
    overview,
    personalization,
    templates,
)

api_router = APIRouter()

# Register endpoint modules
api_router.include_router(health.router)
api_router.include_router(overview.router)
api_router.include_router(models.router)
api_router.include_router(assets.router)
api_router.include_router(templates.router)
api_router.include_router(personalization.router)
