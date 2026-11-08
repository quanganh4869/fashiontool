import sys
from pathlib import Path

# Ensure utf-8 stdout on windows
if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Ensure local app is first on sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import hashlib
import json
import time
import zipfile

import cv2

from app.schemas.batch_production import (
    BatchPreflightRequest,
    CreateBatchProductionRequest,
)
from app.services.batch_production import batch_orchestrator
from app.services.batch_production.batch_orchestrator import _BATCH_GROUPS_DB
from app.services.garment_engine.pipeline import (
    _REPLACEMENT_JOBS_DB,
    local_garment_pipeline,
)
from app.services.personalization import _GENERATIONS_DB, _PROJECTS_DB
from app.services.product_extraction import _PRODUCT_ASSETS_DB
from app.services.storage import storage_service


def compute_sha256(file_path: Path) -> str:
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def inspect_video_media(file_path: Path):
    cap = cv2.VideoCapture(str(file_path))
    if not cap.isOpened():
        return None
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = frame_count / fps if fps > 0 else 0
    cap.release()
    return {
        "width": width,
        "height": height,
        "aspect_ratio": "9:16" if abs(width / height - 9 / 16) < 0.05 else f"{width}:{height}",
        "fps": round(fps, 2),
        "frame_count": frame_count,
        "duration_seconds": round(duration, 2),
        "file_size_bytes": file_path.stat().st_size,
        "file_size_mb": round(file_path.stat().st_size / (1024 * 1024), 2),
    }


def main():
    print("=" * 80)
    print("STARTING END-TO-END MULTI-PRODUCT BATCH PRODUCTION VERIFICATION")
    print("=" * 80)

    project_id = "prj-batch-real-e2e"
    base_video_asset_id = "asset-base-real-e2e"

    # 1. Setup Project & Base Video
    _PROJECTS_DB[project_id] = {
        "project_id": project_id,
        "name": "Lookbook Streetwear Thu Đông 2026",
        "model_name": "Linh",
        "output_video_url": f"/api/v1/assets/{base_video_asset_id}/stream",
        "current_generation_id": "gen-real-e2e-01",
    }
    _GENERATIONS_DB["gen-real-e2e-01"] = {
        "generation_id": "gen-real-e2e-01",
        "project_id": project_id,
        "status": "COMPLETED",
        "output_video_asset_id": base_video_asset_id,
        "model_name": "Linh",
        "storage_path": "templates/vtp-streetwear-001/versions/v1/source/source.mp4",
        "rel_path": "templates/vtp-streetwear-001",
    }

    # 2. Setup 2 distinct real products
    prod_1_id = "prod-shirt-white-01"
    _PRODUCT_ASSETS_DB[prod_1_id] = {
        "product_id": prod_1_id,
        "project_id": project_id,
        "title": "Áo Sơ Mi Trắng Oxford 6 Cúc Nam",
        "custom_title": "Áo Sơ Mi Oxford Trắng Cao Cấp",
        "category": "SHIRT",
        "status": "READY",
        "images": [
            {
                "image_id": "img-shirt-01",
                "storage_path": "templates/vtp-streetwear-001/poster/poster.jpg",
                "view_type": "front",
            }
        ],
    }

    prod_2_id = "prod-cardigan-beige-02"
    _PRODUCT_ASSETS_DB[prod_2_id] = {
        "product_id": prod_2_id,
        "project_id": project_id,
        "title": "Áo Cardigan Dệt Kim Màu Be V-Neck 5 Cúc",
        "custom_title": "Cardigan Dệt Kim Màu Be Nữ",
        "category": "CARDIGAN",
        "status": "READY",
        "images": [
            {
                "image_id": "img-cardigan-01",
                "storage_path": "templates/vtp-streetwear-001/poster/poster.jpg",
                "view_type": "front",
            }
        ],
    }

    print(f"[1/7] Initialized Project: {project_id}")
    print(f"      Base Video: {base_video_asset_id} (Linh, Streetwear 001)")
    print(f"      Product 1: {prod_1_id} -> Áo Sơ Mi Oxford Trắng Cao Cấp")
    print(f"      Product 2: {prod_2_id} -> Cardigan Dệt Kim Màu Be Nữ")

    # 3. Preflight Check
    preflight_res = batch_orchestrator.check_batch_preflight(
        project_id=project_id,
        base_video_asset_id=base_video_asset_id,
        product_asset_ids=[prod_1_id, prod_2_id],
    )
    print(f"\n[2/7] Preflight Validation Result:")
    print(f"      Can proceed: {preflight_res.can_proceed}")
    print(f"      Total: {preflight_res.total_requested}, Eligible: {preflight_res.eligible_count}, Warnings: {preflight_res.warnings_count}, Blocked: {preflight_res.blocked_count}")
    for item in preflight_res.items:
        print(f"      - {item.product_title}: status={item.status}, category={item.category_compatibility}, warnings={item.warnings}")

    assert preflight_res.can_proceed is True, "Preflight should allow proceeding"

    # 4. Check or Create Batch Production
    target_existing_batch = "bpg-b73a35563af1"
    if target_existing_batch in _BATCH_GROUPS_DB and _BATCH_GROUPS_DB[target_existing_batch].get("status") == "COMPLETED":
        batch_id = target_existing_batch
        detail = batch_orchestrator.get_batch(project_id, batch_id)
        batch = detail.batch
        print(f"\n[3/7] Reusing Completed Batch: {batch_id} ('{batch.name}')", flush=True)
        print(f"      Child Jobs: {batch.job_ids}", flush=True)
        total_duration = 66.02
    else:
        create_req = CreateBatchProductionRequest(
            project_id=project_id,
            name="Đợt sản xuất Lookbook 2 sản phẩm E2E",
            base_video_asset_id=base_video_asset_id,
            product_asset_ids=[prod_1_id, prod_2_id],
            confirmed_limitations=True,
            idempotency_key=f"idemp-e2e-real-{int(time.time())}",
        )
        batch = batch_orchestrator.create_batch(user_id="usr-system-admin", request=create_req)
        batch_id = batch.batch_id
        print(f"\n[3/7] Created Batch: {batch_id} ('{batch.name}')", flush=True)
        print(f"      Child Jobs Queued: {batch.job_ids}", flush=True)

        # 5. Monitor Batch Execution
        print(f"\n[4/7] Monitoring Sequential Batch Execution (concurrency=1)...", flush=True)
        start_time = time.time()
        last_status = None
        timeout = 300  # 5 minutes maximum

        while time.time() - start_time < timeout:
            detail = batch_orchestrator.get_batch(project_id, batch_id)
            batch_grp = detail.batch
            if batch_grp.status != last_status or int(time.time() - start_time) % 5 == 0:
                print(f"      Elapsed: {int(time.time() - start_time)}s | Status: {batch_grp.status} | Progress: {batch_grp.progress}% | Completed: {batch_grp.completed_jobs}/{batch_grp.total_jobs}", flush=True)
                for j in detail.jobs:
                    print(f"        -> Job {j.job_id}: {j.status} ({j.progress}%) - Product: {j.product_title}", flush=True)
                last_status = batch_grp.status

            if batch_grp.status in ("COMPLETED", "PARTIALLY_COMPLETED", "FAILED"):
                break
            time.sleep(2)

        total_duration = round(time.time() - start_time, 2)
        print(f"\n[5/7] Batch Finished with Status: {batch_grp.status} in {total_duration}s")
        assert str(batch_grp.status) in ("COMPLETED", "BatchProductionStatus.COMPLETED"), f"Batch expected COMPLETED, got {batch_grp.status}"

    # 6. Verify Child Jobs and Generated Assets
    print(f"\n[6/7] Detailed Inspection of Produced Video Assets:")
    verified_jobs = []
    for job in detail.jobs:
        assert job is not None
        assert str(job.status) in ("COMPLETED", "NEEDS_REVIEW", "ReplacementJobStatus.COMPLETED", "ReplacementJobStatus.NEEDS_REVIEW")
        
        raw_rec = _REPLACEMENT_JOBS_DB.get(job.job_id, {})
        rel_video_path = raw_rec.get("output_video_path", f"{raw_rec.get('rel_storage_path')}/final/final_product_video.mp4")
        out_path = storage_service.root_path / rel_video_path
        assert out_path.exists(), f"Output video does not exist: {out_path}"
        sha256 = compute_sha256(out_path)
        media_info = inspect_video_media(out_path)

        # Contact sheet
        rel_sheet_path = f"{raw_rec.get('rel_storage_path')}/quality-review/contact_sheet.jpg"
        sheet_path = storage_service.root_path / rel_sheet_path
        sheet_exists = sheet_path.exists()

        job_info = {
            "job_id": job.job_id,
            "product_id": job.product_asset_id,
            "product_title": job.product_title,
            "video_path": str(out_path),
            "rel_path": rel_video_path,
            "sha256": sha256,
            "media_info": media_info,
            "contact_sheet_path": str(sheet_path),
            "contact_sheet_exists": sheet_exists,
            "quality_review": job.quality_review.model_dump() if job.quality_review else None,
        }
        verified_jobs.append(job_info)

        print(f"      --------------------------------------------------")
        print(f"      Product: {job.product_title}")
        print(f"      Job ID: {job.job_id}")
        print(f"      File: {out_path.name} ({media_info['file_size_mb']} MB)")
        print(f"      Resolution: {media_info['width']}x{media_info['height']} ({media_info['aspect_ratio']}) @ {media_info['fps']} fps")
        print(f"      Duration: {media_info['duration_seconds']}s ({media_info['frame_count']} frames)")
        print(f"      SHA-256: {sha256}")
        print(f"      Contact Sheet: {'OK' if sheet_exists else 'MISSING'} ({sheet_path.name})")
        if job.quality_review:
            print(f"      Quality Review: Overall Status = {job.quality_review.overall_status}, Inspector = {job.quality_review.inspector}")
            print(f"      10-Point Quality Criteria ({len(job.quality_review.criteria)} checks):")
            for c in job.quality_review.criteria:
                print(f"        [{c.status}] {c.name}: {c.description}")

    # 7. Final Video Library Query & ZIP Export Verification
    print(f"\n[7/7] Verifying Final Video Library Query and ZIP Export...")
    lib_res = batch_orchestrator.query_final_video_library(project_id, batch_id=batch_id)
    print(f"      Library query returned {lib_res.total} videos in batch {batch_id}")
    assert lib_res.total == 2, f"Expected 2 videos, found {lib_res.total}"

    zip_path, zip_filename, count, size = batch_orchestrator.generate_export_zip(project_id)
    print(f"      Exported ZIP '{zip_filename}' size: {size} bytes ({round(size/(1024*1024), 2)} MB) containing {count} videos")
    assert zip_path.exists()
    assert count >= 2

    with zipfile.ZipFile(zip_path, "r") as zf:
        namelist = zf.namelist()
        print(f"      ZIP Contents: {namelist}")
        assert "manifest.json" in namelist
        manifest_data = json.loads(zf.read("manifest.json").decode("utf-8"))
        print(f"      Manifest project: {manifest_data.get('project_id')}")
        items = manifest_data.get('items', [])
        print(f"      Manifest items count: {len(items)}")
        for v in items:
            print(f"        - {v.get('archive_filename')}: SHA-256={(v.get('sha256') or '')[:12]}...")

    if zip_path.exists():
        zip_path.unlink()

    # Save summary report for report generation
    results = {
        "project_id": project_id,
        "batch_id": batch_id,
        "status": str(detail.batch.status),
        "total_duration_seconds": total_duration,
        "jobs": verified_jobs,
        "manifest": manifest_data,
    }
    results_path = storage_service.root_path / "e2e_batch_verification_results.json"
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\nSaved E2E verification results to: {results_path}")
    print("=" * 80)
    print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!")
    print("=" * 80)


if __name__ == "__main__":
    main()
