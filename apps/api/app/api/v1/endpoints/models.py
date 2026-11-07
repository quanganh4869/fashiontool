import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status

from app.api.v1.endpoints.assets import (
    register_asset_metadata,
    unregister_asset_metadata,
)
from app.core.config import settings
from app.schemas.models import (
    FinalizeModelRequest,
    ModelAssetResponse,
    ModelListResponse,
    ModelProfileDetailResponse,
    ModelProfileSummaryResponse,
    ModelSortBy,
    ModelStatus,
    ReorderAssetsRequest,
    UpdateIdentityRequest,
    UpdateModelRequest,
)
from app.services.storage import storage_service

router = APIRouter(prefix="/models", tags=["Models"])

# In-memory repository for runtime persistence before DB migration
_MODELS_DB: dict[str, dict] = {}
_CODE_COUNTER = 100


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _next_model_code() -> str:
    global _CODE_COUNTER
    _CODE_COUNTER += 1
    return f"MOD-{_CODE_COUNTER:06d}"


def _build_summary(model: dict) -> ModelProfileSummaryResponse:
    cover_asset_id = model.get("cover_asset_id")
    cover_image_url = None
    if cover_asset_id:
        for a in model["reference_assets"]:
            if a["asset_id"] == cover_asset_id:
                cover_image_url = a["view_url"]
                break
    elif model["reference_assets"]:
        cover_image_url = model["reference_assets"][0]["view_url"]
        cover_asset_id = model["reference_assets"][0]["asset_id"]

    return ModelProfileSummaryResponse(
        model_id=model["model_id"],
        model_code=model["model_code"],
        display_name=model["display_name"],
        description=model.get("description"),
        cover_asset_id=cover_asset_id,
        cover_image_url=cover_image_url,
        status=model["status"],
        model_version=model.get("model_version", 1),
        reference_assets_count=len(model.get("reference_assets", [])),
        used_in_projects_count=model.get("used_in_projects_count", 0),
        created_at=model["created_at"],
        updated_at=model["updated_at"],
    )


def _build_detail(model: dict) -> ModelProfileDetailResponse:
    cover_asset_id = model.get("cover_asset_id")
    cover_image_url = None
    if cover_asset_id:
        for a in model["reference_assets"]:
            if a["asset_id"] == cover_asset_id:
                cover_image_url = a["view_url"]
                break
    elif model["reference_assets"]:
        cover_image_url = model["reference_assets"][0]["view_url"]
        cover_asset_id = model["reference_assets"][0]["asset_id"]

    return ModelProfileDetailResponse(
        model_id=model["model_id"],
        model_code=model["model_code"],
        display_name=model["display_name"],
        description=model.get("description"),
        cover_asset_id=cover_asset_id,
        cover_image_url=cover_image_url,
        status=model["status"],
        model_version=model.get("model_version", 1),
        same_model_confirmed=model.get("same_model_confirmed", False),
        usage_rights_confirmed=model.get("usage_rights_confirmed", False),
        reference_assets=[
            ModelAssetResponse(**a) for a in model.get("reference_assets", [])
        ],
        used_in_projects_count=model.get("used_in_projects_count", 0),
        created_at=model["created_at"],
        updated_at=model["updated_at"],
    )


@router.get("", response_model=ModelListResponse)
async def list_models(
    query: str | None = Query(None, description="Search by name or code"),
    status: str | None = Query(
        "ALL", description="Filter by status: ALL, READY, DRAFT, ARCHIVED"
    ),
    sort_by: ModelSortBy = Query(ModelSortBy.UPDATED_AT_DESC, description="Sort order"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
):
    """
    List user's Model Profiles with search, filtering, and sorting.
    """
    items = list(_MODELS_DB.values())

    # Status filter
    if status and status != "ALL":
        items = [m for m in items if m["status"] == status]

    # Search filter
    if query:
        q_lower = query.strip().lower()
        items = [
            m
            for m in items
            if q_lower in m["display_name"].lower()
            or q_lower in m["model_code"].lower()
        ]

    # Sorting
    if sort_by == ModelSortBy.NAME_ASC:
        items.sort(key=lambda x: x["display_name"].lower())
    elif sort_by == ModelSortBy.CREATED_AT_DESC:
        items.sort(key=lambda x: x["created_at"], reverse=True)
    else:  # UPDATED_AT_DESC
        items.sort(key=lambda x: x["updated_at"], reverse=True)

    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    paginated_items = items[start:end]

    total_pages = max(1, (total + limit - 1) // limit) if total > 0 else 1

    return ModelListResponse(
        items=[_build_summary(m) for m in paginated_items],
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


@router.post(
    "/draft",
    response_model=ModelProfileDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_draft_model():
    """
    Initializes a new DRAFT model profile and returns assigned model_id and model_code.
    """
    model_id = str(uuid.uuid4())
    model_code = _next_model_code()
    now = _now_iso()

    model_record = {
        "model_id": model_id,
        "model_code": model_code,
        "display_name": "",
        "description": "",
        "cover_asset_id": None,
        "status": ModelStatus.DRAFT.value,
        "model_version": 1,
        "same_model_confirmed": False,
        "usage_rights_confirmed": False,
        "reference_assets": [],
        "used_in_projects_count": 0,
        "created_at": now,
        "updated_at": now,
    }
    _MODELS_DB[model_id] = model_record
    return _build_detail(model_record)


@router.get("/{model_id}", response_model=ModelProfileDetailResponse)
async def get_model_detail(model_id: str):
    """
    Returns complete profile of a Model including reference assets and status.
    """
    model = _MODELS_DB.get(model_id)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hồ sơ người mẫu.",
        )
    return _build_detail(model)


@router.patch("/{model_id}/identity", response_model=ModelProfileDetailResponse)
async def update_model_identity(model_id: str, body: UpdateIdentityRequest):
    """
    Step 1 Identity setup: updates display name and description.
    """
    model = _MODELS_DB.get(model_id)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hồ sơ người mẫu.",
        )

    trimmed_name = body.display_name.strip()
    if len(trimmed_name) < 2 or len(trimmed_name) > 60:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Tên người mẫu phải từ 2 đến 60 ký tự.",
        )

    model["display_name"] = trimmed_name
    model["description"] = body.description.strip() if body.description else ""
    model["updated_at"] = _now_iso()
    return _build_detail(model)


@router.post(
    "/{model_id}/assets/upload",
    response_model=ModelAssetResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_model_asset(
    model_id: str,
    file: UploadFile = File(...),
):
    """
    Direct multipart/form-data upload for reference photos.
    Validates limits (max 20 photos, 15MB, JPG/PNG/WebP magic bytes).
    Saves file to Local Filesystem Storage (LOCAL_STORAGE_ROOT) and returns asset metadata.
    """
    model = _MODELS_DB.get(model_id)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hồ sơ người mẫu.",
        )

    if len(model["reference_assets"]) >= 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hồ sơ đã đạt số lượng ảnh tối đa (tối đa 20 ảnh).",
        )

    # 1. Stream file to local temp directory with size limit and magic-bytes check
    (
        temp_path,
        detected_mime,
        file_size,
        _sha256_hex,
    ) = await storage_service.save_temp_upload(
        file=file,
        max_size_bytes=settings.MAX_UPLOAD_SIZE_BYTES,
        allowed_mimes={"image/jpeg", "image/png", "image/webp"},
    )

    asset_id = str(uuid.uuid4())
    ext = (
        "jpg"
        if detected_mime == "image/jpeg"
        else ("png" if detected_mime == "image/png" else "webp")
    )
    version_id = model.get("model_version", 1)
    user_id = "default_user"

    # 2. Hierarchical relative storage path
    storage_path = f"users/{user_id}/models/{model_id}/versions/{version_id}/original/{asset_id}.{ext}"

    # 3. Promote temp file atomically to target path
    try:
        storage_service.move_temp_to_target(temp_path, storage_path)
    except (OSError, ValueError) as e:
        storage_service.cleanup_temp_file(temp_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lưu trữ tệp tin cục bộ: {e!s}",
        ) from e

    # 4. Record asset metadata
    order_index = len(model["reference_assets"])
    is_cover = order_index == 0 or model.get("cover_asset_id") is None
    view_url = f"/api/v1/assets/{asset_id}/view"
    thumbnail_url = f"/api/v1/assets/{asset_id}/thumbnail"

    asset_record = {
        "asset_id": asset_id,
        "model_id": model_id,
        "original_filename": storage_service.sanitize_filename(
            file.filename or f"photo-{asset_id[:8]}.{ext}"
        ),
        "mime_type": detected_mime,
        "file_size_bytes": file_size,
        "width": 1080,
        "height": 1440,
        "storage_path": storage_path,
        "view_url": view_url,
        "thumbnail_url": thumbnail_url,
        "order_index": order_index,
        "is_cover": is_cover,
        "created_at": _now_iso(),
    }

    # Register in centralized asset lookup
    register_asset_metadata(asset_record)

    model["reference_assets"].append(asset_record)
    if is_cover:
        model["cover_asset_id"] = asset_id
        for a in model["reference_assets"]:
            a["is_cover"] = a["asset_id"] == asset_id

    model["updated_at"] = _now_iso()
    return ModelAssetResponse(**asset_record)


@router.patch("/{model_id}/assets/order", response_model=ModelProfileDetailResponse)
async def update_assets_order(model_id: str, body: ReorderAssetsRequest):
    """
    Reorder reference photos and/or set cover photo.
    """
    model = _MODELS_DB.get(model_id)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hồ sơ người mẫu.",
        )

    assets_map = {a["asset_id"]: a for a in model["reference_assets"]}
    ordered_assets = []

    for idx, aid in enumerate(body.asset_ids_in_order):
        if aid in assets_map:
            a = assets_map[aid]
            a["order_index"] = idx
            ordered_assets.append(a)

    for aid, a in assets_map.items():
        if aid not in body.asset_ids_in_order:
            a["order_index"] = len(ordered_assets)
            ordered_assets.append(a)

    model["reference_assets"] = ordered_assets

    if body.cover_asset_id and body.cover_asset_id in assets_map:
        model["cover_asset_id"] = body.cover_asset_id
        for a in model["reference_assets"]:
            a["is_cover"] = a["asset_id"] == body.cover_asset_id

    model["updated_at"] = _now_iso()
    return _build_detail(model)


@router.delete(
    "/{model_id}/assets/{asset_id}", response_model=ModelProfileDetailResponse
)
async def delete_model_asset(model_id: str, asset_id: str):
    """
    Removes a reference photo from the model profile and safely deletes the local file.
    For READY models, forbids deleting the last remaining photo.
    """
    model = _MODELS_DB.get(model_id)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hồ sơ người mẫu.",
        )

    if (
        model["status"] == ModelStatus.READY.value
        and len(model["reference_assets"]) <= 1
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xóa ảnh cuối cùng của hồ sơ đã sẵn sàng. Hãy tải ảnh thay thế trước.",
        )

    target_asset = next(
        (a for a in model["reference_assets"] if a["asset_id"] == asset_id), None
    )
    if target_asset:
        # Delete local file from disk
        storage_path = target_asset.get("storage_path")
        if storage_path:
            storage_service.delete_file(storage_path)
        unregister_asset_metadata(asset_id)

    model["reference_assets"] = [
        a for a in model["reference_assets"] if a["asset_id"] != asset_id
    ]

    if model.get("cover_asset_id") == asset_id:
        if model["reference_assets"]:
            model["cover_asset_id"] = model["reference_assets"][0]["asset_id"]
            model["reference_assets"][0]["is_cover"] = True
        else:
            model["cover_asset_id"] = None

    model["updated_at"] = _now_iso()
    return _build_detail(model)


@router.post("/{model_id}/finalize", response_model=ModelProfileDetailResponse)
async def finalize_model(model_id: str, body: FinalizeModelRequest):
    """
    Step 3 Finalize: Validates all conditions and transitions DRAFT -> READY.
    """
    model = _MODELS_DB.get(model_id)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hồ sơ người mẫu.",
        )

    if not model["display_name"] or len(model["display_name"].strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tên người mẫu không hợp lệ.",
        )

    if not model["reference_assets"] or len(model["reference_assets"]) < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hồ sơ phải có ít nhất 1 ảnh tham chiếu đã tải lên thành công.",
        )

    if not body.same_model_confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn cần xác nhận tất cả ảnh trong hồ sơ thuộc cùng một người mẫu.",
        )

    if not body.usage_rights_confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn cần xác nhận có quyền sử dụng hình ảnh.",
        )

    model["same_model_confirmed"] = True
    model["usage_rights_confirmed"] = True
    model["status"] = ModelStatus.READY.value
    model["updated_at"] = _now_iso()

    return _build_detail(model)


@router.patch("/{model_id}", response_model=ModelProfileDetailResponse)
async def update_model_profile(model_id: str, body: UpdateModelRequest):
    """
    Update READY or DRAFT model profile, incrementing modelVersion.
    """
    model = _MODELS_DB.get(model_id)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hồ sơ người mẫu.",
        )

    if body.display_name is not None:
        name = body.display_name.strip()
        if len(name) < 2 or len(name) > 60:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Tên người mẫu phải từ 2 đến 60 ký tự.",
            )
        model["display_name"] = name

    if body.description is not None:
        model["description"] = body.description.strip()

    if body.cover_asset_id is not None:
        valid_ids = {a["asset_id"] for a in model["reference_assets"]}
        if body.cover_asset_id in valid_ids:
            model["cover_asset_id"] = body.cover_asset_id
            for a in model["reference_assets"]:
                a["is_cover"] = a["asset_id"] == body.cover_asset_id

    if body.asset_ids_in_order is not None:
        assets_map = {a["asset_id"]: a for a in model["reference_assets"]}
        ordered = [
            assets_map[aid] for aid in body.asset_ids_in_order if aid in assets_map
        ]
        for idx, a in enumerate(ordered):
            a["order_index"] = idx
        model["reference_assets"] = ordered

    model["model_version"] = model.get("model_version", 1) + 1
    model["updated_at"] = _now_iso()
    return _build_detail(model)


@router.post("/{model_id}/archive", response_model=ModelProfileDetailResponse)
async def archive_model(model_id: str):
    """
    Moves model to ARCHIVED status. Retains history and project links.
    """
    model = _MODELS_DB.get(model_id)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hồ sơ người mẫu.",
        )

    model["status"] = ModelStatus.ARCHIVED.value
    model["updated_at"] = _now_iso()
    return _build_detail(model)


@router.post("/{model_id}/restore", response_model=ModelProfileDetailResponse)
async def restore_model(model_id: str):
    """
    Restores ARCHIVED model back to READY.
    """
    model = _MODELS_DB.get(model_id)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hồ sơ người mẫu.",
        )

    if not model["reference_assets"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hồ sơ không còn ảnh tham chiếu để khôi phục. Vui lòng thêm ảnh.",
        )

    model["status"] = ModelStatus.READY.value
    model["updated_at"] = _now_iso()
    return _build_detail(model)


@router.delete("/{model_id}")
async def delete_model(model_id: str):
    """
    Deletes DRAFT or unused model profile and all associated local files.
    Forbids deleting models used in projects.
    """
    model = _MODELS_DB.get(model_id)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hồ sơ người mẫu.",
        )

    if model.get("used_in_projects_count", 0) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xóa người mẫu đã được sử dụng trong các dự án video lịch sử. Vui lòng sử dụng tính năng Lưu trữ.",
        )

    # Delete all associated local files
    for a in model.get("reference_assets", []):
        storage_path = a.get("storage_path")
        if storage_path:
            storage_service.delete_file(storage_path)
        unregister_asset_metadata(a["asset_id"])

    del _MODELS_DB[model_id]
    return {"message": "Đã xóa hồ sơ người mẫu.", "model_id": model_id}
