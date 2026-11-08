import time
from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.replacements import ProductTruthSheetSpec
from app.services.garment_engine import (
    BaseVideoGarmentAnalysisService,
    GarmentReplacementEngine,
    GarmentStructureService,
    GarmentTemporalConsistencyService,
    GarmentTrackingService,
    OcclusionHandlingService,
    ProductReferenceService,
    ReplacementPreflightValidationService,
    ReplacementQualityService,
)
from app.services.personalization import _GENERATIONS_DB, _PROJECTS_DB
from app.services.product_extraction import _PRODUCT_ASSETS_DB

client = TestClient(app)


def test_garment_preflight_validation():
    service = ReplacementPreflightValidationService()

    # 1. Reject if Base Video is not completed
    res_bad_base = service.validate(
        base_video_record={"status": "PROCESSING"},
        product_record={"title": "Áo sơ mi nam", "images": [{"image_id": "img1"}]},
    )
    assert res_bad_base.can_replace is False
    assert any("chưa hoàn thành" in r for r in res_bad_base.blocking_reasons)

    # 2. Reject if Product has no images
    res_no_img = service.validate(
        base_video_record={"status": "COMPLETED"},
        product_record={"title": "Áo sơ mi nam", "images": []},
    )
    assert res_no_img.can_replace is False
    assert any("không có ảnh" in r for r in res_no_img.blocking_reasons)

    # 3. Supported Shirt Scenario
    res_ok = service.validate(
        base_video_record={"status": "COMPLETED", "model_name": "Linh"},
        product_record={"product_id": "prod-1", "title": "Áo sơ mi trắng 6 cúc", "images": [{"image_id": "img1"}, {"image_id": "img2"}]},
    )
    assert res_ok.can_replace is True
    assert res_ok.category_compatibility == "SUPPORTED"
    assert res_ok.target_garment_slot == "upper_body"
    assert res_ok.truth_sheet.button_count == 6


def test_garment_analysis_and_occlusion(tmp_path: Path):
    analyzer = BaseVideoGarmentAnalysisService()
    tracker = GarmentTrackingService()

    # Synthetic frame (100x100 BGR)
    frame = np.zeros((200, 200, 3), dtype=np.uint8) + 80  # dark shirt background
    # Add skin color block in center (hand resting over shirt)
    # Skin in YCrCb has Cr around 150, Cb around 100 -> in BGR roughly (130, 160, 210)
    frame[90:110, 90:110] = (130, 160, 210)

    g_frame = analyzer.analyze_frame_garment(
        frame_img=frame,
        frame_index=0,
        timestamp_ms=0,
        output_masks_dir=tmp_path / "masks",
        slot_type="upper_body",
    )
    assert Path(g_frame.mask_path).is_file()

    # Save frame to disk for tracking test
    f_path = tmp_path / "frame_0000.jpg"
    import cv2
    cv2.imwrite(str(f_path), frame)

    tracked = tracker.track_sequence(
        garment_frames=[g_frame],
        frame_paths=[f_path],
        output_tracking_dir=tmp_path / "tracking",
    )
    assert len(tracked) == 1
    assert Path(tracked[0].garment_mask_path).is_file()
    assert Path(tracked[0].occlusion_mask_path).is_file()


def test_garment_structure_and_synthesis():
    struct_service = GarmentStructureService()
    structure = struct_service.compute_structure(
        frame_shape=(200, 200),
        garment_bbox=[40, 40, 120, 120],
        button_count=6,
        has_left_pocket=True,
    )
    assert len(structure.buttons) == 6
    assert structure.pocket is not None
    assert structure.pocket.placement == "left_chest"

    # Test synthesis
    ref_service = ProductReferenceService()
    truth_sheet = ProductTruthSheetSpec(
        truth_sheet_id="ts-test",
        product_id="prod-test",
        category="shirt",
        primary_color="#FFFFFF",
        button_count=6,
        has_left_pocket=True,
    )
    features = ref_service.prepare_reference([], truth_sheet)
    assert features.primary_color_bgr == (255, 255, 255)

    engine = GarmentReplacementEngine()
    base_frame = np.zeros((200, 200, 3), dtype=np.uint8) + 50
    mask = np.zeros((200, 200), dtype=np.uint8)
    mask[40:160, 40:160] = 255

    syn_frame = engine.synthesize_garment_frame(base_frame, mask, features, structure)
    assert syn_frame.shape == (200, 200, 3)
    # Inside shirt should be turned white (> 180)
    assert syn_frame[100, 100, 0] > 180
    # Background outside mask should remain 50
    assert syn_frame[10, 10, 0] == 50


def test_quality_review_evaluation():
    quality_service = ReplacementQualityService()
    truth_sheet = ProductTruthSheetSpec(
        truth_sheet_id="ts-test",
        product_id="prod-test",
        category="shirt",
        primary_color="#FFFFFF",
        button_count=6,
        has_left_pocket=True,
    )
    qr = quality_service.evaluate_replacement(truth_sheet)
    assert qr.overall_status == "PASS"
    assert len(qr.criteria) == 10
    assert any(c.key == "button_count_invariance" and "6 cúc" in c.description for c in qr.criteria)


def test_api_preflight_and_job_execution():
    project_id = "prj-test-replacement"
    base_video_id = "asset-base-001"
    product_id = "prod-test-001"

    # Setup DB records
    _PROJECTS_DB[project_id] = {
        "project_id": project_id,
        "name": "Lookbook Test",
        "model_name": "Linh",
        "output_video_url": f"/api/v1/assets/{base_video_id}/stream",
        "current_generation_id": "gen-test-001",
    }
    _GENERATIONS_DB["gen-test-001"] = {
        "generation_id": "gen-test-001",
        "project_id": project_id,
        "status": "COMPLETED",
        "output_video_asset_id": base_video_id,
        "model_name": "Linh",
        "storage_path": "templates/vtp-streetwear-001/versions/v1/source/source.mp4",
        "rel_path": "templates/vtp-streetwear-001",
    }
    _PRODUCT_ASSETS_DB[product_id] = {
        "product_id": product_id,
        "project_id": project_id,
        "title": "Áo Sơ Mi Trắng 6 Cúc Nam",
        "images": [{"image_id": "img-front", "storage_path": "templates/vtp-streetwear-001/poster/poster.jpg"}],
    }

    # 1. Call Preflight Endpoint
    res_pf = client.post(
        f"/api/v1/projects/{project_id}/replacements/preflight",
        json={"base_video_asset_id": base_video_id, "product_asset_id": product_id},
    )
    assert res_pf.status_code == 200
    pf_json = res_pf.json()
    assert pf_json["can_replace"] is True
    assert pf_json["category_compatibility"] == "SUPPORTED"
    assert pf_json["truth_sheet"]["button_count"] == 6

    # 2. Call Create Replacement Job Endpoint
    res_create = client.post(
        f"/api/v1/projects/{project_id}/replacements",
        json={
            "project_id": project_id,
            "base_video_asset_id": base_video_id,
            "product_asset_id": product_id,
            "confirmed_limitations": True,
        },
    )
    assert res_create.status_code == 201
    job_data = res_create.json()
    job_id = job_data["job_id"]
    assert job_data["status"] in ("PENDING", "VALIDATING_INPUTS", "ANALYZING_BASE_VIDEO", "COMPLETED")

    # 3. Poll status
    max_wait = 25
    start = time.time()
    completed_job = None
    while time.time() - start < max_wait:
        res_poll = client.get(f"/api/v1/projects/{project_id}/replacements/{job_id}")
        assert res_poll.status_code == 200
        p_data = res_poll.json()
        if p_data["status"] in ("COMPLETED", "FAILED"):
            completed_job = p_data
            break
        time.sleep(0.5)

    # 4. Submit user decision
    res_dec = client.post(
        f"/api/v1/projects/{project_id}/replacements/{job_id}/decision",
        json={"decision": "APPROVED", "feedback_notes": "Áo trắng 6 cúc chuẩn xác!"},
    )
    assert res_dec.status_code == 200
    assert res_dec.json()["user_decision"] == "APPROVED"
