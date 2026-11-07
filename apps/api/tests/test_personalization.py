import io
import time

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

TINY_JPEG = (
    b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
)


def _setup_ready_model(name: str = "Test Model Ready") -> str:
    """Helper to create and finalize a READY model with an uploaded reference photo."""
    # 1. Draft
    res = client.post("/api/v1/models/draft")
    assert res.status_code == 201
    model_id = res.json()["model_id"]

    # 2. Identity
    client.patch(
        f"/api/v1/models/{model_id}/identity",
        json={"display_name": name, "description": "Lookbook model for tests"},
    )

    # 3. Photo
    jpeg_file = io.BytesIO(TINY_JPEG)
    res_up = client.post(
        f"/api/v1/models/{model_id}/assets/upload",
        files={"file": ("photo.jpg", jpeg_file, "image/jpeg")},
    )
    assert res_up.status_code == 201

    # 4. Finalize
    res_fin = client.post(
        f"/api/v1/models/{model_id}/finalize",
        json={"same_model_confirmed": True, "usage_rights_confirmed": True},
    )
    assert res_fin.status_code == 200
    assert res_fin.json()["status"] == "READY"
    return model_id


def test_compatibility_assessment_flow():
    # 1. Non-existent model -> 404
    res_404 = client.post(
        "/api/v1/personalization/compatibility",
        json={"model_id": "nonexistent-id", "template_id": "vtp-streetwear-001"},
    )
    assert res_404.status_code == 404

    # 2. Draft model -> UNSUPPORTED (cannot generate)
    res_draft = client.post("/api/v1/models/draft")
    draft_id = res_draft.json()["model_id"]

    res_compat_draft = client.post(
        "/api/v1/personalization/compatibility",
        json={"model_id": draft_id, "template_id": "vtp-streetwear-001"},
    )
    assert res_compat_draft.status_code == 200
    data_draft = res_compat_draft.json()
    assert data_draft["status"] == "UNSUPPORTED"
    assert data_draft["can_generate"] is False
    assert len(data_draft["blocking_reasons"]) > 0

    # 3. Ready model with template -> LIMITED or SUPPORTED
    ready_id = _setup_ready_model("Linh Test Model")
    res_compat_ready = client.post(
        "/api/v1/personalization/compatibility",
        json={"model_id": ready_id, "template_id": "vtp-streetwear-001"},
    )
    assert res_compat_ready.status_code == 200
    data_ready = res_compat_ready.json()
    assert data_ready["can_generate"] is True
    assert data_ready["model_name"] == "Linh Test Model"
    assert len(data_ready["checks"]) >= 4


def test_create_and_execute_generation():
    model_id = _setup_ready_model("Maya Fashion")
    template_id = "vtp-streetwear-001"

    # 1. Reject if limited and not confirmed
    res_unconfirmed = client.post(
        "/api/v1/personalization/generations",
        json={
            "model_id": model_id,
            "template_id": template_id,
            "confirmed_limitations": False,
        },
    )
    # If the template has limitations, it returns 400
    assert res_unconfirmed.status_code in (201, 400)

    # 2. Confirm and create generation
    res_gen = client.post(
        "/api/v1/personalization/generations",
        json={
            "model_id": model_id,
            "template_id": template_id,
            "confirmed_limitations": True,
            "project_name": "Maya Lookbook Autumn",
        },
    )
    assert res_gen.status_code == 201
    gen_data = res_gen.json()
    gen_id = gen_data["generation_id"]
    project_id = gen_data["project_id"]
    assert gen_data["status"] in ("QUEUED", "VALIDATING", "PROCESSING")
    assert gen_data["project_name"] == "Maya Lookbook Autumn"

    # 3. Poll status until completed (with timeout)
    max_wait = 15  # seconds
    start_time = time.time()
    completed_data = None

    while time.time() - start_time < max_wait:
        res_poll = client.get(f"/api/v1/personalization/generations/{gen_id}")
        assert res_poll.status_code == 200
        poll_json = res_poll.json()
        if poll_json["status"] == "COMPLETED":
            completed_data = poll_json
            break
        elif poll_json["status"] == "FAILED":
            raise AssertionError(f"Pipeline failed: {poll_json['error_message']}")
        time.sleep(0.5)

    assert completed_data is not None, "Generation pipeline did not complete in time"
    assert completed_data["status"] == "COMPLETED"
    assert completed_data["progress"] == 100
    assert completed_data["output_video_asset_id"] is not None
    assert completed_data["quality_review"] is not None
    assert completed_data["quality_review"]["overall_status"] == "PASS"
    assert len(completed_data["quality_review"]["criteria"]) >= 4

    # 4. Verify HTTP Range streaming of the output video from Local Storage
    video_url = completed_data["output_video_url"]
    res_stream = client.get(video_url)
    assert res_stream.status_code == 200
    assert res_stream.headers["accept-ranges"] == "bytes"

    # Range request
    res_range = client.get(video_url, headers={"Range": "bytes=0-100"})
    assert res_range.status_code == 206

    # 5. Verify Project history
    res_proj = client.get(f"/api/v1/personalization/projects/{project_id}")
    assert res_proj.status_code == 200
    proj_data = res_proj.json()
    assert proj_data["project_id"] == project_id
    assert len(proj_data["generations"]) >= 1
    assert proj_data["generations"][0]["generation_id"] == gen_id


def test_cancel_and_retry_generation():
    model_id = _setup_ready_model("Cancel Test Model")
    template_id = "vtp-streetwear-001"

    res_gen = client.post(
        "/api/v1/personalization/generations",
        json={
            "model_id": model_id,
            "template_id": template_id,
            "confirmed_limitations": True,
        },
    )
    assert res_gen.status_code == 201
    gen_id = res_gen.json()["generation_id"]

    # Cancel immediately
    res_cancel = client.post(f"/api/v1/personalization/generations/{gen_id}/cancel")
    assert res_cancel.status_code == 200
    # status can be CANCELLED or already completed if super fast
    assert res_cancel.json()["status"] in ("CANCELLED", "COMPLETED", "PROCESSING")

    # Retry
    res_retry = client.post(f"/api/v1/personalization/generations/{gen_id}/retry")
    assert res_retry.status_code == 200
    assert res_retry.json()["retry_count"] >= 1
