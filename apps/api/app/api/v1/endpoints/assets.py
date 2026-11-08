from fastapi import APIRouter, HTTPException, Request, status

from app.services.storage import (
    _ASSETS_REGISTRY,
    get_asset_metadata,
    register_asset_metadata,
    storage_service,
    unregister_asset_metadata,
)

__all__ = [
    "_ASSETS_REGISTRY",
    "get_asset_metadata",
    "register_asset_metadata",
    "router",
    "unregister_asset_metadata",
]

router = APIRouter(prefix="/assets", tags=["Assets"])


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


@router.get("/media/{media_path:path}")
async def stream_media_direct(media_path: str, request: Request):
    """
    Streams media directly using relative storage path or asset id fallback.
    """
    # 1. Direct file resolution in storage root
    try:
        resolved = storage_service.resolve_safe_path(media_path)
        if resolved.is_file():
            mime = "video/mp4" if resolved.suffix.lower() == ".mp4" else (
                "image/jpeg" if resolved.suffix.lower() in [".jpg", ".jpeg"] else "application/octet-stream"
            )
            return storage_service.stream_file_with_range(
                relative_path=media_path,
                request=request,
                media_type=mime,
            )
    except (ValueError, OSError):
        pass

    # 2. Extract potential asset_id or filename
    clean_id = media_path.split("/")[-1].replace(".mp4", "").replace(".jpg", "")
    asset = get_asset_metadata(clean_id)
    if asset and asset.get("storage_path"):
        return storage_service.stream_file_with_range(
            relative_path=asset["storage_path"],
            request=request,
            media_type=asset.get("mime_type", "video/mp4"),
        )

    # 3. Fallback to any base video if looking for video
    if media_path.endswith(".mp4"):
        asset = get_asset_metadata("any_video")
        if asset and asset.get("storage_path"):
            return storage_service.stream_file_with_range(
                relative_path=asset["storage_path"],
                request=request,
                media_type="video/mp4",
            )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Không tìm thấy tệp tin media tương ứng.",
    )
