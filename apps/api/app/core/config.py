from pathlib import Path

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application settings
    APP_ENV: str = "development"
    APP_NAME: str = "TrendMotion Studio API"
    API_PREFIX: str = "/api/v1"

    # Database & Cache
    DATABASE_URL: str = "postgresql+psycopg://trendmotion_user:trendmotion_dev_pass@localhost:5432/trendmotion_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:4173,http://localhost:4174,http://127.0.0.1:5173,http://127.0.0.1:4173,http://127.0.0.1:4174,http://localhost:3000"

    # Security & Authentication
    JWT_SECRET_KEY: str = "dev-secret-key-do-not-use-in-production"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Storage (Local Filesystem - Mandatory Architecture)
    LOCAL_STORAGE_ROOT: str = "./data/storage"
    MAX_UPLOAD_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB for photos
    MAX_VIDEO_UPLOAD_SIZE_BYTES: int = 100 * 1024 * 1024  # 100 MB for videos

    # Media Processing Executables
    FFMPEG_PATH: str = "ffmpeg"
    FFPROBE_PATH: str = "ffprobe"

    # AI Provider Adapters
    AI_IMAGE_PROVIDER: str = "mock"
    AI_VIDEO_PROVIDER: str = "mock"

    @computed_field
    @property
    def cors_origins_list(self) -> list[str]:
        return [
            origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()
        ]

    @computed_field
    @property
    def storage_root_path(self) -> Path:
        """
        Resolves LOCAL_STORAGE_ROOT deterministically relative to repository root,
        ensuring zero dependency on process current working directory.
        """
        raw_path = Path(self.LOCAL_STORAGE_ROOT)
        if raw_path.is_absolute():
            return raw_path.resolve()

        # Find monorepo root (where pnpm-workspace.yaml or AGENTS.md resides)
        current = Path(__file__).resolve().parent
        repo_root = None
        for p in list(current.parents):
            if (p / "pnpm-workspace.yaml").is_file() or (p / "AGENTS.md").is_file():
                repo_root = p
                break
        if not repo_root:
            # Fallback 5 levels up: app/core/config.py -> core -> app -> api -> apps -> root
            repo_root = Path(__file__).resolve().parents[4]

        resolved = (repo_root / raw_path).resolve()
        return resolved


settings = Settings()
