from enum import Enum

from pydantic import BaseModel, Field


class CompatibilityAssessmentStatus(str, Enum):
    SUPPORTED = "SUPPORTED"
    LIMITED = "LIMITED"
    UNSUPPORTED = "UNSUPPORTED"
    NOT_ASSESSED = "NOT_ASSESSED"


class CompatibilityCheckItem(BaseModel):
    key: str
    name: str
    status: CompatibilityAssessmentStatus
    message: str


class CompatibilityCheckRequest(BaseModel):
    model_id: str
    template_id: str


class CompatibilityCheckResponse(BaseModel):
    status: CompatibilityAssessmentStatus
    can_generate: bool
    model_id: str
    model_name: str
    model_version: int
    template_id: str
    template_title: str
    template_code: str
    template_version_id: str
    checks: list[CompatibilityCheckItem]
    warnings: list[str] = Field(default_factory=list)
    blocking_reasons: list[str] = Field(default_factory=list)


class GenerationStatus(str, Enum):
    DRAFT = "DRAFT"
    QUEUED = "QUEUED"
    VALIDATING = "VALIDATING"
    PROCESSING = "PROCESSING"
    QUALITY_REVIEW = "QUALITY_REVIEW"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class QualityCriterionStatus(str, Enum):
    PASS = "PASS"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    NOT_ASSESSED = "NOT_ASSESSED"


class QualityCriterion(BaseModel):
    key: str
    name: str
    status: QualityCriterionStatus
    description: str
    notes: str | None = None


class QualityReviewReport(BaseModel):
    overall_status: QualityCriterionStatus
    criteria: list[QualityCriterion]
    assessed_at: str
    inspector: str


class CreateGenerationRequest(BaseModel):
    model_id: str
    template_id: str
    project_id: str | None = None
    project_name: str | None = None
    confirmed_limitations: bool = False
    processing_config: dict | None = None


class ModelTemplateGenerationResponse(BaseModel):
    generation_id: str
    user_id: str
    project_id: str
    project_name: str
    model_id: str
    model_name: str
    model_version: int
    model_cover_url: str | None = None
    template_id: str
    template_title: str
    template_code: str
    template_version_id: str
    template_poster_url: str
    status: GenerationStatus
    current_step: str
    progress: int
    created_at: str
    started_at: str | None = None
    completed_at: str | None = None
    error_code: str | None = None
    error_message: str | None = None
    output_video_asset_id: str | None = None
    output_video_url: str | None = None
    output_thumbnail_url: str | None = None
    duration_ms: int | None = None
    width: int | None = None
    height: int | None = None
    fps: int | None = None
    codec: str | None = None
    quality_review: QualityReviewReport | None = None
    retry_count: int = 0


class ProjectSummaryResponse(BaseModel):
    project_id: str
    name: str
    description: str | None = None
    model_id: str
    model_name: str
    template_id: str
    template_title: str
    current_generation_id: str | None = None
    current_generation_status: GenerationStatus | None = None
    output_video_url: str | None = None
    total_generations: int = 0
    created_at: str
    updated_at: str


class ProjectDetailResponse(ProjectSummaryResponse):
    generations: list[ModelTemplateGenerationResponse] = Field(default_factory=list)


class CreateProjectRequest(BaseModel):
    name: str
    description: str | None = None
    model_id: str
    template_id: str
