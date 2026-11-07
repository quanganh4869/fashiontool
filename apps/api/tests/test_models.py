import io

from fastapi.testclient import TestClient

from app.main import app
from app.services.storage import storage_service

client = TestClient(app)

# Minimal valid JPEG and PNG binary bytes for testing
TINY_JPEG = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
TINY_PNG = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"


def test_model_lifecycle_flow():
    # 1. Create draft
    res_draft = client.post("/api/v1/models/draft")
    assert res_draft.status_code == 201
    draft_data = res_draft.json()
    model_id = draft_data["model_id"]
    assert draft_data["status"] == "DRAFT"
    assert draft_data["model_code"].startswith("MOD-")

    # 2. Update identity with invalid name (empty)
    res_bad = client.patch(
        f"/api/v1/models/{model_id}/identity", json={"display_name": " "}
    )
    assert res_bad.status_code == 422

    # 3. Update identity with valid name
    res_id = client.patch(
        f"/api/v1/models/{model_id}/identity",
        json={"display_name": "Linh Fashion", "description": "Ghi chú mẫu lookbook"},
    )
    assert res_id.status_code == 200
    assert res_id.json()["display_name"] == "Linh Fashion"

    # 4. Upload photo: reject unsupported media (fake PDF or text)
    fake_file = io.BytesIO(b"Fake PDF text content")
    res_upload_bad = client.post(
        f"/api/v1/models/{model_id}/assets/upload",
        files={"file": ("test.pdf", fake_file, "application/pdf")},
    )
    assert res_upload_bad.status_code == 415

    # 5. Upload valid JPEG to local filesystem
    jpeg_file = io.BytesIO(TINY_JPEG)
    res_upload_1 = client.post(
        f"/api/v1/models/{model_id}/assets/upload",
        files={"file": ("photo-1.jpg", jpeg_file, "image/jpeg")},
    )
    assert res_upload_1.status_code == 201
    asset_1 = res_upload_1.json()
    asset_id_1 = asset_1["asset_id"]
    storage_path_1 = asset_1["storage_path"]
    assert asset_1["is_cover"] is True
    assert asset_1["view_url"] == f"/api/v1/assets/{asset_id_1}/view"

    # Verify physical file existence in LOCAL_STORAGE_ROOT
    physical_path_1 = storage_service.resolve_safe_path(storage_path_1)
    assert physical_path_1.is_file()

    # 6. Stream asset via local media endpoint
    res_view = client.get(f"/api/v1/assets/{asset_id_1}/view")
    assert res_view.status_code == 200
    assert res_view.headers["content-type"] == "image/jpeg"
    assert "accept-ranges" in res_view.headers

    # 7. Upload second photo (PNG)
    png_file = io.BytesIO(TINY_PNG)
    res_upload_2 = client.post(
        f"/api/v1/models/{model_id}/assets/upload",
        files={"file": ("photo-2.png", png_file, "image/png")},
    )
    assert res_upload_2.status_code == 201
    asset_2 = res_upload_2.json()
    asset_id_2 = asset_2["asset_id"]

    # 8. Reorder and set cover to photo 2
    res_order = client.patch(
        f"/api/v1/models/{model_id}/assets/order",
        json={
            "asset_ids_in_order": [asset_id_2, asset_id_1],
            "cover_asset_id": asset_id_2,
        },
    )
    assert res_order.status_code == 200
    detail = res_order.json()
    assert detail["cover_asset_id"] == asset_id_2

    # 9. Finalize without confirmations: should fail
    res_fin_fail = client.post(
        f"/api/v1/models/{model_id}/finalize",
        json={"same_model_confirmed": False, "usage_rights_confirmed": True},
    )
    assert res_fin_fail.status_code == 400

    # 10. Finalize with all confirmations: transitions to READY
    res_fin = client.post(
        f"/api/v1/models/{model_id}/finalize",
        json={"same_model_confirmed": True, "usage_rights_confirmed": True},
    )
    assert res_fin.status_code == 200
    assert res_fin.json()["status"] == "READY"

    # 11. Archive model
    res_arch = client.post(f"/api/v1/models/{model_id}/archive")
    assert res_arch.status_code == 200
    assert res_arch.json()["status"] == "ARCHIVED"

    # 12. Restore model
    res_rest = client.post(f"/api/v1/models/{model_id}/restore")
    assert res_rest.status_code == 200
    assert res_rest.json()["status"] == "READY"

    # 13. List models with query filter
    res_list = client.get("/api/v1/models?query=Linh")
    assert res_list.status_code == 200
    assert res_list.json()["total"] >= 1

    # 14. Delete photo 1: verify file is removed from disk
    res_del_asset = client.delete(f"/api/v1/models/{model_id}/assets/{asset_id_1}")
    assert res_del_asset.status_code == 200
    assert not physical_path_1.is_file()
