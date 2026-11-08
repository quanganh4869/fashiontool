import json
import logging
import secrets
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.integrations.tiktok_shop.client import tiktok_shop_client
from app.schemas.product_research import (
    TikTokShopAccountType,
    TikTokShopAuthUrlResponse,
    TikTokShopConnectionPublic,
    TikTokShopConnectionStatus,
)

logger = logging.getLogger(__name__)

_CONNECTIONS_DB_PATH = Path("data/db/tiktok_shop_connections.json")
_CONNECTIONS_DB: dict[str, dict[str, Any]] = {}
_OAUTH_STATES: dict[str, dict[str, Any]] = {}  # state -> {user_id, created_at, redirect_uri}


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _load_connections_db() -> None:
    global _CONNECTIONS_DB
    if _CONNECTIONS_DB_PATH.is_file():
        try:
            with open(_CONNECTIONS_DB_PATH, encoding="utf-8") as f:
                _CONNECTIONS_DB = json.load(f)
        except Exception as e:
            logger.warning("Could not load tiktok_shop_connections.json: %s", e)
            _CONNECTIONS_DB = {}


def _save_connections_db() -> None:
    try:
        _CONNECTIONS_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(_CONNECTIONS_DB_PATH, "w", encoding="utf-8") as f:
            json.dump(_CONNECTIONS_DB, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error("Failed to save tiktok_shop_connections.json: %s", e)


_load_connections_db()


class TikTokShopConnectionService:
    """
    Manages TikTok Shop account connections, OAuth state verification,
    token lifecycle, and secure token storage strictly at the backend.
    """

    SETUP_GUIDE_TEXT = (
        "Để kết nối TikTok Shop Affiliate API chính thức cho thị trường Việt Nam:\n"
        "1. Đăng ký tài khoản Partner tại https://partner.tiktokshop.com\n"
        "2. Tạo ứng dụng loại 'Custom App' hoặc 'Public Service App'.\n"
        "3. Yêu cầu các scopes: 'affiliate_creator.open_collaboration.read', 'affiliate_creator.product.read'.\n"
        "4. Cấu hình các biến môi trường tại Backend: TIKTOK_SHOP_APP_KEY, TIKTOK_SHOP_APP_SECRET, TIKTOK_SHOP_SERVICE_ID.\n"
        "5. Thêm Redirect URI ủy quyền: http://localhost:5173/settings hoặc domain chính thức của ứng dụng."
    )

    def get_connection(self, user_id: str) -> TikTokShopConnectionPublic:
        """
        Retrieves the public connection status for the user without exposing tokens.
        """
        # If client credentials are not configured in environment
        if not tiktok_shop_client.is_configured:
            # Check if there is an explicit record in DB
            rec = _CONNECTIONS_DB.get(user_id)
            if rec:
                return self._to_public(rec)
            return TikTokShopConnectionPublic(
                connection_id=f"conn-unconf-{user_id[:6]}",
                user_id=user_id,
                account_name="Chưa kết nối",
                account_type=TikTokShopAccountType.CREATOR,
                market="VN",
                status=TikTokShopConnectionStatus.NOT_CONFIGURED,
                scopes=[],
                setup_guide=self.SETUP_GUIDE_TEXT,
            )

        rec = _CONNECTIONS_DB.get(user_id)
        if not rec:
            return TikTokShopConnectionPublic(
                connection_id=f"conn-disc-{user_id[:6]}",
                user_id=user_id,
                account_name="Chưa kết nối",
                account_type=TikTokShopAccountType.CREATOR,
                market="VN",
                status=TikTokShopConnectionStatus.DISCONNECTED,
                scopes=[],
                setup_guide=self.SETUP_GUIDE_TEXT,
            )

        # Check token expiration
        expires_at_str = rec.get("access_token_expires_at")
        if expires_at_str:
            try:
                exp = datetime.fromisoformat(expires_at_str)
                if datetime.now(UTC) >= exp:
                    # Token expired, needs re-auth or refresh
                    rec["status"] = TikTokShopConnectionStatus.REAUTH_REQUIRED.value
                    _save_connections_db()
            except Exception:
                pass

        return self._to_public(rec)

    def generate_auth_url(self, user_id: str, redirect_uri: str) -> TikTokShopAuthUrlResponse:
        """
        Generates OAuth authorization URL with cryptographically secure state.
        """
        state = secrets.token_urlsafe(32)
        _OAUTH_STATES[state] = {
            "user_id": user_id,
            "redirect_uri": redirect_uri,
            "created_at": datetime.now(UTC).isoformat(),
        }

        # If not configured, provide clean instructive URL or raise
        if not tiktok_shop_client.is_configured:
            # Sandbox / Simulation state for development verification
            auth_url = f"https://services.tiktokshop.com/open/authorize?app_key=mock_app_key&state={state}&redirect_uri={redirect_uri}"
            return TikTokShopAuthUrlResponse(auth_url=auth_url, state=state, expires_in_seconds=600)

        auth_url = tiktok_shop_client.get_authorization_url(state=state, redirect_uri=redirect_uri)
        return TikTokShopAuthUrlResponse(auth_url=auth_url, state=state, expires_in_seconds=600)

    async def handle_callback(self, user_id: str, code: str, state: str) -> TikTokShopConnectionPublic:
        """
        Verifies state and exchanges authorization code for tokens.
        """
        saved_state = _OAUTH_STATES.pop(state, None)
        if not saved_state or saved_state.get("user_id") != user_id:
            raise ValueError("State OAuth không hợp lệ hoặc đã hết hạn (CSRF Protection).")

        token_data = await tiktok_shop_client.exchange_code_for_token(code)

        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        expires_in = int(token_data.get("access_token_expire_in", 86400))
        refresh_expires_in = int(token_data.get("refresh_token_expire_in", 2592000))

        now = datetime.now(UTC)
        access_expires_at = (now + timedelta(seconds=expires_in)).isoformat()
        refresh_expires_at = (now + timedelta(seconds=refresh_expires_in)).isoformat()

        account_name = token_data.get("seller_name") or token_data.get("open_id", f"Creator_{user_id[:6]}")
        account_type = token_data.get("user_type", "CREATOR")

        conn_record = {
            "connection_id": f"conn-tts-{secrets.token_hex(6)}",
            "user_id": user_id,
            "account_name": account_name,
            "account_type": account_type,
            "market": "VN",
            "status": TikTokShopConnectionStatus.CONNECTED.value,
            "scopes": [
                "affiliate_creator.open_collaboration.read",
                "affiliate_creator.product.read",
            ],
            "access_token": access_token,
            "refresh_token": refresh_token,
            "access_token_expires_at": access_expires_at,
            "refresh_token_expires_at": refresh_expires_at,
            "authorized_at": _now_iso(),
            "seller_id": token_data.get("seller_id"),
            "shop_name": token_data.get("seller_name"),
            "open_collaboration_supported": True,
        }

        _CONNECTIONS_DB[user_id] = conn_record
        _save_connections_db()
        logger.info("Successfully connected TikTok Shop for user: %s (account: %s)", user_id, account_name)

        return self._to_public(conn_record)

    def set_authorized_connection_record(self, user_id: str, record: dict[str, Any]) -> TikTokShopConnectionPublic:
        """
        Saves or updates an authorized connection record (e.g. for testing or direct credential configuration).
        """
        _CONNECTIONS_DB[user_id] = record
        _save_connections_db()
        return self._to_public(record)

    def disconnect(self, user_id: str) -> None:
        """
        Disconnects the TikTok Shop integration and revokes stored tokens.
        """
        rec = _CONNECTIONS_DB.get(user_id)
        if rec:
            rec["status"] = TikTokShopConnectionStatus.DISCONNECTED.value
            rec["access_token"] = None
            rec["refresh_token"] = None
            _save_connections_db()
            logger.info("User %s disconnected TikTok Shop account.", user_id)

    async def get_valid_access_token(self, user_id: str) -> str | None:
        """
        Returns a valid access token, auto-refreshing if near expiration.
        """
        rec = _CONNECTIONS_DB.get(user_id)
        if not rec or rec.get("status") != TikTokShopConnectionStatus.CONNECTED.value:
            return None

        access_token = rec.get("access_token")
        if not access_token:
            return None

        expires_at_str = rec.get("access_token_expires_at")
        if expires_at_str:
            try:
                exp = datetime.fromisoformat(expires_at_str)
                # If expiring in less than 5 minutes, refresh
                if datetime.now(UTC) + timedelta(minutes=5) >= exp:
                    ref_token = rec.get("refresh_token")
                    if ref_token and tiktok_shop_client.is_configured:
                        data = await tiktok_shop_client.refresh_access_token(ref_token)
                        rec["access_token"] = data.get("access_token", access_token)
                        rec["refresh_token"] = data.get("refresh_token", ref_token)
                        exp_in = int(data.get("access_token_expire_in", 86400))
                        rec["access_token_expires_at"] = (datetime.now(UTC) + timedelta(seconds=exp_in)).isoformat()
                        _save_connections_db()
                        return rec["access_token"]
            except Exception as e:
                logger.warning("Token auto-refresh failed for user %s: %s", user_id, e)

        return access_token

    def _to_public(self, rec: dict[str, Any]) -> TikTokShopConnectionPublic:
        return TikTokShopConnectionPublic(
            connection_id=rec.get("connection_id", "conn-default"),
            user_id=rec.get("user_id", "usr-system-default"),
            account_name=rec.get("account_name", "TikTok Shop Account"),
            account_type=TikTokShopAccountType(rec.get("account_type", "CREATOR")),
            market=rec.get("market", "VN"),
            status=TikTokShopConnectionStatus(rec.get("status", "CONNECTED")),
            scopes=rec.get("scopes", []),
            authorized_at=rec.get("authorized_at"),
            expires_at=rec.get("access_token_expires_at"),
            seller_id=rec.get("seller_id"),
            shop_name=rec.get("shop_name"),
            open_collaboration_supported=rec.get("open_collaboration_supported", True),
            setup_guide=self.SETUP_GUIDE_TEXT if rec.get("status") != TikTokShopConnectionStatus.CONNECTED.value else None,
        )


connection_service = TikTokShopConnectionService()
