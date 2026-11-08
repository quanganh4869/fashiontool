from fastapi import APIRouter

from app.api.v1.endpoints import (
    assets,
    batch_production,
    health,
    models,
    personalization,
    products,
    replacements,
    templates,
)

api_router = APIRouter()

# Register endpoint modules
api_router.include_router(health.router)
api_router.include_router(models.router)
api_router.include_router(assets.router)
api_router.include_router(templates.router)
api_router.include_router(personalization.router)
api_router.include_router(products.router)
api_router.include_router(replacements.router)
api_router.include_router(batch_production.router)
