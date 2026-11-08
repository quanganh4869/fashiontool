from enum import Enum
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.replacements import (
    ProductTruthSheetSpec,
    ReplacementJobResponse,
    ReplacementQualityReview,
    UserDecision,
)


class BatchProductionStatus(str, Enum):
    DRAFT = "DRAFT"
    CONFIRMED = "CONFIRMED"
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    PARTIALLY_COMPLETED = "PARTIALLY_COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class BatchProductEligibilityStatus(str, Enum):
    ELIGIBLE = "ELIGIBLE"
    WARNINGS = "WARNINGS"
    BLOCKED = "BLOCKED"


class BatchPreflightProductItem(BaseModel):
    product_id: str
    product_title: str
    variant_id: str | None = None
    primary_image_url: str | None = None
    status: BatchProductEligibilityStatus
    category_compatibility: str  # SUPPORTED, LIMITED, UNSUPPORTED
    target_garment_slot: str  # upper_body, lower_body, dress_full_body
    truth_sheet: ProductTruthSheetSpec | None = None
    blocking_reasons: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class BatchPreflightRequest(BaseModel):
    base_video_asset_id: str
    product_asset_ids: list[str]


class BatchPreflightResponse(BaseModel):
    can_proceed: bool
    total_requested: int
    eligible_count: int
    warnings_count: int
    blocked_count: int
    items: list[BatchPreflightProductItem]


class CreateBatchProductionRequest(BaseModel):
    project_id: str
    base_video_asset_id: str
    product_asset_ids: list[str]
    batch_name: str | None = None
    confirmed_limitations: bool = False
    idempotency_key: str | None = None


class BatchProductionGroup(BaseModel):
    batch_id: str
    project_id: str
    user_id: str
    name: str
    base_video_asset_id: str
    base_video_title: str
    model_name: str
    status: BatchProductionStatus
    total_jobs: int
    queued_jobs: int
    processing_jobs: int
    completed_jobs: int
    failed_jobs: int
    cancelled_jobs: int
    progress: int
    created_at: str
    started_at: str | None = None
    completed_at: str | None = None
    job_ids: list[str] = Field(default_factory=list)
    idempotency_key: str | None = None


class BatchDetailResponse(BaseModel):
    batch: BatchProductionGroup
    jobs: list[ReplacementJobResponse]


class FinalVideoItem(BaseModel):
    video_id: str
    project_id: str
    batch_id: str | None = None
    product_id: str
    product_title: str
    variant_title: str | None = None
    model_name: str
    base_video_asset_id: str
    video_asset_id: str
    video_url: str
    thumbnail_url: str
    contact_sheet_url: str | None = None
    side_by_side_url: str | None = None
    duration_ms: int = 5000
    width: int = 1080
    height: int = 1920
    fps: int = 30
    codec: str = "h264"
    file_size_bytes: int = 0
    sha256: str = ""
    quality_review: ReplacementQualityReview | None = None
    user_decision: UserDecision = UserDecision.PENDING_REVIEW
    created_at: str
    is_archived: bool = False


class FinalVideoLibraryResponse(BaseModel):
    items: list[FinalVideoItem]
    total: int
    page: int
    limit: int
    total_pages: int


class BatchExportZipRequest(BaseModel):
    video_ids: list[str] = Field(default_factory=list)


class BatchExportZipResponse(BaseModel):
    download_url: str
    archive_filename: str
    total_videos: int
    total_size_bytes: int
