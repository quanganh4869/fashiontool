from abc import ABC, abstractmethod
from typing import Any


class BaseTikTokClient(ABC):
    """
    Abstract interface for official TikTok Display API integrations.
    Strictly uses official API specifications; no web scraping or unauthorized cookie sessions.
    """

    @abstractmethod
    async def get_creator_profile(self, creator_id: str) -> dict[str, Any]:
        """Fetch creator public profile information via official API."""
        raise NotImplementedError
