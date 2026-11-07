"""
Storage Adapter Interface & Local Storage Provider
TrendMotion Studio strictly uses Local Filesystem Storage (LOCAL_STORAGE_ROOT).
Cloud object storage dependencies (R2, S3, Cloudinary) are prohibited.
"""

from app.services.storage import LocalStorageService, storage_service

__all__ = ["LocalStorageService", "storage_service"]
