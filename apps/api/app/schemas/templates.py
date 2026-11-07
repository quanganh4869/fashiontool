from enum import Enum

from pydantic import BaseModel, Field


class TemplateStatus(str, Enum):
    PUBLISHED = "PUBLISHED"
    DRAFT = "DRAFT"
    ARCHIVED = "ARCHIVED"


class AssessmentStatus(str, Enum):
    SUPPORTED = "SUPPORTED"
    LIMITED = "LIMITED"
    UNSUPPORTED = "UNSUPPORTED"
    NOT_ASSESSED = "NOT_ASSESSED"


class TemplateSortBy(str, Enum):
    UPDATED_AT_DESC = "updated_at_desc"
    DURATION_ASC = "duration_asc"
    DURATION_DESC = "duration_desc"
    NAME_ASC = "name_asc"
    USAGE_DESC = "usage_desc"


class TemplateCategoryResponse(BaseModel):
    id: str
    name: str
    count: int | None = None


class TemplateSceneResponse(BaseModel):
    scene_id: str
    template_id: str
    scene_order: int
    start_time_ms: int
    end_time_ms: int
    action_description: str
    camera_movement: str
    framing: str
    subject_visibility: str


class TemplateGarmentSlotResponse(BaseModel):
    slot_id: str
    template_id: str
    slot_type: str
    slot_name: str
    assessment_status: AssessmentStatus
    visibility_level: str
    occlusion_status: str
    notes: str | None = None


class TemplateCompatibilityResponse(BaseModel):
    template_id: str
    supported_aspect_ratios: list[str]
    supported_model_framings: list[str]
    supported_subject_count: int = 1
    supported_motion_types: list[str]
    face_visibility_requirement: str
    body_visibility_requirement: str
    occlusion_level: str
    limitations: list[str] = Field(default_factory=list)


class TemplateSummaryResponse(BaseModel):
    template_id: str
    template_code: str
    title: str
    description: str
    category_id: str
    category_name: str
    tags: list[str] = Field(default_factory=list)
    poster_url: str
    preview_url: str | None = None
    duration_ms: int
    width: int
    height: int
    aspect_ratio: str
    frame_rate: int
    status: TemplateStatus
    is_favorite: bool = False
    usage_count: int = 0
    garment_slots_summary: list[str] = Field(default_factory=list)
    published_at: str
    updated_at: str


class TemplateDetailResponse(BaseModel):
    template_id: str
    template_code: str
    title: str
    description: str
    category_id: str
    category_name: str
    tags: list[str] = Field(default_factory=list)
    stream_url: str
    poster_url: str
    preview_url: str | None = None
    duration_ms: int
    width: int
    height: int
    aspect_ratio: str
    frame_rate: int
    video_codec: str
    audio_codec: str | None = None
    template_version_id: str
    status: TemplateStatus
    is_favorite: bool = False
    usage_count: int = 0
    published_at: str
    updated_at: str
    scenes: list[TemplateSceneResponse] = Field(default_factory=list)
    garment_slots: list[TemplateGarmentSlotResponse] = Field(default_factory=list)
    compatibility: TemplateCompatibilityResponse


class TemplateListResponse(BaseModel):
    items: list[TemplateSummaryResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class ToggleFavoriteResponse(BaseModel):
    template_id: str
    is_favorite: bool
    message: str
