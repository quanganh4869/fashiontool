from datetime import UTC, datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class GarmentCategory(str, Enum):
    SHIRT = "shirt"
    T_SHIRT = "t_shirt"
    BLOUSE = "blouse"
    DRESS = "dress"
    JACKET = "jacket"
    HOODIE = "hoodie"
    PANTS = "pants"
    SKIRT = "skirt"


class ReplacementJobStatus(str, Enum):
    PENDING = "PENDING"
    VALIDATING_INPUTS = "VALIDATING_INPUTS"
    ANALYZING_BASE_VIDEO = "ANALYZING_BASE_VIDEO"
    SEGMENTING_GARMENT = "SEGMENTING_GARMENT"
    TRACKING_GARMENT = "TRACKING_GARMENT"
    PREPARING_PRODUCT = "PREPARING_PRODUCT"
    BUILDING_CONSTRAINTS = "BUILDING_CONSTRAINTS"
    GENERATING_FRAMES = "GENERATING_FRAMES"
    COMPOSITING = "COMPOSITING"
    TEMPORAL_CHECK = "TEMPORAL_CHECK"
    RENDERING = "RENDERING"
    QUALITY_REVIEW = "QUALITY_REVIEW"
    COMPLETED = "COMPLETED"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    RETRY_REQUIRED = "RETRY_REQUIRED"
    BLOCKED = "BLOCKED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class UserDecision(str, Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    RETRY_REQUESTED = "RETRY_REQUESTED"


class ProductTruthSheetSpec(BaseModel):
    truth_sheet_id: str
    product_id: str
    version: int = 1
    category: str = "shirt"
    silhouette: str = "regular_fit"
    primary_color: str = "#FFFFFF"
    pattern: str = "solid"
    collar_type: str = "pointed_collar"
    sleeve_type: str = "long_sleeve"
    button_count: int = 6
    button_placement: str = "front_placket_vertical"
    button_color: str = "#FFFFFF"
    has_left_pocket: bool = True
    pocket_placement: str = "left_chest"
    pocket_type: str = "patch_pocket"
    fabric_type: str = "matte_cotton"
    cuff_buttons: int = 2
    status: str = "APPROVED"
    verified_image_ids: list[str] = Field(default_factory=list)


class ReplacementPreflightRequest(BaseModel):
    base_video_asset_id: str
    product_asset_id: str


class ReplacementPreflightResponse(BaseModel):
    can_replace: bool
    category_compatibility: str  # SUPPORTED, LIMITED, UNSUPPORTED
    target_garment_slot: str  # upper_body, lower_body, dress_full_body
    detected_base_garment: str
    truth_sheet: ProductTruthSheetSpec
    blocking_reasons: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class CreateReplacementJobRequest(BaseModel):
    project_id: str
    base_video_asset_id: str
    product_asset_id: str
    confirmed_limitations: bool = False
    processing_config: dict[str, Any] | None = None


class ReplacementQualityCriterion(BaseModel):
    key: str
    name: str
    status: str  # PASS, NEEDS_REVIEW, FAIL
    description: str
    notes: str | None = None


class ReplacementQualityReview(BaseModel):
    overall_status: str  # PASS, NEEDS_REVIEW, RETRY_REQUIRED
    criteria: list[ReplacementQualityCriterion] = Field(default_factory=list)
    assessed_at: str
    inspector: str = "LocalQualityGateEngine"


class ReplacementJobResponse(BaseModel):
    job_id: str
    project_id: str
    user_id: str
    base_video_asset_id: str
    product_asset_id: str
    product_title: str
    model_name: str
    status: ReplacementJobStatus
    current_step: str
    progress: int
    created_at: str
    completed_at: str | None = None
    output_video_asset_id: str | None = None
    output_video_url: str | None = None
    output_thumbnail_url: str | None = None
    output_contact_sheet_url: str | None = None
    output_side_by_side_url: str | None = None
    output_video_sha256: str | None = None
    duration_ms: int | None = None
    width: int | None = None
    height: int | None = None
    fps: int | None = None
    codec: str | None = None
    file_size_bytes: int | None = None
    quality_review: ReplacementQualityReview | None = None
    user_decision: UserDecision = UserDecision.PENDING_REVIEW
    user_feedback: str | None = None
    error_code: str | None = None
    error_message: str | None = None
    truth_sheet: ProductTruthSheetSpec | None = None


class UserReviewDecisionRequest(BaseModel):
    decision: UserDecision
    feedback_notes: str | None = None
