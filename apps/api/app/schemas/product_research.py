from enum import Enum
from typing import Any
from pydantic import BaseModel, Field


class TikTokShopAccountType(str, Enum):
    CREATOR = "CREATOR"
    SELLER = "SELLER"
    PARTNER = "PARTNER"


class TikTokShopConnectionStatus(str, Enum):
    NOT_CONFIGURED = "NOT_CONFIGURED"
    DISCONNECTED = "DISCONNECTED"
    PENDING_AUTHORIZATION = "PENDING_AUTHORIZATION"
    CONNECTED = "CONNECTED"
    WAITING_FOR_APPROVAL = "WAITING_FOR_APPROVAL"
    REAUTH_REQUIRED = "REAUTH_REQUIRED"


class ProductCollaborationStatus(str, Enum):
    OPEN_COLLABORATION = "OPEN_COLLABORATION"
    TARGETED_COLLABORATION = "TARGETED_COLLABORATION"
    NO_COLLABORATION = "NO_COLLABORATION"
    UNKNOWN = "UNKNOWN"


class ScoreStatus(str, Enum):
    CALCULATED = "CALCULATED"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class TikTokShopConnectionPublic(BaseModel):
    """Safe public connection representation - NEVER exposes tokens!"""
    connection_id: str
    user_id: str
    account_name: str
    account_type: TikTokShopAccountType
    market: str = "VN"
    status: TikTokShopConnectionStatus
    scopes: list[str] = Field(default_factory=list)
    authorized_at: str | None = None
    expires_at: str | None = None
    seller_id: str | None = None
    shop_name: str | None = None
    open_collaboration_supported: bool = True
    setup_guide: str | None = None


class TikTokShopAuthUrlResponse(BaseModel):
    auth_url: str
    state: str
    expires_in_seconds: int = 600


class TikTokShopCallbackRequest(BaseModel):
    code: str
    state: str


class FashionSubcategory(BaseModel):
    id: str
    name: str
    source_category_ids: list[str] = Field(default_factory=list)


class FashionCategory(BaseModel):
    id: str
    name: str
    subcategories: list[FashionSubcategory] = Field(default_factory=list)


class ProductPriceInfo(BaseModel):
    original_price: float | None = None
    sale_price: float
    currency: str = "VND"
    discount_percentage: float | None = None
    display_price: str


class ProductCommissionInfo(BaseModel):
    rate_percent: float | None = None  # e.g. 15.0 for 15%
    estimated_amount: float | None = None
    currency: str = "VND"
    is_estimated: bool = True
    commission_type: str = "PERCENTAGE"  # PERCENTAGE or FLAT_RATE
    calculation_basis: str | None = "Ước tính = Giá bán x Tỷ lệ hoa hồng (chưa trừ thuế và phí nền tảng)"
    has_commission_data: bool = True


class ProductSalesMetrics(BaseModel):
    units_sold_30d: int | None = None
    gmv_30d: float | None = None
    order_count_30d: int | None = None
    growth_rate_percent: float | None = None
    is_available: bool = False
    source_period: str | None = None
    updated_at: str | None = None


class ProductContentPerformance(BaseModel):
    video_count: int | None = None
    impressions: int | None = None
    ctr_percent: float | None = None
    orders_attributed: int | None = None
    is_available: bool = False
    notes: str | None = "Chưa có quyền truy cập dữ liệu hiệu suất nội dung video"


class OpportunityScoreBreakdown(BaseModel):
    commission_score: float = 0.0  # max 35
    sales_score: float = 0.0  # max 30
    price_accessibility_score: float = 0.0  # max 20
    collaboration_score: float = 0.0  # max 15


class OpportunityScoreResult(BaseModel):
    score: float | None = None  # 0 to 100
    status: ScoreStatus
    grade: str = "N/A"  # A, B, C, D, N/A
    breakdown: OpportunityScoreBreakdown | None = None
    missing_fields: list[str] = Field(default_factory=list)
    explanation: str


class ProductVariantItem(BaseModel):
    variant_id: str
    title: str
    price: float
    stock_quantity: int | None = None
    image_url: str | None = None


class MarketplaceProductItem(BaseModel):
    product_id: str
    source: str = "TIKTOK_SHOP"
    source_product_id: str
    source_shop_id: str | None = None
    shop_name: str | None = None
    title: str
    description: str | None = None
    primary_image_url: str
    image_gallery: list[str] = Field(default_factory=list)
    product_url: str
    region: str = "VN"
    source_category_id: str | None = None
    source_category_name: str | None = None
    internal_category: str  # WOMEN_FASHION, MEN_FASHION, ACCESSORIES, SHOES, INTERNAL_CATEGORY_UNMAPPED
    internal_subcategory: str | None = None
    pricing: ProductPriceInfo
    commission: ProductCommissionInfo
    sales: ProductSalesMetrics
    content_performance: ProductContentPerformance = Field(default_factory=ProductContentPerformance)
    collaboration_status: ProductCollaborationStatus
    opportunity_score: OpportunityScoreResult
    variants: list[ProductVariantItem] = Field(default_factory=list)
    updated_at: str
    is_cached: bool = False


class ProductResearchSearchRequest(BaseModel):
    query: str | None = None
    category_id: str | None = None
    subcategory_id: str | None = None
    price_min: float | None = None
    price_max: float | None = None
    commission_min: float | None = None
    commission_max: float | None = None
    collaboration_status: ProductCollaborationStatus | None = None
    sort_by: str = "opportunity_score"  # opportunity_score, price, commission, sales, title
    sort_dir: str = "desc"  # asc, desc
    page: int = 1
    page_size: int = 12


class ProductResearchSearchResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: list[MarketplaceProductItem]
    active_connection: TikTokShopConnectionPublic | None = None
    query_context: dict[str, Any] = Field(default_factory=dict)
    is_live_data: bool = True
    notice: str | None = None


class ProductComparisonRequest(BaseModel):
    product_ids: list[str]


class ProductComparisonResponse(BaseModel):
    products: list[MarketplaceProductItem]
    compared_at: str


class SearchHistoryItem(BaseModel):
    history_id: str
    user_id: str
    query: str | None = None
    category_id: str | None = None
    filters: dict[str, Any] = Field(default_factory=dict)
    result_count: int = 0
    created_at: str


class StudioHandoffRequest(BaseModel):
    product_id: str
    project_id: str | None = None


class StudioHandoffResponse(BaseModel):
    handoff_id: str
    product_id: str
    product_title: str
    product_url: str
    primary_image_url: str
    category: str
    price: float
    currency: str
    shop_name: str | None = None
    project_id: str | None = None
    has_verified_base_video: bool = False
    target_route: str
    prefill_data: dict[str, Any]
