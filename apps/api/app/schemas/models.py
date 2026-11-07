from enum import Enum

from pydantic import BaseModel, Field


class ModelStatus(str, Enum):
    DRAFT = "DRAFT"
    READY = "READY"
    ARCHIVED = "ARCHIVED"


class ModelSortBy(str, Enum):
    UPDATED_AT_DESC = "updated_at_desc"
    CREATED_AT_DESC = "created_at_desc"
    NAME_ASC = "name_asc"


class ModelAssetResponse(BaseModel):
    asset_id: str
    model_id: str
    original_filename: str
    mime_type: str
    file_size_bytes: int
    width: int | None = None
    height: int | None = None
    storage_path: str  # Relative path in LOCAL_STORAGE_ROOT
    view_url: str  # Local media retrieval endpoint
    thumbnail_url: str | None = None
    order_index: int = 0
    is_cover: bool = False
    created_at: str


class ModelProfileSummaryResponse(BaseModel):
    model_id: str
    model_code: str
    display_name: str
    description: str | None = None
    cover_asset_id: str | None = None
    cover_image_url: str | None = None
    status: ModelStatus
    model_version: int = 1
    reference_assets_count: int = 0
    used_in_projects_count: int = 0
    created_at: str
    updated_at: str


class ModelProfileDetailResponse(BaseModel):
    model_id: str
    model_code: str
    display_name: str
    description: str | None = None
    cover_asset_id: str | None = None
    cover_image_url: str | None = None
    status: ModelStatus
    model_version: int = 1
    same_model_confirmed: bool = False
    usage_rights_confirmed: bool = False
    reference_assets: list[ModelAssetResponse] = Field(default_factory=list)
    used_in_projects_count: int = 0
    created_at: str
    updated_at: str


class ModelListResponse(BaseModel):
    items: list[ModelProfileSummaryResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class UpdateIdentityRequest(BaseModel):
    display_name: str = Field(..., min_length=2, max_length=60)
    description: str | None = Field(None, max_length=500)


class ReorderAssetsRequest(BaseModel):
    asset_ids_in_order: list[str]
    cover_asset_id: str | None = None


class FinalizeModelRequest(BaseModel):
    same_model_confirmed: bool
    usage_rights_confirmed: bool


class UpdateModelRequest(BaseModel):
    display_name: str | None = Field(None, min_length=2, max_length=60)
    description: str | None = Field(None, max_length=500)
    cover_asset_id: str | None = None
    asset_ids_in_order: list[str] | None = None
