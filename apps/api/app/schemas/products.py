from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class ExtractionStatus(str, Enum):
    PENDING = "PENDING"
    ANALYZING_URL = "ANALYZING_URL"
    FETCHING_METADATA = "FETCHING_METADATA"
    DOWNLOADING_IMAGES = "DOWNLOADING_IMAGES"
    COMPLETED = "COMPLETED"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class ProductImageSource(BaseModel):
    image_id: str
    source_url: str
    storage_path: str
    view_url: str
    thumbnail_url: str | None = None
    file_size_bytes: int
    width: int | None = None
    height: int | None = None
    mime_type: str
    checksum_sha256: str
    order_index: int = 0
    is_primary: bool = False
    created_at: str


class ExtractedProductData(BaseModel):
    title: str
    description: str | None = None
    brand: str | None = None
    category: str | None = None
    price: float | None = None
    currency: str | None = None
    sku: str | None = None
    canonical_url: str | None = None
    source_domain: str
    variants: list[dict[str, Any]] = Field(default_factory=list)
    images: list[ProductImageSource] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    is_partial: bool = False
    failure_reason: str | None = None


class CreateExtractionRequest(BaseModel):
    url: str
    force_reextract: bool = False


class ExtractionJobResponse(BaseModel):
    job_id: str
    project_id: str
    user_id: str
    source_url: str
    status: ExtractionStatus
    current_step: str
    progress: int
    created_at: str
    completed_at: str | None = None
    error_code: str | None = None
    error_message: str | None = None
    extracted_data: ExtractedProductData | None = None
    existing_product_id: str | None = None


class SaveProductAssetRequest(BaseModel):
    extraction_job_id: str
    custom_title: str | None = None
    custom_description: str | None = None
    primary_image_id: str | None = None
    selected_image_ids: list[str] | None = None


class ProductAssetResponse(BaseModel):
    product_id: str
    project_id: str
    user_id: str
    source_url: str
    canonical_url: str | None = None
    source_domain: str
    title: str
    custom_title: str | None = None
    description: str | None = None
    custom_description: str | None = None
    brand: str | None = None
    category: str | None = None
    price: float | None = None
    currency: str | None = None
    sku: str | None = None
    variants: list[dict[str, Any]] = Field(default_factory=list)
    images: list[ProductImageSource] = Field(default_factory=list)
    primary_image_url: str | None = None
    total_images_count: int = 0
    extraction_status: ExtractionStatus
    warnings: list[str] = Field(default_factory=list)
    is_archived: bool = False
    created_at: str
    updated_at: str


class ProductAssetSummaryResponse(BaseModel):
    product_id: str
    project_id: str
    source_url: str
    source_domain: str
    title: str
    custom_title: str | None = None
    brand: str | None = None
    price: float | None = None
    currency: str | None = None
    primary_image_url: str | None = None
    total_images_count: int = 0
    extraction_status: ExtractionStatus
    is_archived: bool = False
    created_at: str
    updated_at: str


class UpdateProductAssetRequest(BaseModel):
    custom_title: str | None = None
    custom_description: str | None = None
    primary_image_id: str | None = None
    is_archived: bool | None = None
