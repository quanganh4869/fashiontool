from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_template_categories():
    """Verify listing of template categories with accurate item counts."""
    res = client.get("/api/v1/templates/categories")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0

    all_cat = next((c for c in data if c["id"] == "all"), None)
    assert all_cat is not None
    assert all_cat["count"] >= 6


def test_list_templates_pagination_and_filter():
    """Verify querying templates with search, category filter, and pagination."""
    # 1. Default list
    res = client.get("/api/v1/templates")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total"] >= 6
    assert data["page"] == 1

    # 2. Category filter
    res_cat = client.get("/api/v1/templates?category=fashion_walk")
    assert res_cat.status_code == 200
    cat_data = res_cat.json()
    assert all(item["category_id"] == "fashion_walk" for item in cat_data["items"])

    # 3. Search query
    res_search = client.get("/api/v1/templates?query=Đường+Phố")
    assert res_search.status_code == 200
    search_data = res_search.json()
    assert len(search_data["items"]) >= 1

    # 4. Aspect ratio filter
    res_aspect = client.get("/api/v1/templates?aspect_ratio=9:16")
    assert res_aspect.status_code == 200
    aspect_data = res_aspect.json()
    assert all(item["aspect_ratio"] == "9:16" for item in aspect_data["items"])

    # 5. Garment slot filter
    res_slot = client.get("/api/v1/templates?garment_slot=upper_body")
    assert res_slot.status_code == 200
    slot_data = res_slot.json()
    assert len(slot_data["items"]) > 0


def test_template_detail_and_not_found():
    """Verify getting complete template details and 404 on missing template."""
    # 1. Valid detail
    res = client.get("/api/v1/templates/vtp-streetwear-001")
    assert res.status_code == 200
    data = res.json()
    assert data["template_id"] == "vtp-streetwear-001"
    assert data["template_code"] == "VTP-000101"
    assert "scenes" in data
    assert len(data["scenes"]) > 0
    assert "garment_slots" in data
    assert "compatibility" in data
    assert data["compatibility"]["supported_subject_count"] >= 1

    # 2. Nonexistent detail
    res_404 = client.get("/api/v1/templates/nonexistent-template-id")
    assert res_404.status_code == 404


def test_template_favorite_toggle():
    """Verify toggling favorite status of a video template."""
    template_id = "vtp-streetwear-001"

    # 1. Toggle ON
    res_on = client.post(f"/api/v1/templates/{template_id}/favorite")
    assert res_on.status_code == 200
    data_on = res_on.json()
    assert data_on["is_favorite"] is True

    # 2. Check in list with is_favorite=true filter
    res_fav_list = client.get("/api/v1/templates?is_favorite=true")
    assert res_fav_list.status_code == 200
    fav_items = res_fav_list.json()["items"]
    assert any(i["template_id"] == template_id for i in fav_items)

    # 3. Toggle OFF
    res_off = client.post(f"/api/v1/templates/{template_id}/favorite")
    assert res_off.status_code == 200
    data_off = res_off.json()
    assert data_off["is_favorite"] is False

    # 4. 404 for nonexistent template
    res_bad = client.post("/api/v1/templates/nonexistent-template/favorite")
    assert res_bad.status_code == 404


def test_template_video_stream():
    """Verify streaming source video from local storage with HTTP Range support."""
    template_id = "vtp-streetwear-001"

    # Full request
    res_full = client.get(f"/api/v1/templates/{template_id}/stream")
    assert res_full.status_code == 200
    assert "accept-ranges" in res_full.headers
    assert res_full.headers["accept-ranges"] == "bytes"

    # Range request (first 100 bytes)
    res_range = client.get(
        f"/api/v1/templates/{template_id}/stream",
        headers={"Range": "bytes=0-99"},
    )
    assert res_range.status_code == 206
    assert "content-range" in res_range.headers
    assert res_range.headers["content-range"].startswith("bytes 0-99/")
    assert len(res_range.content) == 100
