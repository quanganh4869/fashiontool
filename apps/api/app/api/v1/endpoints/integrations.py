import logging
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.product_research import (
    TikTokShopAuthUrlResponse,
    TikTokShopCallbackRequest,
    TikTokShopConnectionPublic,
)
from app.services.product_research import connection_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/integrations/tiktok-shop", tags=["TikTok Shop Integration"])


@router.get("/status", response_model=TikTokShopConnectionPublic)
async def get_tiktok_shop_status(
    user_id: str = Query("usr-system-default", description="ID người dùng"),
):
    """
    Lấy thông tin trạng thái kết nối TikTok Shop hiện tại của người dùng.
    Không bao giờ để lộ token ra Frontend.
    """
    return connection_service.get_connection(user_id)


@router.get("/auth-url", response_model=TikTokShopAuthUrlResponse)
async def get_tiktok_shop_auth_url(
    redirect_uri: str = Query(..., description="Redirect URI nhận mã ủy quyền sau OAuth"),
    user_id: str = Query("usr-system-default", description="ID người dùng"),
):
    """
    Tạo URL ủy quyền OAuth2 chính thức trên TikTok Shop Open Platform kèm mã state chống CSRF.
    """
    try:
        return connection_service.generate_auth_url(user_id=user_id, redirect_uri=redirect_uri)
    except Exception as e:
        logger.error("Failed to generate TikTok Shop auth URL: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/callback", response_model=TikTokShopConnectionPublic)
async def handle_tiktok_shop_callback(
    request: TikTokShopCallbackRequest,
    user_id: str = Query("usr-system-default", description="ID người dùng"),
):
    """
    Nhận authorization code từ redirect URI sau khi người dùng đồng ý cấp quyền trên TikTok Shop.
    Xác thực state chống CSRF và đổi lấy access token/refresh token (lưu an toàn tại Backend).
    """
    try:
        return await connection_service.handle_callback(
            user_id=user_id,
            code=request.code,
            state=request.state,
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        logger.error("Error exchanging TikTok Shop code: %s", e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Lỗi kết nối với TikTok Shop Open Platform: {e}",
        )


@router.post("/disconnect", status_code=status.HTTP_200_OK)
async def disconnect_tiktok_shop(
    user_id: str = Query("usr-system-default", description="ID người dùng"),
):
    """
    Ngắt kết nối tài khoản TikTok Shop và hủy bỏ toàn bộ token lưu trữ.
    """
    connection_service.disconnect(user_id)
    return {"message": "Đã ngắt kết nối tài khoản TikTok Shop thành công."}
