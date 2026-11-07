import pytest
from fastapi.testclient import TestClient

from app.api.v1.endpoints.assets import (
    register_asset_metadata,
    unregister_asset_metadata,
)
from app.main import app
from app.services.storage import detect_mime_type_from_header, storage_service

client = TestClient(app)

SAMPLE_VIDEO_BYTES = b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00isommp42" + b"A" * 1024


def test_path_traversal_protection():
    """Verify that path traversal attempts are detected and strictly blocked."""
    with pytest.raises(ValueError, match="Path traversal violation"):
        storage_service.resolve_safe_path("../../../etc/passwd")

    with pytest.raises(ValueError, match="Path traversal violation"):
        storage_service.resolve_safe_path("users/../../secrets.env")


def test_magic_bytes_detection():
    """Verify inspection of file header magic bytes."""
    assert detect_mime_type_from_header(b"\xff\xd8\xff\xe0") == "image/jpeg"
    assert detect_mime_type_from_header(b"\x89PNG\r\n\x1a\n") == "image/png"
    assert detect_mime_type_from_header(b"RIFF\x00\x00\x00\x00WEBP") == "image/webp"
    assert detect_mime_type_from_header(b"\x00\x00\x00\x18ftypmp42") == "video/mp4"
    assert detect_mime_type_from_header(b"\x1a\x45\xdf\xa3") == "video/webm"
    assert (
        detect_mime_type_from_header(b"<html>hello</html>", fallback_mime="text/html")
        == "text/html"
    )


def test_video_http_range_requests(tmp_path):
    """
    Verify HTTP Range Request support for HTML5 video seeking:
    - Full download returns 200 with Accept-Ranges
    - Partial range returns 206 Partial Content with correct Content-Range
    - Invalid range returns 416 Range Not Satisfiable
    """
    # Create test video file in local storage
    rel_path = "temp/test_video_sample.mp4"
    safe_path = storage_service.resolve_safe_path(rel_path)
    safe_path.parent.mkdir(parents=True, exist_ok=True)
    safe_path.write_bytes(SAMPLE_VIDEO_BYTES)
    total_size = len(SAMPLE_VIDEO_BYTES)

    # Register temporary asset
    test_asset_id = "test-video-asset-001"
    register_asset_metadata(
        {
            "asset_id": test_asset_id,
            "storage_path": rel_path,
            "mime_type": "video/mp4",
        }
    )

    try:
        # 1. Full request without Range header
        res_full = client.get(f"/api/v1/assets/{test_asset_id}/view")
        assert res_full.status_code == 200
        assert res_full.headers["content-type"] == "video/mp4"
        assert res_full.headers["accept-ranges"] == "bytes"
        assert int(res_full.headers["content-length"]) == total_size

        # 2. Valid partial range: bytes=0-499
        res_range_1 = client.get(
            f"/api/v1/assets/{test_asset_id}/stream",
            headers={"Range": "bytes=0-499"},
        )
        assert res_range_1.status_code == 206
        assert res_range_1.headers["content-range"] == f"bytes 0-499/{total_size}"
        assert res_range_1.headers["content-length"] == "500"
        assert len(res_range_1.content) == 500
        assert res_range_1.content == SAMPLE_VIDEO_BYTES[0:500]

        # 3. Seeking to end: bytes=500-
        res_range_2 = client.get(
            f"/api/v1/assets/{test_asset_id}/stream",
            headers={"Range": "bytes=500-"},
        )
        assert res_range_2.status_code == 206
        expected_len = total_size - 500
        assert (
            res_range_2.headers["content-range"]
            == f"bytes 500-{total_size - 1}/{total_size}"
        )
        assert res_range_2.headers["content-length"] == str(expected_len)
        assert len(res_range_2.content) == expected_len

        # 4. Out of range: bytes=50000-60000 -> 416
        res_range_bad = client.get(
            f"/api/v1/assets/{test_asset_id}/stream",
            headers={"Range": "bytes=50000-60000"},
        )
        assert res_range_bad.status_code == 416
        assert f"bytes */{total_size}" in res_range_bad.headers["content-range"]

    finally:
        # Cleanup
        storage_service.delete_file(rel_path)
        unregister_asset_metadata(test_asset_id)
