from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_overview_summary():
    response = client.get("/api/v1/overview/summary?range=7d")
    assert response.status_code == 200
    data = response.json()
    assert "saved_products_count" in data
    assert "analyzed_channels_count" in data
    assert "generated_images_count" in data
    assert "generated_videos_count" in data


def test_get_overview_recent_projects():
    response = client.get("/api/v1/overview/recent-projects?limit=5")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_overview_active_jobs():
    response = client.get("/api/v1/overview/active-jobs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_overview_completed_videos():
    response = client.get("/api/v1/overview/completed-videos?limit=3")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_overview_saved_products():
    response = client.get("/api/v1/overview/saved-products?limit=4")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
