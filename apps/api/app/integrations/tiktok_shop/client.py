import logging
import os
import urllib.parse
from typing import Any
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

TIKTOK_SHOP_AUTH_BASE = "https://auth.tiktok-shops.com"
TIKTOK_SHOP_API_BASE = "https://open-api.tiktokglobalshop.com"
TIKTOK_SHOP_OAUTH_PAGE = "https://services.tiktokshop.com/open/authorize"


class TikTokShopAPIError(Exception):
    def __init__(self, message: str, code: int | None = None, response_data: dict[str, Any] | None = None):
        super().__init__(message)
        self.code = code
        self.response_data = response_data or {}


class TikTokShopRateLimitError(TikTokShopAPIError):
    pass


class TikTokShopAuthExpiredError(TikTokShopAPIError):
    pass


class TikTokShopClient:
    """
    Official TikTok Shop Open Platform & Affiliate API Client (v2).
    Follows official specs:
      - https://partner.tiktokshop.com/docv2/page/affiliate-integration
      - https://partner.tiktokshop.com/docv2/page/search-open-collaboration-products
    """

    def __init__(
        self,
        app_key: str | None = None,
        app_secret: str | None = None,
        service_id: str | None = None,
    ):
        self.app_key = app_key or os.getenv("TIKTOK_SHOP_APP_KEY", "")
        self.app_secret = app_secret or os.getenv("TIKTOK_SHOP_APP_SECRET", "")
        self.service_id = service_id or os.getenv("TIKTOK_SHOP_SERVICE_ID", "")

    @property
    def is_configured(self) -> bool:
        return bool(self.app_key and self.app_secret)

    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        """
        Generates the official TikTok Shop Open Platform OAuth authorization URL.
        """
        if not self.is_configured:
            raise ValueError("TikTok Shop App Key và App Secret chưa được cấu hình trong biến môi trường.")

        params = {
            "app_key": self.app_key,
            "state": state,
            "redirect_uri": redirect_uri,
        }
        if self.service_id:
            params["service_id"] = self.service_id

        return f"{TIKTOK_SHOP_OAUTH_PAGE}?{urllib.parse.urlencode(params)}"

    async def exchange_code_for_token(self, code: str) -> dict[str, Any]:
        """
        Exchanges authorization code for access token and refresh token via:
        POST https://auth.tiktok-shops.com/api/v2/token/get
        """
        if not self.is_configured:
            raise ValueError("TikTok Shop App Key và App Secret chưa được cấu hình.")

        url = f"{TIKTOK_SHOP_AUTH_BASE}/api/v2/token/get"
        params = {
            "app_key": self.app_key,
            "app_secret": self.app_secret,
            "auth_code": code,
            "grant_type": "authorized_code",
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, params=params)
            data = resp.json()

            code_res = data.get("code")
            if code_res != 0:
                msg = data.get("message", "Lỗi xác thực mã ủy quyền TikTok Shop")
                raise TikTokShopAPIError(f"TikTok Shop OAuth failed: {msg}", code=code_res, response_data=data)

            return data.get("data", {})

    async def refresh_access_token(self, refresh_token: str) -> dict[str, Any]:
        """
        Refreshes expired access token via:
        POST https://auth.tiktok-shops.com/api/v2/token/refresh
        """
        if not self.is_configured:
            raise ValueError("TikTok Shop App Key và App Secret chưa được cấu hình.")

        url = f"{TIKTOK_SHOP_AUTH_BASE}/api/v2/token/refresh"
        params = {
            "app_key": self.app_key,
            "app_secret": self.app_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, params=params)
            data = resp.json()

            code_res = data.get("code")
            if code_res != 0:
                msg = data.get("message", "Lỗi làm mới token TikTok Shop")
                raise TikTokShopAPIError(f"TikTok Shop token refresh failed: {msg}", code=code_res, response_data=data)

            return data.get("data", {})

    async def search_open_collaboration_products(
        self,
        access_token: str,
        keyword: str | None = None,
        category_id: str | None = None,
        page_size: int = 12,
        page_token: str | None = None,
        price_min: float | None = None,
        price_max: float | None = None,
        commission_min: float | None = None,
        commission_max: float | None = None,
        sort_by: str = "COMMISSION_RATE",
        sort_order: str = "DESC",
    ) -> dict[str, Any]:
        """
        Calls official TikTok Shop Affiliate API for Open Collaboration products:
        POST /affiliate_creator/202409/open_collaboration/products/search
        """
        endpoint = f"{TIKTOK_SHOP_API_BASE}/affiliate_creator/202409/open_collaboration/products/search"
        headers = {
            "x-tts-access-token": access_token,
            "content-type": "application/json",
        }
        params = {
            "app_key": self.app_key,
            "page_size": min(page_size, 50),
        }
        if page_token:
            params["page_token"] = page_token

        body: dict[str, Any] = {}
        if keyword:
            body["keyword"] = keyword
        if category_id:
            body["category_id"] = category_id

        # Price range filter in minor units (or VND currency)
        if price_min is not None or price_max is not None:
            body["price_range"] = {
                "currency": "VND",
                "min": str(int(price_min)) if price_min is not None else "0",
                "max": str(int(price_max)) if price_max is not None else "999999999",
            }

        # Commission rate range
        if commission_min is not None or commission_max is not None:
            body["commission_rate_range"] = {
                "min": commission_min if commission_min is not None else 0.0,
                "max": commission_max if commission_max is not None else 100.0,
            }

        body["sort_field"] = sort_by
        body["sort_order"] = sort_order

        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(endpoint, params=params, json=body, headers=headers)
            
            if resp.status_code == 429:
                raise TikTokShopRateLimitError("Vượt quá giới hạn gọi TikTok Shop API (Rate limit). Vui lòng thử lại sau.")
            if resp.status_code == 401:
                raise TikTokShopAuthExpiredError("Phiên làm việc TikTok Shop đã hết hạn. Vui lòng kết nối lại tài khoản.")

            data = resp.json()
            code_res = data.get("code")
            if code_res != 0:
                msg = data.get("message", "Lỗi tìm kiếm sản phẩm affiliate")
                raise TikTokShopAPIError(f"TikTok Shop Search error: {msg}", code=code_res, response_data=data)

            return data.get("data", {})

    async def get_product_detail(self, access_token: str, product_id: str) -> dict[str, Any]:
        """
        Calls official TikTok Shop Affiliate API for a single product detail:
        GET /affiliate_creator/202409/products/{product_id}
        """
        endpoint = f"{TIKTOK_SHOP_API_BASE}/affiliate_creator/202409/products/{product_id}"
        headers = {
            "x-tts-access-token": access_token,
        }
        params = {
            "app_key": self.app_key,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(endpoint, params=params, headers=headers)
            if resp.status_code == 429:
                raise TikTokShopRateLimitError("Vượt quá giới hạn gọi TikTok Shop API (Rate limit).")
            if resp.status_code == 401:
                raise TikTokShopAuthExpiredError("Phiên làm việc TikTok Shop đã hết hạn.")

            data = resp.json()
            code_res = data.get("code")
            if code_res != 0:
                msg = data.get("message", "Lỗi lấy chi tiết sản phẩm")
                raise TikTokShopAPIError(f"TikTok Shop Product detail error: {msg}", code=code_res, response_data=data)

            return data.get("data", {})


# Global singleton instance
tiktok_shop_client = TikTokShopClient()
