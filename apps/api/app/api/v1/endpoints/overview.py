from fastapi import APIRouter, Query

from app.schemas.overview import (
    ActiveJobResponse,
    CompletedVideoResponse,
    OverviewSummaryResponse,
    RecentProjectResponse,
    SavedProductResponse,
    TimeRange,
)

router = APIRouter(prefix="/overview", tags=["Overview"])


@router.get("/summary", response_model=OverviewSummaryResponse)
async def get_overview_summary(
    range: TimeRange = Query(
        TimeRange.SEVEN_DAYS, description="Time range for metrics calculation"
    ),
):
    """
    Returns aggregated account summary statistics for the selected time range.
    Returns 0 when queried database has no records in range, or null if uncomputed.
    """
    # In Phase 03 without DB models, return default zero counts for existing account
    return OverviewSummaryResponse(
        saved_products_count=0,
        analyzed_channels_count=0,
        generated_images_count=0,
        generated_videos_count=0,
    )


@router.get("/recent-projects", response_model=list[RecentProjectResponse])
async def get_recent_projects(
    limit: int = Query(
        5, ge=1, le=20, description="Maximum number of projects to return"
    ),
):
    """
    Returns up to `limit` recent projects for current user.
    """
    return []


@router.get("/active-jobs", response_model=list[ActiveJobResponse])
async def get_active_jobs():
    """
    Returns currently running jobs (channel analysis, image generation, video generation).
    """
    return []


@router.get("/completed-videos", response_model=list[CompletedVideoResponse])
async def get_completed_videos(
    limit: int = Query(
        3, ge=1, le=10, description="Maximum number of completed videos to return"
    ),
):
    """
    Returns recently completed video renders.
    """
    return []


@router.get("/saved-products", response_model=list[SavedProductResponse])
async def get_saved_products(
    limit: int = Query(
        4, ge=1, le=10, description="Maximum number of saved products to return"
    ),
):
    """
    Returns recently saved products from market research.
    """
    return []
