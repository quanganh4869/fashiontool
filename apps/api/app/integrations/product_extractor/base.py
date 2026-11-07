from abc import ABC, abstractmethod
from typing import Any
from pydantic import BaseModel, Field


class RawExtractedMetadata(BaseModel):
    title: str | None = None
    description: str | None = None
    brand: str | None = None
    category: str | None = None
    price: float | None = None
    currency: str | None = None
    sku: str | None = None
    canonical_url: str | None = None
    image_urls: list[str] = Field(default_factory=list)
    variants: list[dict[str, Any]] = Field(default_factory=list)
    adapter_name: str = "base"


class BaseProductExtractorAdapter(ABC):
    """
    Abstract interface for product page metadata and image extractors.
    Each adapter can handle specific schemas, platforms, or fallbacks.
    """

    @abstractmethod
    def can_handle(self, url: str, html: str) -> bool:
        """Determines if this adapter can extract data from the page."""
        pass

    @abstractmethod
    def extract(self, url: str, html: str) -> RawExtractedMetadata:
        """Extracts product attributes and image URLs from the page."""
        pass
