from abc import ABC, abstractmethod
from typing import Any


class BasePaymentAdapter(ABC):
    """
    Payment Gateway Adapter interface.
    Handles credit package checkout sessions and webhooks.
    """

    @abstractmethod
    async def create_checkout_session(
        self, user_id: str, package_id: str, amount_cents: int
    ) -> dict[str, Any]:
        """Create a payment session for purchasing credits."""
        raise NotImplementedError
