import time
import zipfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.batch_production import (
    BatchProductEligibilityStatus,
    BatchProductionStatus,
)
from app.services.batch_production import batch_orchestrator
from app.services.garment_engine.pipeline import (
    _REPLACEMENT_JOBS_DB,
    _save_jobs_db,
)
from app.services.personalization import _GENERATIONS_DB, _PROJECTS_DB
from app.services.product_extraction import _PRODUCT_ASSETS_DB

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_data():
    project_id = "prj-batch-test-01"
    base_video_id = "asset-base-batch-01"

    _PROJECTS_DB[project_id] = {
        "project_id": project_id,
        "name": "Lookbook Batch Project",
        "model_name": "Linh",
        "output_video_url": f"/api/v1/assets/{base_video_id}/stream",
        "current_generation_id": "gen-batch-001",
    }

    _GENERATIONS_DB["gen-batch-001"] = {
        "generation_id": "gen-batch-001",
        "project_id": project_id,
        "status": "COMPLETED",
        "output_video_asset_id": base_video_id,
        "model_name": "Linh",
        "storage_path": "templates/vtp-streetwear-001/versions/v1/source/source.mp4",
        "rel_path": "templates/vtp-streetwear-001",
    }

    # Product 1: White shirt (Eligible)
    _PRODUCT_ASSETS_DB["prod-batch-001"] = {
        "product_id": "prod-batch-001",
        "project_id": project_id,
        "title": "Áo Sơ Mi Trắng 6 Cúc Nam",
        "custom_title": "Áo sơ mi Oxford trắng",
        "images": [{"image_id": "img-01", "storage_path": "templates/vtp-streetwear-001/poster/poster.jpg"}],
    }

    # Product 2: Cardigan (Eligible / Warnings for button count)
    _PRODUCT_ASSETS_DB["prod-batch-002"] = {
        "product_id": "prod-batch-002",
        "project_id": project_id,
        "title": "Áo Cardigan Be Len Dệt Kim",
        "custom_title": "Cardigan dệt kim be",
        "images": [{"image_id": "img-02", "storage_path": "templates/vtp-streetwear-001/poster/poster.jpg"}],
    }

    # Product 3: Invalid product with no images (Blocked)
    _PRODUCT_ASSETS_DB["prod-batch-blocked"] = {
        "product_id": "prod-batch-blocked",
        "project_id": project_id,
        "title": "Sản phẩm lỗi không có ảnh",
        "images": [],
    }


def test_batch_preflight_validation():
    project_id = "prj-batch-test-01"
    base_video_id = "asset-base-batch-01"

    res = client.post(
        f"/api/v1/projects/{project_id}/batches/preflight",
        json={
            "base_video_asset_id": base_video_id,
            "product_asset_ids": ["prod-batch-001", "prod-batch-002", "prod-batch-blocked"],
        },
    )
    assert res.status_code == 200
    data = res.json()

    assert data["total_requested"] == 3
    assert data["blocked_count"] == 1
    assert data["can_proceed"] is False  # Blocked product present

    # Test filtering out blocked product
    res_clean = client.post(
        f"/api/v1/projects/{project_id}/batches/preflight",
        json={
            "base_video_asset_id": base_video_id,
            "product_asset_ids": ["prod-batch-001", "prod-batch-002"],
        },
    )
    assert res_clean.status_code == 200
    clean_data = res_clean.json()
    assert clean_data["blocked_count"] == 0
    assert clean_data["can_proceed"] is True
    assert len(clean_data["items"]) == 2


def test_batch_creation_and_idempotency():
    project_id = "prj-batch-test-01"
    base_video_id = "asset-base-batch-01"
    idempotency_key = "idemp-key-test-12345"

    payload = {
        "project_id": project_id,
        "base_video_asset_id": base_video_id,
        "product_asset_ids": ["prod-batch-001", "prod-batch-002"],
        "batch_name": "Đợt sản xuất thử nghiệm",
        "confirmed_limitations": True,
        "idempotency_key": idempotency_key,
    }

    # 1. First creation
    res1 = client.post(f"/api/v1/projects/{project_id}/batches", json=payload)
    assert res1.status_code == 201
    batch1 = res1.json()
    assert batch1["batch_id"].startswith("bpg-")
    assert batch1["total_jobs"] == 2
    assert len(batch1["job_ids"]) == 2

    # 2. Repeated request with identical idempotency key returns same batch
    res2 = client.post(f"/api/v1/projects/{project_id}/batches", json=payload)
    assert res2.status_code == 201
    batch2 = res2.json()
    assert batch2["batch_id"] == batch1["batch_id"]

    # 3. List batches
    res_list = client.get(f"/api/v1/projects/{project_id}/batches")
    assert res_list.status_code == 200
    b_list = res_list.json()
    assert any(b["batch_id"] == batch1["batch_id"] for b in b_list)

    # 4. Get batch detail
    res_detail = client.get(f"/api/v1/projects/{project_id}/batches/{batch1['batch_id']}")
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["batch"]["batch_id"] == batch1["batch_id"]
    assert len(detail["jobs"]) == 2


def test_batch_cancellation():
    project_id = "prj-batch-test-01"
    base_video_id = "asset-base-batch-01"

    payload = {
        "project_id": project_id,
        "base_video_asset_id": base_video_id,
        "product_asset_ids": ["prod-batch-001"],
        "batch_name": "Đợt sản xuất để hủy",
        "confirmed_limitations": True,
    }

    res_create = client.post(f"/api/v1/projects/{project_id}/batches", json=payload)
    assert res_create.status_code == 201
    batch = res_create.json()
    batch_id = batch["batch_id"]

    # Cancel batch
    res_cancel = client.post(f"/api/v1/projects/{project_id}/batches/{batch_id}/cancel")
    assert res_cancel.status_code == 200
    cancelled_batch = res_cancel.json()
    assert cancelled_batch["status"] == "CANCELLED"


def test_final_video_library_query_and_archive(tmp_path: Path):
    project_id = "prj-batch-test-01"

    # Inject a completed job into _REPLACEMENT_JOBS_DB with real media references
    sample_mp4 = tmp_path / "final_product_video.mp4"
    sample_mp4.write_bytes(b"\x00\x00\x00 ftypisom\x00\x00\x02\x00isomiso2mp41")

    job_id = "grp-test-library-001"
    _REPLACEMENT_JOBS_DB[job_id] = {
        "job_id": job_id,
        "project_id": project_id,
        "user_id": "usr-system-default",
        "base_video_asset_id": "asset-base-batch-01",
        "product_asset_id": "prod-batch-001",
        "product_title": "Áo Sơ Mi Oxford Trắng Cao Cấp",
        "model_name": "Linh",
        "status": "COMPLETED",
        "current_step": "Hoàn tất kiểm định chất lượng",
        "progress": 100,
        "created_at": "2026-11-08T12:00:00Z",
        "completed_at": "2026-11-08T12:03:00Z",
        "output_video_asset_id": "asset-video-lib-01",
        "output_video_url": f"/api/v1/assets/asset-video-lib-01/stream",
        "output_thumbnail_url": f"/api/v1/assets/asset-video-lib-01/thumbnail",
        "output_video_sha256": "1234567890abcdef",
        "duration_ms": 5000,
        "width": 1080,
        "height": 1920,
        "fps": 30,
        "codec": "h264",
        "file_size_bytes": 1024,
        "rel_storage_path": "templates/vtp-streetwear-001/versions/v1",  # mock valid relative path
        "quality_review": {
            "overall_status": "PASS",
            "criteria": [],
            "assessed_at": "2026-11-08T12:03:00Z",
            "inspector": "LocalQualityGateEngine",
        },
    }
    _save_jobs_db()

    # 1. Query library
    res_lib = client.get(f"/api/v1/projects/{project_id}/final-videos?search=Oxford")
    assert res_lib.status_code == 200
    lib_data = res_lib.json()
    assert lib_data["total"] >= 1
    found = [item for item in lib_data["items"] if item["video_id"] == job_id]
    assert len(found) == 1

    # 2. Get single video detail
    res_detail = client.get(f"/api/v1/projects/{project_id}/final-videos/{job_id}")
    assert res_detail.status_code == 200
    v_detail = res_detail.json()
    assert v_detail["product_title"] == "Áo Sơ Mi Oxford Trắng Cao Cấp"

    # 3. Toggle archive
    res_arch = client.post(f"/api/v1/projects/{project_id}/final-videos/{job_id}/archive")
    assert res_arch.status_code == 200
    assert res_arch.json()["is_archived"] is True

    # 4. Verify hidden from active query
    res_hide = client.get(f"/api/v1/projects/{project_id}/final-videos?include_archived=false")
    assert not any(i["video_id"] == job_id for i in res_hide.json()["items"])

    # 5. Un-archive
    res_unarch = client.post(f"/api/v1/projects/{project_id}/final-videos/{job_id}/archive")
    assert res_unarch.json()["is_archived"] is False


def test_batch_export_zip(tmp_path: Path):
    project_id = "prj-batch-test-01"

    # Add a mock completed job with actual source.mp4 as file
    job_id = "grp-test-zip-001"
    _REPLACEMENT_JOBS_DB[job_id] = {
        "job_id": job_id,
        "project_id": project_id,
        "user_id": "usr-system-default",
        "base_video_asset_id": "asset-base-batch-01",
        "product_asset_id": "prod-batch-001",
        "product_title": "Áo Sơ Mi Trắng Zip Test",
        "model_name": "Linh",
        "status": "COMPLETED",
        "progress": 100,
        "created_at": "2026-11-08T12:00:00Z",
        "completed_at": "2026-11-08T12:03:00Z",
        "output_video_asset_id": "asset-zip-01",
        "output_video_url": "/api/v1/assets/asset-zip-01/stream",
        "output_video_sha256": "abcdef1234567890",
        "duration_ms": 3000,
        "width": 1080,
        "height": 1920,
        "fps": 30,
        "rel_storage_path": "users/usr-system-default/projects/prj-test-replacement/replacements/grp-c8429140b924",  # uses real generated video
        "quality_review": {"overall_status": "PASS", "criteria": [], "assessed_at": "2026-11-08", "inspector": "Inspector"},
    }
    _save_jobs_db()

    # Call export-zip endpoint
    res = client.post(
        f"/api/v1/projects/{project_id}/final-videos/export-zip",
        json={"video_ids": [job_id]},
    )
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/zip"
    assert "attachment" in res.headers.get("content-disposition", "")
    assert len(res.content) > 0

    # Validate ZIP integrity
    zip_bytes_path = tmp_path / "test_download.zip"
    zip_bytes_path.write_bytes(res.content)
    with zipfile.ZipFile(zip_bytes_path, "r") as zf:
        namelist = zf.namelist()
        assert "manifest.json" in namelist
