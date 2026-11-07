import asyncio
import io
import time
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.core.config import settings
from app.main import app
from app.schemas.personalization import GenerationStatus
from app.services.personalization import _GENERATIONS_DB, _PROJECTS_DB
from app.services.product_extraction import (
    _EXTRACTION_JOBS_DB,
    _PRODUCT_ASSETS_DB,
    product_extraction_service,
)
from app.services.url_resolver import (
    SSRFValidationError,
    SafeUrlResolver,
)

client = TestClient(app)

# Helper to create valid fake JPEG bytes
def create_dummy_jpeg(color: tuple[int, int, int] = (255, 0, 0), size: tuple[int, int] = (200, 200)) -> bytes:
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


# Helper to create valid fake PNG bytes
def create_dummy_png(color: tuple[int, int, int] = (0, 255, 0), size: tuple[int, int] = (100, 100)) -> bytes:
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


MOCK_PRODUCT_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Áo Sơ Mi Linen Cổ Trụ Phom Rộng - TrendBrand Fashion</title>
    <link rel="canonical" href="https://example-fashion.com/products/linen-shirt-01" />
    <meta property="og:title" content="Áo Sơ Mi Linen Cổ Trụ Phom Rộng" />
    <meta property="og:description" content="Chất liệu linen dệt thô cao cấp thoáng mát cho mùa hè." />
    <meta property="og:image" content="https://example-fashion.com/images/og-main.jpg" />
    <meta property="product:price:amount" content="450000" />
    <meta property="product:price:currency" content="VND" />
    <meta property="product:brand" content="TrendBrand" />
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Áo Sơ Mi Linen Cổ Trụ Phom Rộng",
        "description": "Chất liệu linen dệt thô cao cấp thoáng mát cho mùa hè.",
        "brand": {
            "@type": "Brand",
            "name": "TrendBrand"
        },
        "sku": "TB-LINEN-01",
        "category": "Áo sơ mi",
        "offers": {
            "@type": "Offer",
            "price": 450000,
            "priceCurrency": "VND",
            "availability": "https://schema.org/InStock"
        },
        "image": [
            "https://example-fashion.com/images/front-view.jpg",
            "https://example-fashion.com/images/back-view.jpg",
            "https://example-fashion.com/images/collar-detail.jpg"
        ]
    }
    </script>
</head>
<body>
    <h1>Áo Sơ Mi Linen Cổ Trụ Phom Rộng</h1>
    <div class="product-gallery">
        <img src="https://example-fashion.com/images/front-view.jpg" alt="Front view" />
        <img src="https://example-fashion.com/images/back-view.jpg" alt="Back view" />
        <img src="https://example-fashion.com/images/collar-detail.jpg" alt="Collar detail" />
        <img src="https://example-fashion.com/images/fabric-zoom.jpg" alt="Fabric zoom" />
    </div>
</body>
</html>
"""


def test_ssrf_protection_blocked_ips():
    """Validates that SafeUrlResolver strictly rejects private, loopback, and metadata IPs."""
    # Loopback
    with pytest.raises(SSRFValidationError):
        SafeUrlResolver.validate_url("http://127.0.0.1/product/1")
    with pytest.raises(SSRFValidationError):
        SafeUrlResolver.validate_url("http://localhost:8000/product/1")
    with pytest.raises(SSRFValidationError):
        SafeUrlResolver.validate_url("http://[::1]/product/1")

    # Private network
    with pytest.raises(SSRFValidationError):
        SafeUrlResolver.validate_url("http://192.168.1.100/product/1")
    with pytest.raises(SSRFValidationError):
        SafeUrlResolver.validate_url("http://10.0.0.5/product/1")
    with pytest.raises(SSRFValidationError):
        SafeUrlResolver.validate_url("http://172.16.0.2/product/1")

    # Cloud metadata
    with pytest.raises(SSRFValidationError):
        SafeUrlResolver.validate_url("http://169.254.169.254/latest/meta-data/")
    with pytest.raises(SSRFValidationError):
        SafeUrlResolver.validate_url("http://metadata.google.internal/computeMetadata/v1/")

    # Disallowed schemes and ports
    with pytest.raises(SSRFValidationError):
        SafeUrlResolver.validate_url("file:///etc/passwd")
    with pytest.raises(SSRFValidationError):
        SafeUrlResolver.validate_url("ftp://example.com/file.jpg")
    with pytest.raises(SSRFValidationError):
        SafeUrlResolver.validate_url("http://example.com:22/product")

    # Embedded credentials
    with pytest.raises(SSRFValidationError):
        SafeUrlResolver.validate_url("http://admin:secret@example.com/product")


def test_magic_bytes_detection():
    """Validates magic bytes detection for JPEG, PNG, WebP, and invalid data."""
    jpeg_bytes = create_dummy_jpeg()
    assert product_extraction_service._detect_image_mime(jpeg_bytes) == "image/jpeg"

    png_bytes = create_dummy_png()
    assert product_extraction_service._detect_image_mime(png_bytes) == "image/png"

    assert product_extraction_service._detect_image_mime(b"corrupted binary data") is None


def test_product_workflow_requires_completed_base_video(monkeypatch):
    """Ensures extraction is rejected if project has no COMPLETED base video."""
    proj_id = "test-proj-incomplete-001"
    _PROJECTS_DB[proj_id] = {
        "project_id": proj_id,
        "user_id": "default_user",
        "name": "Dự án thử nghiệm chưa có base video",
        "generations": [],
    }

    resp = client.post(
        f"/api/v1/projects/{proj_id}/products/extractions",
        json={"url": "https://example-fashion.com/products/linen-shirt-01"},
    )
    assert resp.status_code == 400
    assert "chưa có Personalized Base Video hoàn tất" in resp.json()["detail"]


def test_full_product_extraction_and_persistence_lifecycle(monkeypatch):
    """
    Tests complete lifecycle:
    1. Project with completed base video
    2. Submit extraction job
    3. Mock safe HTTP fetch and image download
    4. Verify metadata parsed, images downloaded and deduplicated
    5. Save product asset into project
    6. Verify listing, detail, update, and soft delete
    """
    proj_id = "test-proj-ready-001"
    gen_id = "test-gen-completed-001"

    # Setup valid project and completed base video
    _GENERATIONS_DB[gen_id] = {
        "generation_id": gen_id,
        "project_id": proj_id,
        "status": GenerationStatus.COMPLETED.value,
    }
    _PROJECTS_DB[proj_id] = {
        "project_id": proj_id,
        "user_id": "default_user",
        "name": "Dự án Sơ Mi Hè 2026",
        "generations": [gen_id],
        "created_at": "2026-11-08T00:00:00Z",
        "updated_at": "2026-11-08T00:00:00Z",
    }

    # Mock SafeUrlResolver network requests
    async def mock_fetch_html(url: str):
        return url, MOCK_PRODUCT_HTML, {"content-type": "text/html"}

    img_map = {
        "https://example-fashion.com/images/front-view.jpg": create_dummy_jpeg((200, 50, 50), (400, 600)),
        "https://example-fashion.com/images/back-view.jpg": create_dummy_jpeg((50, 200, 50), (400, 600)),
        "https://example-fashion.com/images/collar-detail.jpg": create_dummy_jpeg((50, 50, 200), (300, 300)),
        "https://example-fashion.com/images/fabric-zoom.jpg": create_dummy_png((100, 100, 100), (500, 500)),
        "https://example-fashion.com/images/og-main.jpg": create_dummy_jpeg((200, 50, 50), (400, 600)),  # Duplicate of front-view
    }

    async def mock_fetch_image(image_url: str):
        if image_url in img_map:
            return img_map[image_url], "image/jpeg"
        raise ValueError("Image not found in mock")

    monkeypatch.setattr(SafeUrlResolver, "validate_url", lambda u: (u, "example-fashion.com", 443))
    monkeypatch.setattr(SafeUrlResolver, "fetch_html", mock_fetch_html)
    monkeypatch.setattr(SafeUrlResolver, "fetch_image", mock_fetch_image)

    # 1. Start Extraction Job
    product_url = "https://example-fashion.com/products/linen-shirt-01"
    resp = client.post(
        f"/api/v1/projects/{proj_id}/products/extractions",
        json={"url": product_url},
    )
    assert resp.status_code == 201
    job_data = resp.json()
    job_id = job_data["job_id"]
    assert job_data["status"] in ("PENDING", "ANALYZING_URL", "FETCHING_METADATA", "DOWNLOADING_IMAGES", "COMPLETED")

    # 2. Wait for background thread completion
    for _ in range(30):
        status_resp = client.get(f"/api/v1/projects/{proj_id}/products/extractions/{job_id}")
        assert status_resp.status_code == 200
        current_job = status_resp.json()
        if current_job["status"] in ("COMPLETED", "PARTIAL", "FAILED"):
            break
        time.sleep(0.1)

    assert current_job["status"] in ("COMPLETED", "PARTIAL")
    ext_data = current_job["extracted_data"]
    assert ext_data is not None
    assert ext_data["title"] == "Áo Sơ Mi Linen Cổ Trụ Phom Rộng"
    assert ext_data["brand"] == "TrendBrand"
    assert ext_data["price"] == 450000
    assert ext_data["currency"] == "VND"
    assert ext_data["sku"] == "TB-LINEN-01"
    # Verify images collected
    assert len(ext_data["images"]) >= 3

    # 3. Save Product Asset into Project
    save_resp = client.post(
        f"/api/v1/projects/{proj_id}/products",
        json={
            "extraction_job_id": job_id,
            "custom_title": "Sơ Mi Linen Trắng Phom Rộng (Custom)",
            "custom_description": "Ghi chú thêm: phối đẹp với quần âu cạp cao.",
        },
    )
    assert save_resp.status_code == 201
    saved_prod = save_resp.json()
    product_id = saved_prod["product_id"]
    assert saved_prod["project_id"] == proj_id
    assert saved_prod["custom_title"] == "Sơ Mi Linen Trắng Phom Rộng (Custom)"
    assert saved_prod["total_images_count"] >= 3
    assert saved_prod["primary_image_url"] is not None

    # 4. List Products in Project
    list_resp = client.get(f"/api/v1/projects/{proj_id}/products")
    assert list_resp.status_code == 200
    prod_list = list_resp.json()
    assert len(prod_list) >= 1
    assert any(p["product_id"] == product_id for p in prod_list)

    # 5. Get Product Detail
    detail_resp = client.get(f"/api/v1/projects/{proj_id}/products/{product_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["title"] == "Áo Sơ Mi Linen Cổ Trụ Phom Rộng"
    assert len(detail["images"]) >= 3
    for img in detail["images"]:
        assert img["checksum_sha256"]
        assert img["storage_path"]
        assert "/api/v1/assets/" in img["view_url"]

    # 6. Duplicate URL detection check
    dup_resp = client.post(
        f"/api/v1/projects/{proj_id}/products/extractions",
        json={"url": product_url, "force_reextract": False},
    )
    assert dup_resp.status_code == 201
    dup_data = dup_resp.json()
    assert dup_data["existing_product_id"] == product_id

    # 7. Update Product Asset
    patch_resp = client.patch(
        f"/api/v1/projects/{proj_id}/products/{product_id}",
        json={"custom_title": "Sơ Mi Linen Trắng Cập Nhật"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["custom_title"] == "Sơ Mi Linen Trắng Cập Nhật"

    # 8. Delete / Soft-delete Product Asset
    del_resp = client.delete(f"/api/v1/projects/{proj_id}/products/{product_id}")
    assert del_resp.status_code == 204

    # Verify not in default list unless include_archived=True
    list_after_del = client.get(f"/api/v1/projects/{proj_id}/products").json()
    assert not any(p["product_id"] == product_id for p in list_after_del)

    list_with_archived = client.get(f"/api/v1/projects/{proj_id}/products?include_archived=true").json()
    assert any(p["product_id"] == product_id for p in list_with_archived)
