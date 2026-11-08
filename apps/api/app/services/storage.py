import hashlib
import json
import logging
import os
import re
import shutil
import uuid
from collections.abc import Generator
from pathlib import Path

from fastapi import HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse, Response, StreamingResponse

from app.core.config import settings


def detect_mime_type_from_header(first_bytes: bytes, fallback_mime: str = "") -> str:
    """
    Inspects leading magic bytes of a file to reliably determine MIME type,
    preventing file extension spoofing or incorrect Content-Type headers.
    """
    if len(first_bytes) >= 3 and first_bytes[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if len(first_bytes) >= 8 and first_bytes[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if (
        len(first_bytes) >= 12
        and first_bytes[:4] == b"RIFF"
        and first_bytes[8:12] == b"WEBP"
    ):
        return "image/webp"
    # MP4 file type detection (ftyp box at byte offset 4)
    if len(first_bytes) >= 12 and first_bytes[4:8] == b"ftyp":
        return "video/mp4"
    if len(first_bytes) >= 4 and first_bytes[:4] == b"\x1a\x45\xdf\xa3":
        return "video/webm"
    return fallback_mime


class LocalStorageService:
    """
    Local Filesystem Storage Service.
    Enforces deterministic path isolation within LOCAL_STORAGE_ROOT,
    path-traversal protection, atomic file promotion, and HTTP Range streaming.
    """

    def __init__(self, root_path: Path | None = None):
        self._root_path = root_path or settings.storage_root_path
        self._temp_dir = self._root_path / "temp"
        self._ensure_storage_structure()

    @property
    def root_path(self) -> Path:
        return self._root_path

    def _ensure_storage_structure(self) -> None:
        """Creates the root and temp directories if they do not yet exist."""
        self._root_path.mkdir(parents=True, exist_ok=True)
        self._temp_dir.mkdir(parents=True, exist_ok=True)

    def resolve_safe_path(self, relative_path: str) -> Path:
        """
        Resolves a relative storage path safely against LOCAL_STORAGE_ROOT.
        Raises ValueError if the path escapes the root directory (path traversal).
        """
        # Strip leading slashes to prevent absolute path interpretation
        cleaned = relative_path.replace("\\", "/").lstrip("/")

        # Guard against traversal patterns
        if ".." in cleaned.split("/"):
            raise ValueError(
                "Path traversal violation: '..' segments are strictly prohibited."
            )

        target = (self._root_path / cleaned).resolve()

        # Verify deterministic boundary
        if not target.is_relative_to(self._root_path):
            raise ValueError(
                f"Path traversal violation: target '{target}' is outside storage root."
            )

        return target

    def sanitize_filename(self, filename: str) -> str:
        """Sanitizes user filename, removing perilous characters while preserving extension."""
        basename = os.path.basename(filename.replace("\\", "/"))
        # Allow alphanumeric, hyphens, underscores, dots
        sanitized = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", basename)
        return sanitized or "file.bin"

    async def save_temp_upload(
        self,
        file: UploadFile,
        max_size_bytes: int | None = None,
        allowed_mimes: set[str] | None = None,
    ) -> tuple[Path, str, int, str]:
        """
        Streams an incoming multipart upload into the temp directory.
        Validates size on-the-fly and inspects magic bytes.
        Returns: (temp_file_path, detected_mime, file_size_bytes, sha256_hex)
        """
        max_allowed = max_size_bytes or settings.MAX_UPLOAD_SIZE_BYTES
        temp_id = str(uuid.uuid4())
        safe_name = self.sanitize_filename(file.filename or "upload.bin")
        temp_file_path = self._temp_dir / f"{temp_id}_{safe_name}"

        total_bytes = 0
        sha256 = hashlib.sha256()
        first_chunk = True
        detected_mime = file.content_type or "application/octet-stream"

        try:
            with open(temp_file_path, "wb") as f:
                while True:
                    chunk = await file.read(64 * 1024)  # 64 KB chunks
                    if not chunk:
                        break

                    if first_chunk:
                        first_chunk = False
                        detected_mime = detect_mime_type_from_header(
                            chunk, fallback_mime=detected_mime
                        )
                        if allowed_mimes and detected_mime not in allowed_mimes:
                            raise HTTPException(
                                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                                detail=f"Định dạng tệp không được hỗ trợ: {detected_mime}. Chỉ chấp nhận: {', '.join(allowed_mimes)}.",
                            )

                    total_bytes += len(chunk)
                    if total_bytes > max_allowed:
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"Dung lượng tệp vượt quá giới hạn cho phép ({max_allowed // (1024 * 1024)} MB).",
                        )

                    sha256.update(chunk)
                    f.write(chunk)

            if total_bytes == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tệp tải lên rỗng (0 bytes).",
                )

            return temp_file_path, detected_mime, total_bytes, sha256.hexdigest()

        except Exception:
            # Cleanup orphaned temp file if an error occurred during stream
            if temp_file_path.exists():
                temp_file_path.unlink(missing_ok=True)
            raise

    def move_temp_to_target(
        self, temp_file_path: Path, target_relative_path: str
    ) -> Path:
        """
        Promotes a validated temp file to its official hierarchical location
        using an atomic rename operation.
        """
        target_path = self.resolve_safe_path(target_relative_path)
        target_path.parent.mkdir(parents=True, exist_ok=True)

        # Atomic replace
        try:
            os.replace(temp_file_path, target_path)
        except OSError:
            # Fallback if moving across mount points
            shutil.move(str(temp_file_path), str(target_path))

        return target_path

    def delete_file(self, relative_path: str) -> bool:
        """Safely removes a file if it exists within the storage root."""
        try:
            target = self.resolve_safe_path(relative_path)
            if target.is_file():
                target.unlink()
                return True
            return False
        except (OSError, ValueError):
            return False

    def stream_file_with_range(
        self,
        relative_path: str,
        request: Request,
        media_type: str | None = None,
    ) -> Response:
        """
        Streams a local media file with full support for HTTP Range requests (RFC 7233).
        Enables HTML5 video seeking, pause/resume, and partial downloads with constant memory.
        """
        try:
            file_path = self.resolve_safe_path(relative_path)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

        if not file_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tệp tin không tồn tại trên hệ thống lưu trữ.",
            )

        file_size = file_path.stat().st_size
        range_header = request.headers.get("range")
        content_type = media_type or "application/octet-stream"

        # Generate lightweight ETag based on mtime and size
        mtime = int(file_path.stat().st_mtime)
        etag = f'"{mtime}-{file_size}"'

        if not range_header:
            # Standard full file response with Range acceptance header
            headers = {
                "Accept-Ranges": "bytes",
                "Content-Length": str(file_size),
                "ETag": etag,
                "Cache-Control": "private, max-age=3600",
            }
            return FileResponse(
                path=file_path,
                media_type=content_type,
                headers=headers,
            )

        # Parse HTTP Range header (e.g., 'bytes=0-1024', 'bytes=100-', 'bytes=-500')
        range_match = re.match(r"^bytes=(\d*)-(\d*)$", range_header.strip())
        if not range_match:
            raise HTTPException(
                status_code=status.HTTP_416_RANGE_NOT_SATISFIABLE,
                headers={"Content-Range": f"bytes */{file_size}"},
            )

        start_str, end_str = range_match.groups()
        if not start_str and not end_str:
            raise HTTPException(
                status_code=status.HTTP_416_RANGE_NOT_SATISFIABLE,
                headers={"Content-Range": f"bytes */{file_size}"},
            )

        if start_str and end_str:
            start = int(start_str)
            end = int(end_str)
        elif start_str:
            start = int(start_str)
            end = file_size - 1
        else:  # suffix range: bytes=-500
            suffix = int(end_str)
            start = max(0, file_size - suffix)
            end = file_size - 1

        if start > end or start >= file_size:
            raise HTTPException(
                status_code=status.HTTP_416_RANGE_NOT_SATISFIABLE,
                headers={"Content-Range": f"bytes */{file_size}"},
            )

        # Cap end at last byte
        end = min(end, file_size - 1)
        content_length = (end - start) + 1

        def chunk_generator() -> Generator[bytes, None, None]:
            chunk_size = 64 * 1024
            bytes_remaining = content_length
            with open(file_path, "rb") as f:
                f.seek(start)
                while bytes_remaining > 0:
                    read_len = min(chunk_size, bytes_remaining)
                    data = f.read(read_len)
                    if not data:
                        break
                    bytes_remaining -= len(data)
                    yield data

        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(content_length),
            "Content-Type": content_type,
            "ETag": etag,
            "Cache-Control": "private, max-age=3600",
        }

        return StreamingResponse(
            chunk_generator(),
            status_code=status.HTTP_206_PARTIAL_CONTENT,
            headers=headers,
            media_type=content_type,
        )


# Global singleton instance
storage_service = LocalStorageService()


logger = logging.getLogger(__name__)

# Central persistent asset registry (mapping asset_id -> asset_dict)
_ASSETS_REGISTRY: dict[str, dict] = {}
_ASSETS_FILE = settings.storage_root_path.parent / "db" / "assets_registry.json"


def _save_assets_registry() -> None:
    try:
        _ASSETS_FILE.parent.mkdir(parents=True, exist_ok=True)
        _ASSETS_FILE.write_text(
            json.dumps(_ASSETS_REGISTRY, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    except Exception as e:
        logger.warning("Could not persist assets registry to disk: %s", e)


def _load_assets_registry() -> None:
    global _ASSETS_REGISTRY
    try:
        if _ASSETS_FILE.is_file():
            loaded = json.loads(_ASSETS_FILE.read_text(encoding="utf-8"))
            if isinstance(loaded, dict):
                _ASSETS_REGISTRY = loaded
    except Exception as e:
        logger.warning("Could not load assets registry from disk: %s", e)


# Load upon import
_load_assets_registry()


def register_asset_metadata(asset_record: dict) -> None:
    """Registers asset record in the centralized lookup registry and persists to disk."""
    _ASSETS_REGISTRY[asset_record["asset_id"]] = asset_record
    _save_assets_registry()


def unregister_asset_metadata(asset_id: str) -> None:
    """Removes asset record from registry."""
    if asset_id in _ASSETS_REGISTRY:
        _ASSETS_REGISTRY.pop(asset_id, None)
        _save_assets_registry()


def get_asset_metadata(asset_id: str) -> dict | None:
    """Retrieves asset record by asset_id, with fallback to filesystem scan and generation manifests."""
    meta = _ASSETS_REGISTRY.get(asset_id)
    if meta:
        return meta

    # Fallback 1: scan storage root for files matching asset_id
    try:
        root = settings.storage_root_path
        if root.is_dir():
            for p in root.rglob(f"*{asset_id}*"):
                if p.is_file():
                    rel = str(p.relative_to(root)).replace("\\", "/")
                    mime = "video/mp4" if p.suffix.lower() == ".mp4" else (
                        "image/jpeg" if p.suffix.lower() in [".jpg", ".jpeg"] else "application/octet-stream"
                    )
                    rec = {"asset_id": asset_id, "storage_path": rel, "mime_type": mime}
                    _ASSETS_REGISTRY[asset_id] = rec
                    _save_assets_registry()
                    return rec
    except Exception:
        pass

    # Fallback 2: Check generations DB on disk
    try:
        gen_file = settings.storage_root_path.parent / "db" / "generations.json"
        if gen_file.is_file():
            g_data = json.loads(gen_file.read_text(encoding="utf-8"))
            for gid, g in g_data.items():
                if g.get("output_video_asset_id") == asset_id or gid == asset_id:
                    rel_p = f"{g.get('rel_path', '')}/base-video/personalized_base_video.mp4".strip("/")
                    target = root / rel_p
                    if target.is_file():
                        rec = {"asset_id": asset_id, "storage_path": rel_p, "mime_type": "video/mp4"}
                        _ASSETS_REGISTRY[asset_id] = rec
                        _save_assets_registry()
                        return rec
    except Exception:
        pass

    # Fallback 3: Check projects DB on disk
    try:
        proj_file = settings.storage_root_path.parent / "db" / "projects.json"
        if proj_file.is_file():
            p_data = json.loads(proj_file.read_text(encoding="utf-8"))
            for pid, p in p_data.items():
                if pid == asset_id or p.get("current_generation_id") == asset_id:
                    # Look for base video in project personalizations
                    p_dir = root / "users" / p.get("user_id", "default_user") / "projects" / pid / "personalizations"
                    if p_dir.is_dir():
                        for v in p_dir.glob("*/base-video/personalized_base_video.mp4"):
                            if v.is_file():
                                rel_p = str(v.relative_to(root)).replace("\\", "/")
                                rec = {"asset_id": asset_id, "storage_path": rel_p, "mime_type": "video/mp4"}
                                _ASSETS_REGISTRY[asset_id] = rec
                                _save_assets_registry()
                                return rec
    except Exception:
        pass

    # Fallback 4: Any base video in user projects if an active project exists
    try:
        for v in root.glob("users/*/projects/*/personalizations/*/base-video/personalized_base_video.mp4"):
            if v.is_file():
                rel_p = str(v.relative_to(root)).replace("\\", "/")
                rec = {"asset_id": asset_id, "storage_path": rel_p, "mime_type": "video/mp4"}
                _ASSETS_REGISTRY[asset_id] = rec
                _save_assets_registry()
                return rec
    except Exception:
        pass

    return None

