import asyncio
import hashlib
import json
import logging
import re
import threading
import uuid
from datetime import UTC, datetime
from io import BytesIO
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from PIL import Image

from app.core.config import settings
from app.integrations.product_extractor.registry import (
    product_extractor_registry,
)
from app.schemas.personalization import GenerationStatus
from app.schemas.products import (
    CreateExtractionRequest,
    ExtractedProductData,
    ExtractionJobResponse,
    ExtractionStatus,
    ProductAssetResponse,
    ProductAssetSummaryResponse,
    ProductImageSource,
    SaveProductAssetRequest,
    UpdateProductAssetRequest,
)
from app.services.storage import register_asset_metadata, storage_service
from app.services.url_resolver import (
    SSRFValidationError,
    SafeUrlResolver,
)

logger = logging.getLogger(__name__)

# In-memory stores backed by persistent local JSON on disk
_EXTRACTION_JOBS_DB: dict[str, dict[str, Any]] = {}
_PRODUCT_ASSETS_DB: dict[str, dict[str, Any]] = {}


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _get_db_dir() -> Path:
    db_dir = settings.storage_root_path.parent / "db"
    db_dir.mkdir(parents=True, exist_ok=True)
    return db_dir


def _save_db_to_disk() -> None:
    """Persists product assets and extraction jobs to local filesystem JSON."""
    try:
        db_dir = _get_db_dir()
        assets_file = db_dir / "product_assets.json"
        temp_file = db_dir / "product_assets.json.tmp"
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(_PRODUCT_ASSETS_DB, f, ensure_ascii=False, indent=2)
        temp_file.replace(assets_file)
    except Exception as e:
        logger.error(f"Error saving product assets to disk: {e}")


def _load_db_from_disk() -> None:
    """Restores product assets from local filesystem JSON if present."""
    try:
        db_dir = _get_db_dir()
        assets_file = db_dir / "product_assets.json"
        if assets_file.exists():
            with open(assets_file, encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    _PRODUCT_ASSETS_DB.update(data)
                    logger.info(f"Loaded {len(_PRODUCT_ASSETS_DB)} product assets from disk.")
    except Exception as e:
        logger.error(f"Error loading product assets from disk: {e}")


# Initialize load on module import
_load_db_from_disk()


class ProductExtractionService:
    """
    Manages URL validation, metadata parsing, robust image collection,
    deduplication, and persistent Product Asset storage within Projects.
    """

    def _get_project(self, project_id: str) -> dict[str, Any]:
        from app.services.personalization import _PROJECTS_DB

        project = _PROJECTS_DB.get(project_id)
        if not project:
            raise ValueError(f"Không tìm thấy dự án '{project_id}'.")
        return project

    def _verify_project_base_video(self, project_id: str) -> None:
        """
        Ensures Project has at least one valid, COMPLETED Personalized Base Video
        before allowing Product extraction workflow as specified in Section 4.
        """
        from app.services.personalization import _GENERATIONS_DB, _PROJECTS_DB

        project = self._get_project(project_id)
        generations = project.get("generations", [])

        has_completed_base_video = False
        for gen_id in generations:
            gen_data = _GENERATIONS_DB.get(gen_id)
            if gen_data and gen_data.get("status") == GenerationStatus.COMPLETED.value:
                has_completed_base_video = True
                break

        if not has_completed_base_video:
            raise ValueError(
                "Dự án này chưa có Personalized Base Video hoàn tất. "
                "Vui lòng hoàn thành bước Model Personalization trước khi nhập sản phẩm."
            )

    def create_extraction_job(
        self, project_id: str, user_id: str, request: CreateExtractionRequest
    ) -> ExtractionJobResponse:
        project = self._get_project(project_id)
        if project["user_id"] != user_id:
            raise PermissionError("Bạn không có quyền thao tác trên dự án này.")

        self._verify_project_base_video(project_id)

        clean_url = request.url.strip()
        parsed = urlparse(clean_url)
        canonical_test = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/")

        # Check duplicate in this project unless force_reextract requested
        if not request.force_reextract:
            for prod in _PRODUCT_ASSETS_DB.values():
                if prod["project_id"] == project_id and not prod.get("is_archived"):
                    prod_url_clean = prod["source_url"].strip().rstrip("/")
                    prod_canonical = (prod.get("canonical_url") or "").strip().rstrip("/")
                    if clean_url.rstrip("/") == prod_url_clean or canonical_test == prod_canonical:
                        # Duplicate found
                        job_id = str(uuid.uuid4())
                        dup_job = {
                            "job_id": job_id,
                            "project_id": project_id,
                            "user_id": user_id,
                            "source_url": clean_url,
                            "status": ExtractionStatus.COMPLETED.value,
                            "current_step": "Sản phẩm đã tồn tại trong dự án",
                            "progress": 100,
                            "created_at": _now_iso(),
                            "completed_at": _now_iso(),
                            "error_code": None,
                            "error_message": None,
                            "extracted_data": None,
                            "existing_product_id": prod["product_id"],
                        }
                        _EXTRACTION_JOBS_DB[job_id] = dup_job
                        return ExtractionJobResponse(**dup_job)

        job_id = str(uuid.uuid4())
        job_record: dict[str, Any] = {
            "job_id": job_id,
            "project_id": project_id,
            "user_id": user_id,
            "source_url": clean_url,
            "status": ExtractionStatus.PENDING.value,
            "current_step": "Đang chuẩn bị trích xuất dữ liệu sản phẩm",
            "progress": 5,
            "created_at": _now_iso(),
            "completed_at": None,
            "error_code": None,
            "error_message": None,
            "extracted_data": None,
            "existing_product_id": None,
        }
        _EXTRACTION_JOBS_DB[job_id] = job_record

        # Launch background pipeline thread
        threading.Thread(
            target=lambda: asyncio.run(self._run_extraction_pipeline(job_id)),
            daemon=True,
        ).start()

        return ExtractionJobResponse(**job_record)

    def get_extraction_job(
        self, project_id: str, job_id: str, user_id: str
    ) -> ExtractionJobResponse:
        job = _EXTRACTION_JOBS_DB.get(job_id)
        if not job or job["project_id"] != project_id:
            raise ValueError(f"Không tìm thấy tác vụ trích xuất '{job_id}'.")
        if job["user_id"] != user_id:
            raise PermissionError("Bạn không có quyền truy cập tác vụ này.")

        return ExtractionJobResponse(**job)

    def cancel_extraction_job(
        self, project_id: str, job_id: str, user_id: str
    ) -> ExtractionJobResponse:
        job = _EXTRACTION_JOBS_DB.get(job_id)
        if not job or job["project_id"] != project_id:
            raise ValueError(f"Không tìm thấy tác vụ trích xuất '{job_id}'.")
        if job["user_id"] != user_id:
            raise PermissionError("Bạn không có quyền thao tác trên tác vụ này.")

        if job["status"] not in (
            ExtractionStatus.COMPLETED.value,
            ExtractionStatus.FAILED.value,
            ExtractionStatus.CANCELLED.value,
        ):
            job["status"] = ExtractionStatus.CANCELLED.value
            job["current_step"] = "Đã hủy tác vụ trích xuất"
            job["completed_at"] = _now_iso()

        return ExtractionJobResponse(**job)

    async def _run_extraction_pipeline(self, job_id: str) -> None:
        job = _EXTRACTION_JOBS_DB.get(job_id)
        if not job or job["status"] == ExtractionStatus.CANCELLED.value:
            return

        user_id = job["user_id"]
        project_id = job["project_id"]
        raw_url = job["source_url"]

        warnings: list[str] = []

        try:
            # Step 1: Analyzing URL & SSRF Validation
            job["status"] = ExtractionStatus.ANALYZING_URL.value
            job["current_step"] = "Đang kiểm tra đường dẫn & chống truy cập trái phép"
            job["progress"] = 15

            try:
                sanitized_url, hostname, port = SafeUrlResolver.validate_url(raw_url)
            except SSRFValidationError as e:
                job["status"] = ExtractionStatus.FAILED.value
                job["error_code"] = "SSRF_VALIDATION_ERROR"
                job["error_message"] = str(e)
                job["completed_at"] = _now_iso()
                return

            parsed_domain = hostname

            # Step 2: Fetching HTML & Parsing Metadata
            job["status"] = ExtractionStatus.FETCHING_METADATA.value
            job["current_step"] = "Đang truy xuất thông tin & phân tích trang sản phẩm"
            job["progress"] = 35

            try:
                final_url, html_content, _ = await SafeUrlResolver.fetch_html(sanitized_url)
            except Exception as e:
                job["status"] = ExtractionStatus.FAILED.value
                job["error_code"] = "FETCH_HTML_FAILED"
                job["error_message"] = f"Không thể tải nội dung trang sản phẩm: {e}"
                job["completed_at"] = _now_iso()
                return

            if job["status"] == ExtractionStatus.CANCELLED.value:
                return

            # Extract metadata using multi-tier registry
            raw_meta = product_extractor_registry.extract_all(final_url, html_content)
            title = raw_meta.title or f"Sản phẩm từ {parsed_domain}"

            # Step 3: Downloading & Verifying Images
            job["status"] = ExtractionStatus.DOWNLOADING_IMAGES.value
            job["current_step"] = "Đang thu thập và xác minh ảnh gốc"
            job["progress"] = 55

            # Prepare storage directory
            prod_temp_id = str(uuid.uuid4())
            rel_source_dir = f"users/{user_id}/projects/{project_id}/products/{prod_temp_id}/source"
            abs_source_dir = storage_service.resolve_safe_path(rel_source_dir)
            abs_source_dir.mkdir(parents=True, exist_ok=True)

            downloaded_images: list[ProductImageSource] = []
            seen_checksums: set[str] = set()

            candidate_urls = raw_meta.image_urls[:25]  # Limit up to 25 candidate images
            total_candidates = len(candidate_urls)
            failed_downloads = 0

            for idx, img_url in enumerate(candidate_urls):
                if job["status"] == ExtractionStatus.CANCELLED.value:
                    return

                try:
                    raw_bytes, resp_content_type = await SafeUrlResolver.fetch_image(img_url)
                except Exception as e:
                    logger.warning(f"Failed downloading image {img_url}: {e}")
                    failed_downloads += 1
                    continue

                # Verify actual magic bytes
                mime_type = self._detect_image_mime(raw_bytes)
                if not mime_type:
                    logger.warning(f"Rejected image {img_url} due to invalid magic bytes.")
                    failed_downloads += 1
                    continue

                # Checksum & Deduplication
                checksum = hashlib.sha256(raw_bytes).hexdigest()
                if checksum in seen_checksums:
                    continue  # Deduplicate identical image
                seen_checksums.add(checksum)

                # Determine dimensions with PIL
                width, height = None, None
                try:
                    with Image.open(BytesIO(raw_bytes)) as pil_img:
                        width, height = pil_img.size
                except Exception:
                    pass

                # Extension from verified mime
                ext = "jpg"
                if mime_type == "image/png":
                    ext = "png"
                elif mime_type == "image/webp":
                    ext = "webp"
                elif mime_type == "image/gif":
                    ext = "gif"

                image_id = str(uuid.uuid4())
                filename = f"{len(downloaded_images) + 1:02d}_{checksum[:8]}.{ext}"
                target_file = abs_source_dir / filename

                # Atomic write
                temp_file = abs_source_dir / f"{filename}.tmp"
                with open(temp_file, "wb") as f:
                    f.write(raw_bytes)
                temp_file.replace(target_file)

                # Register asset in storage service
                asset_rel_path = f"{rel_source_dir}/{filename}"
                register_asset_metadata(
                    {
                        "asset_id": image_id,
                        "storage_path": asset_rel_path,
                        "mime_type": mime_type,
                        "file_size_bytes": len(raw_bytes),
                        "original_filename": filename,
                    }
                )

                img_source = ProductImageSource(
                    image_id=image_id,
                    source_url=img_url,
                    storage_path=asset_rel_path,
                    view_url=f"/api/v1/assets/{image_id}/view",
                    thumbnail_url=f"/api/v1/assets/{image_id}/view",
                    file_size_bytes=len(raw_bytes),
                    width=width,
                    height=height,
                    mime_type=mime_type,
                    checksum_sha256=checksum,
                    order_index=len(downloaded_images),
                    is_primary=(len(downloaded_images) == 0),
                    created_at=_now_iso(),
                )
                downloaded_images.append(img_source)

                # Update progress smoothly
                step_progress = 55 + int((idx + 1) / max(1, total_candidates) * 35)
                job["progress"] = min(92, step_progress)

            # Evaluate completion state
            if not downloaded_images:
                job["status"] = ExtractionStatus.FAILED.value
                job["error_code"] = "NO_VALID_IMAGES"
                job["error_message"] = "Không thể tải được hình ảnh sản phẩm hợp lệ nào từ trang web."
                job["completed_at"] = _now_iso()
                return

            is_partial = False
            if failed_downloads > 0:
                is_partial = True
                warnings.append(f"Có {failed_downloads} ảnh không thể tải hoặc định dạng không hợp lệ.")
            if len(downloaded_images) == 1:
                warnings.append("Chỉ tìm thấy 1 ảnh sản phẩm. Nên bổ sung thêm các góc chụp khác nếu có.")

            extracted_data = ExtractedProductData(
                title=title,
                description=raw_meta.description,
                brand=raw_meta.brand,
                category=raw_meta.category,
                price=raw_meta.price,
                currency=raw_meta.currency,
                sku=raw_meta.sku,
                canonical_url=raw_meta.canonical_url,
                source_domain=parsed_domain,
                variants=raw_meta.variants,
                images=downloaded_images,
                warnings=warnings,
                is_partial=is_partial,
            )

            job["status"] = (
                ExtractionStatus.PARTIAL.value if is_partial else ExtractionStatus.COMPLETED.value
            )
            job["current_step"] = (
                "Thu thập dữ liệu hoàn tất một phần"
                if is_partial
                else "Đã hoàn tất trích xuất dữ liệu sản phẩm"
            )
            job["progress"] = 100
            job["completed_at"] = _now_iso()
            job["extracted_data"] = extracted_data.model_dump()

        except Exception as e:
            logger.error(f"Unexpected error in extraction pipeline: {e}", exc_info=True)
            job["status"] = ExtractionStatus.FAILED.value
            job["error_code"] = "INTERNAL_EXTRACTION_ERROR"
            job["error_message"] = f"Lỗi nội bộ khi xử lý trích xuất sản phẩm: {e}"
            job["completed_at"] = _now_iso()

    @staticmethod
    def _detect_image_mime(data: bytes) -> str | None:
        if len(data) < 12:
            return None
        # JPEG: FF D8 FF
        if data[:3] == b"\xff\xd8\xff":
            return "image/jpeg"
        # PNG: 89 50 4E 47 0D 0A 1A 0A
        if data[:8] == b"\x89PNG\r\n\x1a\n":
            return "image/png"
        # WebP: RIFF .... WEBP
        if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
            return "image/webp"
        # GIF: GIF87a or GIF89a
        if data[:6] in (b"GIF87a", b"GIF89a"):
            return "image/gif"
        return None

    def save_product_asset(
        self, project_id: str, user_id: str, request: SaveProductAssetRequest
    ) -> ProductAssetResponse:
        job = _EXTRACTION_JOBS_DB.get(request.extraction_job_id)
        if not job or job["project_id"] != project_id:
            raise ValueError(f"Không tìm thấy tác vụ trích xuất '{request.extraction_job_id}'.")
        if job["user_id"] != user_id:
            raise PermissionError("Bạn không có quyền lưu sản phẩm từ tác vụ này.")

        if job["status"] not in (
            ExtractionStatus.COMPLETED.value,
            ExtractionStatus.PARTIAL.value,
        ) or not job.get("extracted_data"):
            raise ValueError("Tác vụ trích xuất chưa hoàn thành hoặc không có dữ liệu hợp lệ.")

        ext_data = job["extracted_data"]
        raw_images = ext_data.get("images", [])

        # Filter selected images if specified
        final_images: list[dict[str, Any]] = []
        if request.selected_image_ids:
            selected_set = set(request.selected_image_ids)
            for img in raw_images:
                if img["image_id"] in selected_set:
                    final_images.append(img)
        else:
            final_images = list(raw_images)

        if not final_images:
            raise ValueError("Cần chọn ít nhất một ảnh sản phẩm để lưu vào dự án.")

        # Assign primary image
        primary_id = request.primary_image_id or final_images[0]["image_id"]
        for img in final_images:
            img["is_primary"] = img["image_id"] == primary_id

        primary_url = None
        for img in final_images:
            if img["is_primary"]:
                primary_url = img["view_url"]
                break

        product_id = str(uuid.uuid4())
        now = _now_iso()

        asset_record: dict[str, Any] = {
            "product_id": product_id,
            "project_id": project_id,
            "user_id": user_id,
            "source_url": job["source_url"],
            "canonical_url": ext_data.get("canonical_url"),
            "source_domain": ext_data.get("source_domain", ""),
            "title": ext_data.get("title", ""),
            "custom_title": request.custom_title.strip() if request.custom_title else None,
            "description": ext_data.get("description"),
            "custom_description": (
                request.custom_description.strip() if request.custom_description else None
            ),
            "brand": ext_data.get("brand"),
            "category": ext_data.get("category"),
            "price": ext_data.get("price"),
            "currency": ext_data.get("currency"),
            "sku": ext_data.get("sku"),
            "variants": ext_data.get("variants", []),
            "images": final_images,
            "primary_image_url": primary_url,
            "total_images_count": len(final_images),
            "extraction_status": job["status"],
            "warnings": ext_data.get("warnings", []),
            "is_archived": False,
            "created_at": now,
            "updated_at": now,
        }

        _PRODUCT_ASSETS_DB[product_id] = asset_record
        _save_db_to_disk()

        return ProductAssetResponse(**asset_record)

    def list_products(
        self,
        project_id: str,
        user_id: str,
        search: str | None = None,
        include_archived: bool = False,
    ) -> list[ProductAssetSummaryResponse]:
        project = self._get_project(project_id)
        if project["user_id"] != user_id:
            raise PermissionError("Bạn không có quyền truy cập sản phẩm của dự án này.")

        items = []
        for p in _PRODUCT_ASSETS_DB.values():
            if p["project_id"] != project_id:
                continue
            if not include_archived and p.get("is_archived"):
                continue

            if search:
                term = search.lower()
                title_match = term in p["title"].lower() or (
                    p.get("custom_title") and term in p["custom_title"].lower()
                )
                domain_match = term in p["source_domain"].lower()
                if not (title_match or domain_match):
                    continue

            items.append(
                ProductAssetSummaryResponse(
                    product_id=p["product_id"],
                    project_id=p["project_id"],
                    source_url=p["source_url"],
                    source_domain=p["source_domain"],
                    title=p.get("custom_title") or p["title"],
                    custom_title=p.get("custom_title"),
                    brand=p.get("brand"),
                    price=p.get("price"),
                    currency=p.get("currency"),
                    primary_image_url=p.get("primary_image_url"),
                    total_images_count=p.get("total_images_count", len(p.get("images", []))),
                    extraction_status=ExtractionStatus(p["extraction_status"]),
                    is_archived=bool(p.get("is_archived")),
                    created_at=p["created_at"],
                    updated_at=p["updated_at"],
                )
            )

        items.sort(key=lambda x: x.created_at, reverse=True)
        return items

    def get_product(
        self, project_id: str, product_id: str, user_id: str
    ) -> ProductAssetResponse:
        p = _PRODUCT_ASSETS_DB.get(product_id)
        if not p or p["project_id"] != project_id:
            raise ValueError(f"Không tìm thấy sản phẩm '{product_id}' trong dự án này.")
        if p["user_id"] != user_id:
            raise PermissionError("Bạn không có quyền truy cập sản phẩm này.")

        return ProductAssetResponse(**p)

    def update_product(
        self,
        project_id: str,
        product_id: str,
        user_id: str,
        request: UpdateProductAssetRequest,
    ) -> ProductAssetResponse:
        p = _PRODUCT_ASSETS_DB.get(product_id)
        if not p or p["project_id"] != project_id:
            raise ValueError(f"Không tìm thấy sản phẩm '{product_id}' trong dự án này.")
        if p["user_id"] != user_id:
            raise PermissionError("Bạn không có quyền chỉnh sửa sản phẩm này.")

        if request.custom_title is not None:
            p["custom_title"] = request.custom_title.strip() if request.custom_title else None
        if request.custom_description is not None:
            p["custom_description"] = (
                request.custom_description.strip() if request.custom_description else None
            )
        if request.primary_image_id:
            found = False
            for img in p.get("images", []):
                if img["image_id"] == request.primary_image_id:
                    img["is_primary"] = True
                    p["primary_image_url"] = img["view_url"]
                    found = True
                else:
                    img["is_primary"] = False
            if not found:
                raise ValueError(f"Không tìm thấy ảnh '{request.primary_image_id}' trong sản phẩm này.")

        if request.is_archived is not None:
            p["is_archived"] = request.is_archived

        p["updated_at"] = _now_iso()
        _save_db_to_disk()
        return ProductAssetResponse(**p)

    def delete_product(self, project_id: str, product_id: str, user_id: str) -> None:
        p = _PRODUCT_ASSETS_DB.get(product_id)
        if not p or p["project_id"] != project_id:
            raise ValueError(f"Không tìm thấy sản phẩm '{product_id}' trong dự án này.")
        if p["user_id"] != user_id:
            raise PermissionError("Bạn không có quyền xóa sản phẩm này.")

        # Soft delete / archive
        p["is_archived"] = True
        p["updated_at"] = _now_iso()
        _save_db_to_disk()


product_extraction_service = ProductExtractionService()
