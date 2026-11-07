from abc import ABC, abstractmethod
from typing import Any


class BaseVideoGenerationAdapter(ABC):
    """
    Provider Adapter interface for Video Generation models.
    Supports pluggable video generation engines (e.g. Kling, Runway, Luma) without vendor lock-in.
    """

    @abstractmethod
    async def create_video_task(
        self, image_url: str, prompt: str, **kwargs: Any
    ) -> dict[str, Any]:
        """Initiate video generation task."""
        raise NotImplementedError

    @abstractmethod
    async def get_task_status(self, task_id: str) -> dict[str, Any]:
        """Query video rendering task status."""
        raise NotImplementedError
