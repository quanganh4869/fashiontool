import logging
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.product_research import (
    FashionCategory,
    MarketplaceProductItem,
    ProductCollaborationStatus,
    ProductComparisonRequest,
    ProductComparisonResponse,
    ProductResearchSearchRequest,
    ProductResearchSearchResponse,
    SearchHistoryItem,
    StudioHandoffRequest,
    StudioHandoffResponse,
)
from app.services.product_research import product_research_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/research", tags=["Product Research"])


@router.get("/categories", response_model=list[FashionCategory])
async def get_fashion_categories():
    """
    Trả về cây danh mục thời trang chuẩn hóa của TrendMotion Studio.
    """
    return product_research_service.get_categories()


@router.get("/products", response_model=ProductResearchSearchResponse)
async def search_products(
    query: str | None = Query(None, description="Từ khóa tìm kiếm (tiếng Việt hoặc tiếng Anh)"),
    category_id: str | None = Query(None, description="Mã danh mục thời trang"),
    subcategory_id: str | None = Query(None, description="Mã danh mục con"),
    price_min: float | None = Query(None, description="Giá bán tối thiểu (VND)"),
    price_max: float | None = Query(None, description="Giá bán tối đa (VND)"),
    commission_min: float | None = Query(None, description="Tỷ lệ hoa hồng tối thiểu (%)"),
    commission_max: float | None = Query(None, description="Tỷ lệ hoa hồng tối đa (%)"),
    collaboration_status: ProductCollaborationStatus | None = Query(None, description="Tình trạng hợp tác"),
    sort_by: str = Query("opportunity_score", description="Sắp xếp theo: opportunity_score, price, commission, sales, title"),
    sort_dir: str = Query("desc", description="Thứ tự sắp xếp: asc, desc"),
    page: int = Query(1, ge=1, description="Số trang"),
    page_size: int = Query(12, ge=1, le=50, description="Số sản phẩm mỗi trang"),
    user_id: str = Query("usr-system-default", description="ID người dùng"),
):
    """
    Tìm kiếm và sàng lọc sản phẩm thời trang tiếp thị liên kết trên TikTok Shop.
    Yêu cầu tài khoản TikTok Shop đã được kết nối và ủy quyền.
    """
    search_req = ProductResearchSearchRequest(
        query=query,
        category_id=category_id,
        subcategory_id=subcategory_id,
        price_min=price_min,
        price_max=price_max,
        commission_min=commission_min,
        commission_max=commission_max,
        collaboration_status=collaboration_status,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size,
    )
    return await product_research_service.search_products(user_id=user_id, request=search_req)


@router.get("/products/{product_id}", response_model=MarketplaceProductItem)
async def get_product_detail(product_id: str):
    """
    Lấy thông tin chi tiết nghiên cứu thương mại của một sản phẩm thời trang.
    """
    prod = product_research_service.get_product_detail(product_id)
    if not prod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy sản phẩm '{product_id}'.",
        )
    return prod


@router.post("/compare", response_model=ProductComparisonResponse)
async def compare_products(request: ProductComparisonRequest):
    """
    Đối chiếu so sánh thông số thương mại của tối đa 4 sản phẩm thời trang cùng lúc.
    """
    if len(request.product_ids) > 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ có thể so sánh tối đa 4 sản phẩm cùng lúc.",
        )
    prods = product_research_service.compare_products(request.product_ids)
    from datetime import UTC, datetime
    return ProductComparisonResponse(
        products=prods,
        compared_at=datetime.now(UTC).isoformat(),
    )


@router.get("/history", response_model=list[SearchHistoryItem])
async def get_search_history(
    user_id: str = Query("usr-system-default", description="ID người dùng"),
):
    """
    Lấy danh sách các truy vấn tìm kiếm gần nhất của người dùng.
    """
    return product_research_service.get_search_history(user_id)


@router.delete("/history/{history_id}", status_code=status.HTTP_200_OK)
async def delete_search_history_item(
    history_id: str,
    user_id: str = Query("usr-system-default", description="ID người dùng"),
):
    """
    Xóa một bản ghi lịch sử tìm kiếm.
    """
    deleted = product_research_service.delete_search_history_item(user_id, history_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bản ghi lịch sử này.",
        )
    return {"message": "Đã xóa bản ghi lịch sử tìm kiếm."}


@router.post("/handoff-studio", response_model=StudioHandoffResponse)
async def handoff_to_studio(
    request: StudioHandoffRequest,
    user_id: str = Query("usr-system-default", description="ID người dùng"),
):
    """
    Chuyển giao ngữ cảnh sản phẩm từ Product Research sang Studio để đưa vào sản xuất video.
    Bảo toàn đường dẫn sản phẩm và kiểm tra điều kiện tiên quyết của Personalized Base Video.
    """
    try:
        return product_research_service.handoff_to_studio(user_id=user_id, request=request)
    except KeyError as ke:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ke),
        )
    except Exception as e:
        logger.error("Studio handoff failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
