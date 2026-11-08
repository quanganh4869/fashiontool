import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.integrations.tiktok_shop.taxonomy import map_source_category
from app.schemas.product_research import (
    ProductCollaborationStatus,
    ScoreStatus,
    TikTokShopAccountType,
    TikTokShopConnectionStatus,
)
from app.services.personalization import _GENERATIONS_DB, _PROJECTS_DB
from app.services.product_research import (
    connection_service,
    product_research_service,
)

client = TestClient(app)


def test_taxonomy_mapping():
    # 1. Exact ID mapping
    cat_id, sub_id = map_source_category("60113401")
    assert cat_id == "WOMEN_FASHION"
    assert sub_id == "shirts_blouses"

    # 2. Textual mapping from verified category names
    cat_id2, sub_id2 = map_source_category("", "Women's Shirts & Blouses", "Áo sơ mi lụa")
    assert cat_id2 == "WOMEN_FASHION"
    assert sub_id2 == "shirts_blouses"

    # 3. Cardigan mapping
    cat_id3, sub_id3 = map_source_category("", "", "Áo cardigan dệt kim phong cách Hàn Quốc")
    assert cat_id3 == "WOMEN_FASHION"
    assert sub_id3 == "cardigans_knitwear"

    # 4. Men's shirt mapping
    cat_id4, sub_id4 = map_source_category("", "Men's Clothing", "Áo sơ mi nam công sở")
    assert cat_id4 == "MEN_FASHION"
    assert sub_id4 == "shirts"

    # 5. Unmapped category
    cat_id5, sub_id5 = map_source_category("", "Unknown Random Category", "Vật phẩm ngẫu nhiên")
    assert cat_id5 == "INTERNAL_CATEGORY_UNMAPPED"
    assert sub_id5 is None


def test_opportunity_score_calculation():
    # 1. High-potential product (Grade A)
    score_high = product_research_service.calculate_opportunity_score(
        commission_rate=20.0,
        sale_price=280000.0,  # Optimal sweet spot 150k - 450k
        units_sold_30d=650,   # Strong sales
        collaboration_status=ProductCollaborationStatus.OPEN_COLLABORATION,
    )
    assert score_high.status == ScoreStatus.CALCULATED
    assert score_high.score is not None
    assert score_high.score >= 80.0
    assert score_high.grade == "A"
    assert len(score_high.missing_fields) == 0

    # 2. Moderate product (Grade C)
    score_mod = product_research_service.calculate_opportunity_score(
        commission_rate=10.0,
        sale_price=200000.0,
        units_sold_30d=100,
        collaboration_status=ProductCollaborationStatus.TARGETED_COLLABORATION,
    )
    assert score_mod.status == ScoreStatus.CALCULATED
    assert score_mod.score is not None
    assert 50.0 <= score_mod.score < 65.0
    assert score_mod.grade == "C"

    # 3. Missing crucial data -> INSUFFICIENT_DATA
    score_missing = product_research_service.calculate_opportunity_score(
        commission_rate=None,
        sale_price=300000.0,
        units_sold_30d=None,
        collaboration_status=ProductCollaborationStatus.UNKNOWN,
    )
    assert score_missing.status == ScoreStatus.INSUFFICIENT_DATA
    assert score_missing.score is None
    assert score_missing.grade == "N/A"
    assert "commission_rate" in score_missing.missing_fields
    assert "units_sold_30d" in score_missing.missing_fields


def test_account_connection_status_and_disconnect():
    user_id = "usr-test-conn-01"

    # 1. Initial status when unconfigured
    res_status = client.get(f"/api/v1/integrations/tiktok-shop/status?user_id={user_id}")
    assert res_status.status_code == 200
    data = res_status.json()
    assert data["status"] in ("NOT_CONFIGURED", "DISCONNECTED")
    assert data["setup_guide"] is not None

    # 2. Generate auth URL
    res_auth = client.get(
        f"/api/v1/integrations/tiktok-shop/auth-url?user_id={user_id}&redirect_uri=http://localhost:5173/settings"
    )
    assert res_auth.status_code == 200
    auth_data = res_auth.json()
    assert "auth_url" in auth_data
    assert "state" in auth_data

    # 3. Set verified connection record
    connection_service.set_authorized_connection_record(
        user_id=user_id,
        record={
            "connection_id": "conn-test-verified-01",
            "user_id": user_id,
            "account_name": "Linh Fashion Creator",
            "account_type": TikTokShopAccountType.CREATOR.value,
            "market": "VN",
            "status": TikTokShopConnectionStatus.CONNECTED.value,
            "scopes": ["affiliate_creator.open_collaboration.read", "affiliate_creator.product.read"],
            "access_token": "token_mock_test_12345",
            "access_token_expires_at": "2099-01-01T00:00:00+00:00",
        },
    )

    res_verified = client.get(f"/api/v1/integrations/tiktok-shop/status?user_id={user_id}")
    assert res_verified.status_code == 200
    v_data = res_verified.json()
    assert v_data["status"] == "CONNECTED"
    assert v_data["account_name"] == "Linh Fashion Creator"
    assert "access_token" not in v_data  # Never leaks token!

    # 4. Disconnect
    res_disc = client.post(f"/api/v1/integrations/tiktok-shop/disconnect?user_id={user_id}")
    assert res_disc.status_code == 200
    res_after = client.get(f"/api/v1/integrations/tiktok-shop/status?user_id={user_id}")
    assert res_after.json()["status"] == "DISCONNECTED"


def test_product_search_and_filters():
    user_id = "usr-test-search-01"

    # Pre-load verified marketplace products
    fixtures = [
        {
            "product_id": "tts-prod-001",
            "title": "Áo Sơ Mi Nữ Trắng Dáng Rộng Cổ Điển",
            "description": "Áo sơ mi trắng chất liệu cotton poplin cao cấp, 6 cúc",
            "sale_price": 285000.0,
            "original_price": 350000.0,
            "currency": "VND",
            "commission_rate": 18.0,
            "units_sold_30d": 420,
            "source_category_id": "60113401",
            "primary_image_url": "https://p16-va.tiktokcdn.com/product1.jpg",
            "image_gallery": ["https://p16-va.tiktokcdn.com/product1.jpg"],
            "collaboration_status": "OPEN_COLLABORATION",
            "shop_name": "TrendStyle Vietnam",
        },
        {
            "product_id": "tts-prod-002",
            "title": "Áo Cardigan Nữ Dệt Kim Cổ Tim Be",
            "description": "Cardigan dệt kim mềm mại phong cách thu đông",
            "sale_price": 320000.0,
            "currency": "VND",
            "commission_rate": 15.0,
            "units_sold_30d": 310,
            "source_category_id": "60113405",
            "primary_image_url": "https://p16-va.tiktokcdn.com/product2.jpg",
            "image_gallery": ["https://p16-va.tiktokcdn.com/product2.jpg"],
            "collaboration_status": "OPEN_COLLABORATION",
            "shop_name": "Knitwear Studio",
        },
        {
            "product_id": "tts-prod-003",
            "title": "Áo Sơ Mi Nam Oxford Trắng Dài Tay",
            "description": "Sơ mi nam công sở cotton",
            "sale_price": 450000.0,
            "currency": "VND",
            "commission_rate": 10.0,
            "units_sold_30d": 180,
            "source_category_id": "60113501",
            "primary_image_url": "https://p16-va.tiktokcdn.com/product3.jpg",
            "image_gallery": ["https://p16-va.tiktokcdn.com/product3.jpg"],
            "collaboration_status": "TARGETED_COLLABORATION",
            "shop_name": "MenFashion VN",
        },
    ]
    product_research_service.preload_verified_marketplace_fixtures(fixtures)

    # 1. Search when unconnected -> Empty list with clear guidance
    connection_service.disconnect(user_id)
    res_unconn = client.get(f"/api/v1/research/products?user_id={user_id}&query=sơ+mi")
    assert res_unconn.status_code == 200
    assert res_unconn.json()["total"] == 0
    assert "chưa được kết nối" in res_unconn.json()["notice"].lower()

    # 2. Search when connected
    connection_service.set_authorized_connection_record(
        user_id=user_id,
        record={
            "connection_id": "conn-test-search",
            "user_id": user_id,
            "account_name": "Affiliate Hunter",
            "account_type": "CREATOR",
            "market": "VN",
            "status": "CONNECTED",
            "scopes": ["affiliate_creator.open_collaboration.read"],
        },
    )

    res_search = client.get(f"/api/v1/research/products?user_id={user_id}&query=sơ+mi")
    assert res_search.status_code == 200
    data = res_search.json()
    assert data["total"] == 2  # 2 shirts found
    assert any(it["product_id"] == "tts-prod-001" for it in data["items"])
    assert any(it["product_id"] == "tts-prod-003" for it in data["items"])

    # 3. Filter by Category & Price
    res_filtered = client.get(
        f"/api/v1/research/products?user_id={user_id}&category_id=WOMEN_FASHION&price_max=300000"
    )
    assert res_filtered.status_code == 200
    f_data = res_filtered.json()
    assert f_data["total"] == 1
    assert f_data["items"][0]["product_id"] == "tts-prod-001"

    # 4. Product Detail
    res_det = client.get("/api/v1/research/products/tts-prod-001")
    assert res_det.status_code == 200
    det = res_det.json()
    assert det["pricing"]["sale_price"] == 285000.0
    assert det["commission"]["rate_percent"] == 18.0
    assert det["commission"]["estimated_amount"] == 51300.0  # 285000 * 0.18
    assert det["opportunity_score"]["grade"] in ("A", "B")

    # 5. Product Comparison
    res_comp = client.post(
        "/api/v1/research/compare",
        json={"product_ids": ["tts-prod-001", "tts-prod-002"]},
    )
    assert res_comp.status_code == 200
    comp_data = res_comp.json()
    assert len(comp_data["products"]) == 2

    # 6. Search History
    res_hist = client.get(f"/api/v1/research/history?user_id={user_id}")
    assert res_hist.status_code == 200
    hist = res_hist.json()
    assert len(hist) > 0


def test_studio_handoff_and_workflow_integrity():
    user_id = "usr-test-handoff-01"
    product_id = "tts-prod-001"

    # 1. Handoff without a project or without a completed Base Video
    res_handoff_raw = client.post(
        f"/api/v1/research/handoff-studio?user_id={user_id}",
        json={"product_id": product_id},
    )
    assert res_handoff_raw.status_code == 200
    h_data = res_handoff_raw.json()
    assert h_data["has_verified_base_video"] is False
    assert h_data["target_route"] == "/studio"  # Directs user to create/complete base video first

    # 2. Handoff with a Project that has a verified Personalized Base Video
    project_id = "prj-test-verified-01"
    _PROJECTS_DB[project_id] = {
        "project_id": project_id,
        "name": "Lookbook Test Linh",
        "model_name": "Linh",
        "current_generation_id": "gen-01",
    }
    _GENERATIONS_DB["gen-01"] = {
        "generation_id": "gen-01",
        "project_id": project_id,
        "status": "COMPLETED",
        "output_video_asset_id": "ast-base-01",
    }

    res_handoff_proj = client.post(
        f"/api/v1/research/handoff-studio?user_id={user_id}",
        json={"product_id": product_id, "project_id": project_id},
    )
    assert res_handoff_proj.status_code == 200
    p_data = res_handoff_proj.json()
    assert p_data["has_verified_base_video"] is True
    assert p_data["target_route"] == f"/studio/{project_id}/replacement"
    assert "https://shop.tiktok.com/view/product/" in p_data["product_url"]
    assert p_data["prefill_data"]["title"] == "Áo Sơ Mi Nữ Trắng Dáng Rộng Cổ Điển"
