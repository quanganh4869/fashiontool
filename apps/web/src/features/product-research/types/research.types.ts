export type TikTokShopAccountType = 'CREATOR' | 'SELLER' | 'PARTNER';

export type TikTokShopConnectionStatus =
  | 'NOT_CONFIGURED'
  | 'DISCONNECTED'
  | 'PENDING_AUTHORIZATION'
  | 'CONNECTED'
  | 'WAITING_FOR_APPROVAL'
  | 'REAUTH_REQUIRED';

export type ProductCollaborationStatus =
  | 'OPEN_COLLABORATION'
  | 'TARGETED_COLLABORATION'
  | 'NO_COLLABORATION'
  | 'UNKNOWN';

export type ScoreStatus = 'CALCULATED' | 'INSUFFICIENT_DATA';

export interface TikTokShopConnectionPublic {
  connection_id: string;
  user_id: string;
  account_name: string;
  account_type: TikTokShopAccountType;
  market: string;
  status: TikTokShopConnectionStatus;
  scopes: string[];
  authorized_at?: string | null;
  expires_at?: string | null;
  seller_id?: string | null;
  shop_name?: string | null;
  open_collaboration_supported: boolean;
  setup_guide?: string | null;
}

export interface FashionSubcategory {
  id: string;
  name: string;
  source_category_ids: string[];
}

export interface FashionCategory {
  id: string;
  name: string;
  subcategories: FashionSubcategory[];
}

export interface ProductPriceInfo {
  original_price?: number | null;
  sale_price: number;
  currency: string;
  discount_percentage?: number | null;
  display_price: string;
}

export interface ProductCommissionInfo {
  rate_percent?: number | null;
  estimated_amount?: number | null;
  currency: string;
  is_estimated: boolean;
  commission_type: string;
  calculation_basis?: string | null;
  has_commission_data: boolean;
}

export interface ProductSalesMetrics {
  units_sold_30d?: number | null;
  gmv_30d?: number | null;
  order_count_30d?: number | null;
  growth_rate_percent?: number | null;
  is_available: boolean;
  source_period?: string | null;
  updated_at?: string | null;
}

export interface ProductContentPerformance {
  video_count?: number | null;
  impressions?: number | null;
  ctr_percent?: number | null;
  orders_attributed?: number | null;
  is_available: boolean;
  notes?: string | null;
}

export interface OpportunityScoreBreakdown {
  commission_score: number;
  sales_score: number;
  price_accessibility_score: number;
  collaboration_score: number;
}

export interface OpportunityScoreResult {
  score?: number | null;
  status: ScoreStatus;
  grade: string;
  breakdown?: OpportunityScoreBreakdown | null;
  missing_fields: string[];
  explanation: string;
}

export interface ProductVariantItem {
  variant_id: string;
  title: string;
  price: number;
  stock_quantity?: number | null;
  image_url?: string | null;
}

export interface MarketplaceProductItem {
  product_id: string;
  source: string;
  source_product_id: string;
  source_shop_id?: string | null;
  shop_name?: string | null;
  title: string;
  description?: string | null;
  primary_image_url: string;
  image_gallery: string[];
  product_url: string;
  region: string;
  source_category_id?: string | null;
  source_category_name?: string | null;
  internal_category: string;
  internal_subcategory?: string | null;
  pricing: ProductPriceInfo;
  commission: ProductCommissionInfo;
  sales: ProductSalesMetrics;
  content_performance: ProductContentPerformance;
  collaboration_status: ProductCollaborationStatus;
  opportunity_score: OpportunityScoreResult;
  variants: ProductVariantItem[];
  updated_at: string;
  is_cached: boolean;
}

export interface TikTokShopAuthUrlResponse {
  auth_url: string;
  state: string;
  expires_in_seconds: number;
}

export interface ProductResearchSearchRequest {
  query?: string;
  category_id?: string;
  subcategory_id?: string;
  price_min?: number;
  price_max?: number;
  commission_min?: number;
  commission_max?: number;
  collaboration_status?: ProductCollaborationStatus;
  sort_by?: string;
  sort_dir?: string;
  page?: number;
  page_size?: number;
}

export interface ProductResearchSearchResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: MarketplaceProductItem[];
  active_connection?: TikTokShopConnectionPublic | null;
  query_context: Record<string, unknown>;
  is_live_data: boolean;
  notice?: string | null;
}

export interface ProductComparisonResponse {
  products: MarketplaceProductItem[];
  compared_at: string;
}

export interface SearchHistoryItem {
  history_id: string;
  user_id: string;
  query?: string | null;
  category_id?: string | null;
  filters: Record<string, unknown>;
  result_count: number;
  created_at: string;
}

export interface StudioHandoffResponse {
  handoff_id: string;
  product_id: string;
  product_title: string;
  product_url: string;
  primary_image_url: string;
  category: string;
  price: number;
  currency: string;
  shop_name?: string | null;
  project_id?: string | null;
  has_verified_base_video: boolean;
  target_route: string;
  prefill_data: Record<string, unknown>;
}
