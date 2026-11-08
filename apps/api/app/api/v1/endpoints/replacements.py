import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.replacements import (
    CreateReplacementJobRequest,
    ReplacementJobResponse,
    ReplacementPreflightRequest,
    ReplacementPreflightResponse,
    UserReviewDecisionRequest,
)
from app.services.garment_engine import local_garment_pipeline
from app.services.personalization import _GENERATIONS_DB, _PROJECTS_DB
from app.services.product_extraction import _PRODUCT_ASSETS_DB

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects/{project_id}/replacements", tags=["Garment Replacements"])


def _resolve_base_video(project_id: str, base_video_asset_id: str) -> dict[str, Any]:
    # Search in generations DB for matching output video asset id or matching project
    for gen in _GENERATIONS_DB.values():
        if (
            gen.get("output_video_asset_id") == base_video_asset_id
            or gen.get("generation_id") == base_video_asset_id
            or (gen.get("project_id") == project_id and gen.get("status") == "COMPLETED")
        ):
            return gen

    # If project has an output video url, construct pseudo record
    project = _PROJECTS_DB.get(project_id)
    if project and project.get("output_video_url"):
        return {
            "status": "COMPLETED",
            "model_name": project.get("model_name", "Linh"),
            "storage_path": f"users/usr-system-default/projects/{project_id}/personalizations/{project.get('current_generation_id', 'gen-001')}/base-video/personalized_base_video.mp4",
        }

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Không tìm thấy Personalized Base Video hợp lệ cho ID '{base_video_asset_id}' trong dự án này.",
    )


def _resolve_product(project_id: str, product_asset_id: str) -> dict[str, Any]:
    product = _PRODUCT_ASSETS_DB.get(product_asset_id)
    if not product:
        # Check by project id
        for p in _PRODUCT_ASSETS_DB.values():
            if p.get("project_id") == project_id and p.get("product_id") == product_asset_id:
                return p
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy Product Asset '{product_asset_id}'.",
        )
    return product


@router.post("/preflight", response_model=ReplacementPreflightResponse)
def check_replacement_preflight(
    project_id: str,
    request: ReplacementPreflightRequest,
) -> ReplacementPreflightResponse:
    """
    Evaluates pre-flight compatibility between Personalized Base Video and Product Asset/Truth Sheet.
    """
    base_video = _resolve_base_video(project_id, request.base_video_asset_id)
    product = _resolve_product(project_id, request.product_asset_id)

    return local_garment_pipeline.preflight.validate(
        base_video_record=base_video,
        product_record=product,
    )


@router.post("", response_model=ReplacementJobResponse, status_code=status.HTTP_201_CREATED)
def create_replacement_job(
    project_id: str,
    request: CreateReplacementJobRequest,
) -> ReplacementJobResponse:
    """
    Creates and initiates a local Product Replacement Job.
    """
    user_id = "usr-system-default"
    base_video = _resolve_base_video(project_id, request.base_video_asset_id)
    product = _resolve_product(project_id, request.product_asset_id)

    try:
        return local_garment_pipeline.create_job(
            user_id=user_id,
            request=request,
            base_video_record=base_video,
            product_record=product,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=list[ReplacementJobResponse])
def list_replacement_jobs(project_id: str) -> list[ReplacementJobResponse]:
    """
    Lists all replacement jobs within the project.
    """
    jobs = local_garment_pipeline.list_jobs(project_id=project_id)
    return [ReplacementJobResponse(**j) for j in jobs]


@router.get("/{job_id}", response_model=ReplacementJobResponse)
def get_replacement_job(project_id: str, job_id: str) -> ReplacementJobResponse:
    """
    Fetches status, progress, and quality review of a replacement job.
    """
    job = local_garment_pipeline.get_job(job_id)
    if not job or job.get("project_id") != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy tác vụ thay trang phục '{job_id}'.",
        )
    return ReplacementJobResponse(**job)


@router.post("/{job_id}/decision", response_model=ReplacementJobResponse)
def submit_user_review_decision(
    project_id: str,
    job_id: str,
    request: UserReviewDecisionRequest,
) -> ReplacementJobResponse:
    """
    Records the user's inspection decision (APPROVED, REJECTED, RETRY_REQUESTED).
    """
    job = local_garment_pipeline.get_job(job_id)
    if not job or job.get("project_id") != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy tác vụ thay trang phục '{job_id}'.",
        )

    job["user_decision"] = request.decision.value
    if request.feedback_notes:
        job["user_feedback"] = request.feedback_notes

    from app.services.garment_engine.pipeline import _save_jobs_db
    _save_jobs_db()

    return ReplacementJobResponse(**job)
