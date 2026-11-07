from enum import Enum

from pydantic import BaseModel, Field


class TimeRange(str, Enum):
    SEVEN_DAYS = "7d"
    THIRTY_DAYS = "30d"
    NINETY_DAYS = "90d"


class OverviewSummaryResponse(BaseModel):
    saved_products_count: int | None = Field(
        None, description="Number of unique saved products in time range"
    )
    analyzed_channels_count: int | None = Field(
        None, description="Number of completed channel analyses in time range"
    )
    generated_images_count: int | None = Field(
        None, description="Number of successful AI image tasks in time range"
    )
    generated_videos_count: int | None = Field(
        None, description="Number of successful video tasks in time range"
    )


class ProjectStep(str, Enum):
    INITIAL = "initial"
    PRODUCT = "product"
    MODEL = "model"
    IMAGE = "image"
    VIDEO = "video"


class ProjectStatus(str, Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ERROR = "error"


class RecentProjectResponse(BaseModel):
    project_id: str
    project_name: str
    product_id: str | None = None
    product_name: str | None = None
    thumbnail_url: str | None = None
    current_step: ProjectStep
    project_status: ProjectStatus
    updated_at: str


class JobType(str, Enum):
    VIDEO_GENERATION = "video_generation"
    IMAGE_GENERATION = "image_generation"
    CHANNEL_ANALYSIS = "channel_analysis"


class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    VERIFYING = "verifying"
    FINISHING = "finishing"


class ActiveJobResponse(BaseModel):
    job_id: str
    project_id: str | None = None
    job_type: JobType
    display_name: str
    related_resource_name: str | None = None
    job_status: JobStatus
    progress: float | None = None
    started_at: str
    updated_at: str


class CompletedVideoResponse(BaseModel):
    video_id: str
    project_id: str
    title: str
    product_name: str | None = None
    thumbnail_url: str | None = None
    video_url: str
    duration_seconds: int | None = None
    resolution: str | None = None
    completed_at: str
    status: str = "ready"


class SavedProductResponse(BaseModel):
    product_id: str
    product_name: str
    shop_name: str | None = None
    image_url: str | None = None
    price: float | None = None
    currency: str | None = "VND"
    saved_at: str
