from abc import ABC, abstractmethod
from typing import Any


class BaseTikTokShopClient(ABC):
    """
    Abstract interface for TikTok Shop Affiliate API and compliant authorized data feeds.
    Strictly prohibits scraping and unauthorized fake product metrics.
    """

    @abstractmethod
    async def get_affiliate_products(
        self, query: str, limit: int = 20
    ) -> list[dict[str, Any]]:
        """Fetch affiliate product list via authorized partner API."""
        raise NotImplementedError
