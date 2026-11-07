from abc import ABC, abstractmethod
from typing import Any


class BaseImageGenerationAdapter(ABC):
    """
    Provider Adapter interface for Image Generation models.
    Supports pluggable third-party image generation APIs without vendor lock-in.
    """

    @abstractmethod
    async def generate_fashion_image(
        self, prompt: str, negative_prompt: str | None = None, **kwargs: Any
    ) -> dict[str, Any]:
        """Generate fashion imagery based on given prompt and parameters."""
        raise NotImplementedError
