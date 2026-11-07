from fastapi import APIRouter, HTTPException, Request, status

from app.services.storage import storage_service

router = APIRouter(prefix="/assets", tags=["Assets"])

# Global in-memory asset registry (mapping asset_id -> asset_dict)
# Allows lookup across models, projects, and templates
_ASSETS_REGISTRY: dict[str, dict] = {}


def register_asset_metadata(asset_record: dict) -> None:
    """Registers asset record in the centralized lookup registry."""
    _ASSETS_REGISTRY[asset_record["asset_id"]] = asset_record


def unregister_asset_metadata(asset_id: str) -> None:
    """Removes asset record from registry."""
    _ASSETS_REGISTRY.pop(asset_id, None)


def get_asset_metadata(asset_id: str) -> dict | None:
    """Retrieves asset record by asset_id."""
    return _ASSETS_REGISTRY.get(asset_id)


@router.get("/{asset_id}/view")
async def view_asset(asset_id: str, request: Request):
    """
    Streams an asset's original file from local filesystem storage.
    Supports HTTP Range requests (RFC 7233) for chunked video/audio delivery.
    """
    asset = get_asset_metadata(asset_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy tài nguyên trên hệ thống.",
        )

    storage_path = asset.get("storage_path")
    if not storage_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tài nguyên chưa có đường dẫn tệp tin cục bộ.",
        )

    mime_type = asset.get("mime_type", "application/octet-stream")
    return storage_service.stream_file_with_range(
        relative_path=storage_path,
        request=request,
        media_type=mime_type,
    )


@router.get("/{asset_id}/thumbnail")
async def get_asset_thumbnail(asset_id: str, request: Request):
    """
    Streams the thumbnail representation of an asset.
    Falls back to the original file if a dedicated thumbnail does not exist.
    """
    asset = get_asset_metadata(asset_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy tài nguyên.",
        )

    thumbnail_storage_path = asset.get("thumbnail_storage_path")
    if thumbnail_storage_path:
        try:
            target = storage_service.resolve_safe_path(thumbnail_storage_path)
            if target.is_file():
                return storage_service.stream_file_with_range(
                    relative_path=thumbnail_storage_path,
                    request=request,
                    media_type="image/jpeg",
                )
        except (OSError, ValueError):
            # If thumbnail cannot be resolved or is invalid, fallback to original
            pass

    # Fallback to original asset
    storage_path = asset.get("storage_path")
    if not storage_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tệp tin không tồn tại.",
        )

    mime_type = asset.get("mime_type", "image/jpeg")
    return storage_service.stream_file_with_range(
        relative_path=storage_path,
        request=request,
        media_type=mime_type,
    )


@router.get("/{asset_id}/stream")
async def stream_video_asset(asset_id: str, request: Request):
    """
    Dedicated video streaming endpoint with full HTTP Range request support (Status 206),
    enabling HTML5 video seeking and partial loading with zero RAM overload.
    """
    asset = get_asset_metadata(asset_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy video.",
        )

    storage_path = asset.get("storage_path")
    if not storage_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Đường dẫn video không hợp lệ.",
        )

    mime_type = asset.get("mime_type", "video/mp4")
    return storage_service.stream_file_with_range(
        relative_path=storage_path,
        request=request,
        media_type=mime_type,
    )
