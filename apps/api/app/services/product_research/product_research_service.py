import json
import logging
import secrets
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.integrations.tiktok_shop.client import tiktok_shop_client
from app.integrations.tiktok_shop.taxonomy import (
    FASHION_TAXONOMY,
    map_source_category,
)
from app.schemas.product_research import (
    FashionCategory,
    MarketplaceProductItem,
    OpportunityScoreBreakdown,
    OpportunityScoreResult,
    ProductCollaborationStatus,
    ProductCommissionInfo,
    ProductContentPerformance,
    ProductPriceInfo,
    ProductResearchSearchRequest,
    ProductResearchSearchResponse,
    ProductSalesMetrics,
    ProductVariantItem,
    ScoreStatus,
    SearchHistoryItem,
    StudioHandoffRequest,
    StudioHandoffResponse,
    TikTokShopConnectionStatus,
)
from app.services.personalization import _GENERATIONS_DB, _PROJECTS_DB
from .connection_service import connection_service

logger = logging.getLogger(__name__)

_SEARCH_HISTORY_DB_PATH = Path("data/db/search_history.json")
_SEARCH_HISTORY_DB: dict[str, list[dict[str, Any]]] = {}  # user_id -> list of history items
_PRODUCT_CACHE: dict[str, dict[str, Any]] = {}  # product_id -> dict


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _load_history_db() -> None:
    global _SEARCH_HISTORY_DB
    if _SEARCH_HISTORY_DB_PATH.is_file():
        try:
            with open(_SEARCH_HISTORY_DB_PATH, encoding="utf-8") as f:
                _SEARCH_HISTORY_DB = json.load(f)
        except Exception as e:
            logger.warning("Could not load search_history.json: %s", e)
            _SEARCH_HISTORY_DB = {}


def _save_history_db() -> None:
    try:
        _SEARCH_HISTORY_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(_SEARCH_HISTORY_DB_PATH, "w", encoding="utf-8") as f:
            json.dump(_SEARCH_HISTORY_DB, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error("Failed to save search_history.json: %s", e)


_load_history_db()


class ProductResearchService:
    """
    Core business service for Fashion TikTok Shop Product Research & Discovery.
    Handles product search, normalization, explainable opportunity scoring,
    comparison, search history, and context-preserving handoff to Studio.
    """

    def get_categories(self) -> list[FashionCategory]:
        return FASHION_TAXONOMY

    def calculate_opportunity_score(
        self,
        commission_rate: float | None,
        sale_price: float,
        units_sold_30d: int | None,
        collaboration_status: ProductCollaborationStatus,
    ) -> OpportunityScoreResult:
        """
        Calculates an explainable quantitative Opportunity Score (0-100).
        If essential commercial indicators are unavailable from the source,
        returns INSUFFICIENT_DATA instead of inventing arbitrary scores.
        """
        missing_fields = []
        if commission_rate is None:
            missing_fields.append("commission_rate")
        if units_sold_30d is None:
            missing_fields.append("units_sold_30d")

        # If both commission and sales are completely missing, mark INSUFFICIENT_DATA
        if commission_rate is None and units_sold_30d is None:
            return OpportunityScoreResult(
                score=None,
                status=ScoreStatus.INSUFFICIENT_DATA,
                grade="N/A",
                missing_fields=missing_fields,
                explanation="Chưa đủ dữ liệu thương mại (thiếu hoa hồng và doanh số) để tính điểm cơ hội sản phẩm.",
            )

        # 1. Commission Score (max 35 pts)
        c_rate = commission_rate or 0.0
        # Benchmark: 20%+ is top tier (35 pts), 10% is 17.5 pts
        comm_pts = round(35.0 * min(1.0, c_rate / 20.0), 1)

        # 2. Sales Score (max 30 pts)
        if units_sold_30d is not None:
            # Benchmark: 500+ units in 30 days is top tier (30 pts)
            sales_pts = round(30.0 * min(1.0, units_sold_30d / 500.0), 1)
        else:
            sales_pts = 0.0

        # 3. Price Accessibility Score (max 20 pts)
        # Optimal TikTok Shop fashion sweet spot in VN is 150k - 450k VND
        if 150000 <= sale_price <= 450000:
            price_pts = 20.0
        elif sale_price < 150000:
            price_pts = 16.0
        elif 450000 < sale_price <= 800000:
            price_pts = 14.0
        else:
            price_pts = 10.0

        # 4. Collaboration Availability (max 15 pts)
        if collaboration_status == ProductCollaborationStatus.OPEN_COLLABORATION:
            collab_pts = 15.0
        elif collaboration_status == ProductCollaborationStatus.TARGETED_COLLABORATION:
            collab_pts = 10.0
        else:
            collab_pts = 5.0

        total_score = round(comm_pts + sales_pts + price_pts + collab_pts, 1)

        if total_score >= 80.0:
            grade = "A"
        elif total_score >= 65.0:
            grade = "B"
        elif total_score >= 50.0:
            grade = "C"
        else:
            grade = "D"

        breakdown = OpportunityScoreBreakdown(
            commission_score=comm_pts,
            sales_score=sales_pts,
            price_accessibility_score=price_pts,
            collaboration_score=collab_pts,
        )

        explanation = (
            f"Điểm {total_score}/100 (Hạng {grade}): "
            f"Hoa hồng ({comm_pts}/35đ) + Doanh số ({sales_pts}/30đ) + "
            f"Mức giá ({price_pts}/20đ) + Trạng thái hợp tác ({collab_pts}/15đ)."
        )

        return OpportunityScoreResult(
            score=total_score,
            status=ScoreStatus.CALCULATED,
            grade=grade,
            breakdown=breakdown,
            missing_fields=missing_fields,
            explanation=explanation,
        )

    def normalize_product_record(self, raw: dict[str, Any]) -> MarketplaceProductItem:
        """
        Normalizes a raw TikTok Shop product record into the standard MarketplaceProductItem.
        """
        product_id = raw.get("product_id") or raw.get("id") or f"tts-{secrets.token_hex(6)}"
        title = raw.get("title") or raw.get("name") or "Sản phẩm thời trang"
        sale_price = float(raw.get("sale_price") or raw.get("price") or 0.0)
        orig_price = float(raw.get("original_price")) if raw.get("original_price") else None
        currency = raw.get("currency", "VND")

        discount_pct = None
        if orig_price and orig_price > sale_price:
            discount_pct = round(((orig_price - sale_price) / orig_price) * 100, 1)

        display_price = f"{int(sale_price):,} {currency}".replace(",", ".")

        pricing = ProductPriceInfo(
            original_price=orig_price,
            sale_price=sale_price,
            currency=currency,
            discount_percentage=discount_pct,
            display_price=display_price,
        )

        # Commission
        comm_rate = float(raw["commission_rate"]) if raw.get("commission_rate") is not None else None
        est_amount = None
        if comm_rate is not None and sale_price > 0:
            est_amount = round(sale_price * (comm_rate / 100.0), 0)

        commission = ProductCommissionInfo(
            rate_percent=comm_rate,
            estimated_amount=est_amount,
            currency=currency,
            is_estimated=True,
            commission_type="PERCENTAGE",
            has_commission_data=comm_rate is not None,
        )

        # Sales
        units_sold = int(raw["units_sold_30d"]) if raw.get("units_sold_30d") is not None else None
        gmv = float(raw["gmv_30d"]) if raw.get("gmv_30d") is not None else None
        sales = ProductSalesMetrics(
            units_sold_30d=units_sold,
            gmv_30d=gmv,
            order_count_30d=raw.get("order_count_30d"),
            growth_rate_percent=raw.get("growth_rate_percent"),
            is_available=units_sold is not None or gmv is not None,
            source_period=raw.get("source_period", "30 ngày gần nhất" if units_sold is not None else None),
            updated_at=raw.get("sales_updated_at"),
        )

        # Content performance
        content = ProductContentPerformance(
            video_count=raw.get("video_count"),
            impressions=raw.get("impressions"),
            ctr_percent=raw.get("ctr_percent"),
            orders_attributed=raw.get("orders_attributed"),
            is_available=bool(raw.get("video_count") or raw.get("orders_attributed")),
            notes=raw.get("content_notes", "Chưa có quyền truy cập dữ liệu hiệu suất nội dung video"),
        )

        # Collaboration
        raw_collab = raw.get("collaboration_status", "OPEN_COLLABORATION")
        try:
            collab_status = ProductCollaborationStatus(raw_collab)
        except Exception:
            collab_status = ProductCollaborationStatus.UNKNOWN

        # Category mapping
        src_cat_id = raw.get("source_category_id")
        src_cat_name = raw.get("source_category_name")
        internal_cat, internal_sub = map_source_category(src_cat_id, src_cat_name, title)

        # Images
        primary_img = raw.get("primary_image_url") or (raw.get("images", [""])[0] if raw.get("images") else "")
        gallery = raw.get("image_gallery") or raw.get("images", [primary_img])

        # Opportunity score
        opp_score = self.calculate_opportunity_score(
            commission_rate=comm_rate,
            sale_price=sale_price,
            units_sold_30d=units_sold,
            collaboration_status=collab_status,
        )

        # Variants
        variants = []
        for v in raw.get("variants", []):
            variants.append(
                ProductVariantItem(
                    variant_id=v.get("variant_id", str(secrets.token_hex(4))),
                    title=v.get("title", "Biến thể"),
                    price=float(v.get("price", sale_price)),
                    stock_quantity=v.get("stock_quantity"),
                    image_url=v.get("image_url"),
                )
            )

        item = MarketplaceProductItem(
            product_id=product_id,
            source="TIKTOK_SHOP",
            source_product_id=raw.get("source_product_id") or product_id,
            source_shop_id=raw.get("source_shop_id"),
            shop_name=raw.get("shop_name", "TikTok Shop"),
            title=title,
            description=raw.get("description"),
            primary_image_url=primary_img,
            image_gallery=gallery,
            product_url=raw.get("product_url", f"https://shop.tiktok.com/view/product/{product_id}"),
            region=raw.get("region", "VN"),
            source_category_id=src_cat_id,
            source_category_name=src_cat_name,
            internal_category=internal_cat,
            internal_subcategory=internal_sub,
            pricing=pricing,
            commission=commission,
            sales=sales,
            content_performance=content,
            collaboration_status=collab_status,
            opportunity_score=opp_score,
            variants=variants,
            updated_at=raw.get("updated_at", _now_iso()),
            is_cached=raw.get("is_cached", False),
        )

        _PRODUCT_CACHE[product_id] = item.model_dump()
        return item

    async def search_products(
        self,
        user_id: str,
        request: ProductResearchSearchRequest,
    ) -> ProductResearchSearchResponse:
        """
        Executes an authorized product search across TikTok Shop Open Platform.
        Respects account authorization, scopes, sorting, filtering, and pagination.
        """
        conn = connection_service.get_connection(user_id)

        # 1. Check if TikTok Shop account is connected
        if conn.status not in (TikTokShopConnectionStatus.CONNECTED, TikTokShopConnectionStatus.WAITING_FOR_APPROVAL):
            # Save query in history even if not connected
            self.save_search_history(user_id, request.query, request.category_id, request.model_dump(), 0)
            return ProductResearchSearchResponse(
                total=0,
                page=request.page,
                page_size=request.page_size,
                total_pages=0,
                items=[],
                active_connection=conn,
                is_live_data=False,
                notice=(
                    "Tài khoản TikTok Shop chưa được kết nối hoặc chưa hoàn tất ủy quyền. "
                    "Vui lòng vào phần Cài đặt để kết nối tài khoản TikTok Shop chính thức trước khi tìm kiếm sản phẩm."
                ),
            )

        access_token = await connection_service.get_valid_access_token(user_id)
        raw_items: list[dict[str, Any]] = []

        if access_token and tiktok_shop_client.is_configured:
            try:
                # Live API query
                data = await tiktok_shop_client.search_open_collaboration_products(
                    access_token=access_token,
                    keyword=request.query,
                    category_id=request.category_id,
                    page_size=request.page_size,
                    price_min=request.price_min,
                    price_max=request.price_max,
                    commission_min=request.commission_min,
                    commission_max=request.commission_max,
                )
                products = data.get("products", [])
                for p in products:
                    raw_items.append(p)
            except Exception as e:
                logger.error("Error querying live TikTok Shop API: %s", e)
                # If rate limited or error, fallback to cached products
                raw_items = list(_PRODUCT_CACHE.values())
        else:
            # If authorized in DB (e.g. sandbox/pre-loaded records for testing)
            raw_items = list(_PRODUCT_CACHE.values())

        # Normalize items
        normalized_items: list[MarketplaceProductItem] = []
        for raw in raw_items:
            # If already normalized dict
            if "opportunity_score" in raw and isinstance(raw["opportunity_score"], dict):
                try:
                    normalized_items.append(MarketplaceProductItem(**raw))
                except Exception:
                    normalized_items.append(self.normalize_product_record(raw))
            else:
                normalized_items.append(self.normalize_product_record(raw))

        # Filter locally
        filtered = []
        for item in normalized_items:
            # Query match
            if request.query and request.query.strip():
                q = request.query.strip().lower()
                if q not in item.title.lower() and q not in (item.description or "").lower():
                    continue

            # Category filter
            if request.category_id and item.internal_category != request.category_id:
                continue
            if request.subcategory_id and item.internal_subcategory != request.subcategory_id:
                continue

            # Price filter
            if request.price_min is not None and item.pricing.sale_price < request.price_min:
                continue
            if request.price_max is not None and item.pricing.sale_price > request.price_max:
                continue

            # Commission filter
            if request.commission_min is not None:
                if item.commission.rate_percent is None or item.commission.rate_percent < request.commission_min:
                    continue
            if request.commission_max is not None:
                if item.commission.rate_percent is None or item.commission.rate_percent > request.commission_max:
                    continue

            # Collaboration status filter
            if request.collaboration_status and item.collaboration_status != request.collaboration_status:
                continue

            filtered.append(item)

        # Sort
        def sort_key(prod: MarketplaceProductItem) -> Any:
            if request.sort_by == "price":
                return prod.pricing.sale_price
            elif request.sort_by == "commission":
                return prod.commission.rate_percent or -1.0
            elif request.sort_by == "sales":
                return prod.sales.units_sold_30d or -1
            elif request.sort_by == "title":
                return prod.title
            else:  # opportunity_score
                return prod.opportunity_score.score or -1.0

        reverse = request.sort_dir.lower() == "desc"
        filtered.sort(key=sort_key, reverse=reverse)

        # Paginate
        total = len(filtered)
        page_size = max(1, request.page_size)
        total_pages = max(1, (total + page_size - 1) // page_size)
        start = (request.page - 1) * page_size
        paged_items = filtered[start : start + page_size]

        # Save to search history
        self.save_search_history(
            user_id=user_id,
            query=request.query,
            category_id=request.category_id,
            filters=request.model_dump(),
            result_count=total,
        )

        return ProductResearchSearchResponse(
            total=total,
            page=request.page,
            page_size=page_size,
            total_pages=total_pages,
            items=paged_items,
            active_connection=conn,
            query_context=request.model_dump(),
            is_live_data=bool(access_token and tiktok_shop_client.is_configured),
        )

    def get_product_detail(self, product_id: str) -> MarketplaceProductItem | None:
        """
        Retrieves detailed information for a single product.
        """
        cached = _PRODUCT_CACHE.get(product_id)
        if not cached:
            return None
        if "opportunity_score" in cached and isinstance(cached["opportunity_score"], dict):
            return MarketplaceProductItem(**cached)
        return self.normalize_product_record(cached)

    def compare_products(self, product_ids: list[str]) -> list[MarketplaceProductItem]:
        """
        Retrieves up to 4 products aligned for side-by-side comparison.
        """
        results = []
        for pid in product_ids[:4]:
            prod = self.get_product_detail(pid)
            if prod:
                results.append(prod)
        return results

    def save_search_history(
        self,
        user_id: str,
        query: str | None,
        category_id: str | None,
        filters: dict[str, Any],
        result_count: int,
    ) -> None:
        """
        Saves a search query to user search history.
        """
        if not query and not category_id:
            return

        items = _SEARCH_HISTORY_DB.setdefault(user_id, [])
        history_id = f"hist-{secrets.token_hex(6)}"

        record = {
            "history_id": history_id,
            "user_id": user_id,
            "query": query,
            "category_id": category_id,
            "filters": filters,
            "result_count": result_count,
            "created_at": _now_iso(),
        }

        # Keep latest 20 items
        items.insert(0, record)
        _SEARCH_HISTORY_DB[user_id] = items[:20]
        _save_history_db()

    def get_search_history(self, user_id: str) -> list[SearchHistoryItem]:
        items = _SEARCH_HISTORY_DB.get(user_id, [])
        return [SearchHistoryItem(**it) for it in items]

    def delete_search_history_item(self, user_id: str, history_id: str) -> bool:
        items = _SEARCH_HISTORY_DB.get(user_id, [])
        new_items = [it for it in items if it.get("history_id") != history_id]
        if len(new_items) != len(items):
            _SEARCH_HISTORY_DB[user_id] = new_items
            _save_history_db()
            return True
        return False

    def handoff_to_studio(
        self,
        user_id: str,
        request: StudioHandoffRequest,
    ) -> StudioHandoffResponse:
        """
        Executes a context-preserving handoff from Product Research to Studio.
        Enforces AGENTS.md sequence: Does NOT allow bypassing Base Video!
        """
        prod = self.get_product_detail(request.product_id)
        if not prod:
            raise KeyError(f"Không tìm thấy sản phẩm '{request.product_id}' để đưa vào Studio.")

        has_verified_base_video = False
        target_route = "/studio"

        if request.project_id:
            # Check if specified project has a COMPLETED generation with a verified Base Video
            project = _PROJECTS_DB.get(request.project_id)
            if project:
                for gen in _GENERATIONS_DB.values():
                    if gen.get("project_id") == request.project_id and gen.get("status") == "COMPLETED":
                        has_verified_base_video = True
                        break

            if has_verified_base_video:
                # Direct handoff to Step 6 (Product Link & Extraction) in the Studio workspace
                target_route = f"/studio/{request.project_id}/replacement"
            else:
                # Project exists but needs Base Video personalization first
                target_route = f"/studio/{request.project_id}"

        handoff_id = f"hdf-{secrets.token_hex(6)}"
        prefill_data = {
            "handoff_id": handoff_id,
            "product_id": prod.product_id,
            "source_product_id": prod.source_product_id,
            "title": prod.title,
            "product_url": prod.product_url,
            "primary_image_url": prod.primary_image_url,
            "image_gallery": prod.image_gallery,
            "category": prod.internal_category,
            "price": prod.pricing.sale_price,
            "currency": prod.pricing.currency,
            "shop_name": prod.shop_name,
            "commission_rate": prod.commission.rate_percent,
        }

        return StudioHandoffResponse(
            handoff_id=handoff_id,
            product_id=prod.product_id,
            product_title=prod.title,
            product_url=prod.product_url,
            primary_image_url=prod.primary_image_url,
            category=prod.internal_category,
            price=prod.pricing.sale_price,
            currency=prod.pricing.currency,
            shop_name=prod.shop_name,
            project_id=request.project_id,
            has_verified_base_video=has_verified_base_video,
            target_route=target_route,
            prefill_data=prefill_data,
        )

    def preload_verified_marketplace_fixtures(self, products: list[dict[str, Any]]) -> None:
        """
        Loads verified commercial products for automated testing and sandbox environments.
        """
        for p in products:
            self.normalize_product_record(p)


product_research_service = ProductResearchService()
