import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import FileResponse

from app.schemas.batch_production import (
    BatchDetailResponse,
    BatchExportZipRequest,
    BatchExportZipResponse,
    BatchPreflightRequest,
    BatchPreflightResponse,
    BatchProductionGroup,
    CreateBatchProductionRequest,
    FinalVideoItem,
    FinalVideoLibraryResponse,
)
from app.schemas.replacements import ReplacementJobResponse
from app.services.batch_production import batch_orchestrator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects/{project_id}", tags=["Batch Production & Final Video Library"])


# =============================================================================
# Batch Production Endpoints
# =============================================================================

@router.post("/batches/preflight", response_model=BatchPreflightResponse)
def check_batch_preflight(
    project_id: str,
    request: BatchPreflightRequest,
) -> BatchPreflightResponse:
    """
    Evaluates pre-flight compatibility for multiple Product Assets against the selected Base Video.
    """
    try:
        return batch_orchestrator.check_batch_preflight(
            project_id=project_id,
            base_video_asset_id=request.base_video_asset_id,
            product_asset_ids=request.product_asset_ids,
        )
    except Exception as e:
        logger.error("Batch preflight check failed: %s", e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/batches", response_model=BatchProductionGroup, status_code=status.HTTP_201_CREATED)
def create_batch_production(
    project_id: str,
    request: CreateBatchProductionRequest,
) -> BatchProductionGroup:
    """
    Creates a new Batch Production Group and enqueues individual child replacement jobs.
    Supports idempotent submission via idempotency_key.
    """
    user_id = "usr-system-default"
    try:
        return batch_orchestrator.create_batch(
            user_id=user_id,
            request=request,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("Failed to create batch: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi khi tạo đợt sản xuất hàng loạt")


@router.get("/batches", response_model=list[BatchProductionGroup])
def list_batch_production_groups(project_id: str) -> list[BatchProductionGroup]:
    """
    Lists all batch production groups for a project.
    """
    return batch_orchestrator.list_batches(project_id=project_id)


@router.get("/batches/{batch_id}", response_model=BatchDetailResponse)
def get_batch_production_detail(project_id: str, batch_id: str) -> BatchDetailResponse:
    """
    Fetches real-time status, progress counters, and child replacement jobs of a batch.
    """
    try:
        return batch_orchestrator.get_batch(project_id=project_id, batch_id=batch_id)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/batches/{batch_id}/cancel", response_model=BatchProductionGroup)
def cancel_batch_production(project_id: str, batch_id: str) -> BatchProductionGroup:
    """
    Safely cancels queued child jobs in a batch while preserving already completed videos.
    """
    try:
        return batch_orchestrator.cancel_batch(project_id=project_id, batch_id=batch_id)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/batches/{batch_id}/jobs/{job_id}/retry", response_model=ReplacementJobResponse)
def retry_batch_child_job(
    project_id: str,
    batch_id: str,
    job_id: str,
) -> ReplacementJobResponse:
    """
    Retries an individual failed child job without re-executing successfully completed jobs.
    """
    try:
        return batch_orchestrator.retry_job(
            project_id=project_id,
            batch_id=batch_id,
            job_id=job_id,
        )
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# =============================================================================
# Final Video Library Endpoints
# =============================================================================

@router.get("/final-videos", response_model=FinalVideoLibraryResponse)
def get_final_video_library(
    project_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = None,
    batch_id: str | None = None,
    product_id: str | None = None,
    quality_status: str | None = None,
    sort_by: str = Query("created_at", pattern="^(created_at|product_title)$"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    include_archived: bool = False,
) -> FinalVideoLibraryResponse:
    """
    Queries, filters, sorts and paginates the project's Final Video Library.
    """
    return batch_orchestrator.query_final_video_library(
        project_id=project_id,
        page=page,
        limit=limit,
        search=search,
        batch_id=batch_id,
        product_id=product_id,
        quality_status=quality_status,
        sort_by=sort_by,
        sort_dir=sort_dir,
        include_archived=include_archived,
    )


@router.get("/final-videos/{video_id}", response_model=FinalVideoItem)
def get_final_video_detail(project_id: str, video_id: str) -> FinalVideoItem:
    """
    Fetches full metadata, provenance tree, and quality gate review of a Final Product Video.
    """
    res = batch_orchestrator.query_final_video_library(
        project_id=project_id,
        page=1,
        limit=100,
        include_archived=True,
    )
    for v in res.items:
        if v.video_id == video_id:
            return v
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy video thành phẩm.")


@router.post("/final-videos/{video_id}/archive")
def toggle_archive_video(project_id: str, video_id: str) -> dict[str, Any]:
    """
    Toggles the archive status of a Final Product Video without physical file deletion.
    """
    is_archived = batch_orchestrator.toggle_archive_video(video_id)
    return {"video_id": video_id, "is_archived": is_archived}


@router.get("/final-videos/{video_id}/download")
def download_final_video(project_id: str, video_id: str):
    """
    Securely downloads an original Final Product Video MP4 with a sanitized, user-friendly filename.
    """
    try:
        file_path, filename = batch_orchestrator.get_video_safe_file_path(project_id, video_id)
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type="video/mp4",
        )
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/final-videos/export-zip")
def export_batch_zip(
    project_id: str,
    request: BatchExportZipRequest,
):
    """
    Bundles selected or all completed Final Product Videos + manifest.json into a temporary ZIP.
    """
    try:
        zip_path, zip_filename, total_videos, total_bytes = batch_orchestrator.generate_export_zip(
            project_id=project_id,
            video_ids=request.video_ids if request.video_ids else None,
        )
        return FileResponse(
            path=zip_path,
            filename=zip_filename,
            media_type="application/zip",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("ZIP export failed: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Không thể tạo gói ZIP tải xuống")
