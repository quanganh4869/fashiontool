# TrendMotion Studio API

FastAPI-based backend for TrendMotion Studio.

## Architecture

The backend follows a layered and modular architecture:
- `app/api/`: HTTP endpoints divided by API version (`v1`). Routers are lean and delegate to services.
- `app/core/`: Application settings, security utilities, and logging configuration.
- `app/db/`: Database session management and base declarative model.
- `app/models/`: SQLAlchemy database models (developed in subsequent phases).
- `app/schemas/`: Pydantic request and response schemas.
- `app/repositories/`: Data access layer isolating database interactions.
- `app/services/`: Core business logic layer.
- `app/integrations/`: Provider adapters for external APIs (TikTok, AI generators, R2 storage, payments).
- `app/workers/`: Celery application and background worker tasks.
- `app/middleware/`: Custom FastAPI middleware (CORS, auth, request logging).
- `app/utils/`: Pure utility functions.
- `migrations/`: Alembic database migration scripts.
- `tests/`: Unit, integration, and contract test suites.

## Local Development

```bash
# Activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Run FastAPI development server
python -m uvicorn app.main:app --reload --port 8000
```
