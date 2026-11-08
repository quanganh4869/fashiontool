import { config } from '@/app/config/env';
import {
  FashionCategory,
  MarketplaceProductItem,
  ProductComparisonResponse,
  ProductResearchSearchRequest,
  ProductResearchSearchResponse,
  SearchHistoryItem,
  StudioHandoffResponse,
  TikTokShopAuthUrlResponse,
  TikTokShopConnectionPublic,
} from '../types/research.types';

export class ProductResearchService {
  private get baseUrl(): string {
    return `${config.apiUrl}/research`;
  }

  private get integrationsUrl(): string {
    return `${config.apiUrl}/integrations/tiktok-shop`;
  }

  /**
   * Search & filter products from TikTok Shop Open Platform
   */
  async searchProducts(params: ProductResearchSearchRequest = {}): Promise<ProductResearchSearchResponse> {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.set('query', params.query);
    if (params.category_id) searchParams.set('category_id', params.category_id);
    if (params.subcategory_id) searchParams.set('subcategory_id', params.subcategory_id);
    if (params.price_min !== undefined) searchParams.set('price_min', params.price_min.toString());
    if (params.price_max !== undefined) searchParams.set('price_max', params.price_max.toString());
    if (params.commission_min !== undefined) searchParams.set('commission_min', params.commission_min.toString());
    if (params.commission_max !== undefined) searchParams.set('commission_max', params.commission_max.toString());
    if (params.collaboration_status) searchParams.set('collaboration_status', params.collaboration_status);
    if (params.sort_by) searchParams.set('sort_by', params.sort_by);
    if (params.sort_dir) searchParams.set('sort_dir', params.sort_dir);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.page_size) searchParams.set('page_size', params.page_size.toString());

    const url = `${this.baseUrl}/products?${searchParams.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Lỗi tìm kiếm sản phẩm nghiên cứu');
    }
    return res.json();
  }

  /**
   * Get single product detail
   */
  async getProductDetail(productId: string): Promise<MarketplaceProductItem> {
    const res = await fetch(`${this.baseUrl}/products/${productId}`);
    if (!res.ok) {
      throw new Error('Không tìm thấy thông tin chi tiết sản phẩm');
    }
    return res.json();
  }

  /**
   * Compare up to 4 products side-by-side
   */
  async compareProducts(productIds: string[]): Promise<ProductComparisonResponse> {
    const res = await fetch(`${this.baseUrl}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_ids: productIds }),
    });
    if (!res.ok) {
      throw new Error('Lỗi so sánh sản phẩm');
    }
    return res.json();
  }

  /**
   * Get fashion category taxonomy
   */
  async getCategories(): Promise<FashionCategory[]> {
    const res = await fetch(`${this.baseUrl}/categories`);
    if (!res.ok) return [];
    return res.json();
  }

  /**
   * Get search query history
   */
  async getSearchHistory(): Promise<SearchHistoryItem[]> {
    const res = await fetch(`${this.baseUrl}/history`);
    if (!res.ok) return [];
    return res.json();
  }

  /**
   * Delete a search history item
   */
  async deleteSearchHistoryItem(historyId: string): Promise<void> {
    await fetch(`${this.baseUrl}/history/${historyId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Handoff product to Studio
   */
  async handoffToStudio(productId: string, projectId?: string | null): Promise<StudioHandoffResponse> {
    const res = await fetch(`${this.baseUrl}/handoff-studio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, project_id: projectId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Không thể chuyển sản phẩm sang Studio');
    }
    return res.json();
  }

  /**
   * Get current TikTok Shop connection status
   */
  async getTikTokShopStatus(): Promise<TikTokShopConnectionPublic> {
    const res = await fetch(`${this.integrationsUrl}/status`);
    if (!res.ok) {
      throw new Error('Lỗi kiểm tra kết nối TikTok Shop');
    }
    return res.json();
  }

  /**
   * Generate OAuth authorization URL
   */
  async getAuthUrl(redirectUri: string): Promise<TikTokShopAuthUrlResponse> {
    const res = await fetch(`${this.integrationsUrl}/auth-url?redirect_uri=${encodeURIComponent(redirectUri)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Không thể tạo URL ủy quyền TikTok Shop');
    }
    return res.json();
  }

  /**
   * Disconnect TikTok Shop account
   */
  async disconnectTikTokShop(): Promise<void> {
    const res = await fetch(`${this.integrationsUrl}/disconnect`, { method: 'POST' });
    if (!res.ok) {
      throw new Error('Không thể ngắt kết nối tài khoản TikTok Shop');
    }
  }
}

export const researchService = new ProductResearchService();
