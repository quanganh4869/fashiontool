from fastapi.testclient import TestClient

from app import __version__
from app.core.config import settings
from app.main import app

client = TestClient(app)


def test_root_health_check():
    """Verify root /health endpoint returns HTTP 200 and expected schema."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == settings.APP_NAME
    assert data["version"] == __version__
    assert data["environment"] == settings.APP_ENV


def test_api_v1_health_check():
    """Verify /api/v1/health endpoint returns HTTP 200 and expected schema."""
    response = client.get(f"{settings.API_PREFIX}/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == settings.APP_NAME
