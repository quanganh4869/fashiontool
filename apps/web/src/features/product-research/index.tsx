import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  AlertCircle,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/feedback/EmptyState';
import {
  FashionCategory,
  MarketplaceProductItem,
  ProductResearchSearchRequest,
  SearchHistoryItem,
  TikTokShopConnectionPublic,
} from './types/research.types';
import { researchService } from './services/research.service';
import { TikTokShopConnectionBanner } from './components/TikTokShopConnectionBanner';
import { ProductSearchBar } from './components/ProductSearchBar';
import { ProductFilterBar } from './components/ProductFilterBar';
import { ProductCard } from './components/ProductCard';
import { ProductTableView } from './components/ProductTableView';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ProductComparisonModal } from './components/ProductComparisonModal';
import { SearchHistoryDrawer } from './components/SearchHistoryDrawer';
import { StudioHandoffModal } from './components/StudioHandoffModal';

export const ProductResearchPage: React.FC = () => {
  const { productId: urlProductId } = useParams<{ productId?: string }>();
  const navigate = useNavigate();

  // Connection and taxonomy state
  const [connection, setConnection] = useState<TikTokShopConnectionPublic | null>(null);
  const [categories, setCategories] = useState<FashionCategory[]>([]);
  const [, setIsLoadingConnection] = useState(true);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ProductResearchSearchRequest>({
    page: 1,
    page_size: 20,
    sort_by: 'opportunity_score',
    sort_dir: 'desc',
  });

  // Results state
  const [products, setProducts] = useState<MarketplaceProductItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Compare state
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Detail Modal state
  const [detailProduct, setDetailProduct] = useState<MarketplaceProductItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Handoff Modal state
  const [handoffProduct, setHandoffProduct] = useState<MarketplaceProductItem | null>(null);
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false);

  // Search History Drawer state
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historyList, setHistoryList] = useState<SearchHistoryItem[]>([]);

  // Load initial connection and categories
  const loadInitialData = useCallback(async () => {
    setIsLoadingConnection(true);
    try {
      const [conn, cats] = await Promise.all([
        researchService.getTikTokShopStatus().catch(() => null),
        researchService.getCategories().catch(() => []),
      ]);
      setConnection(conn);
      setCategories(cats);
    } catch {
      // ignore
    } finally {
      setIsLoadingConnection(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load search history
  const loadSearchHistory = useCallback(async () => {
    try {
      const hist = await researchService.getSearchHistory();
      setHistoryList(hist);
    } catch {
      setHistoryList([]);
    }
  }, []);

  useEffect(() => {
    loadSearchHistory();
  }, [loadSearchHistory]);

  // Fetch products
  const executeSearch = useCallback(
    async (overrideParams?: Partial<ProductResearchSearchRequest>) => {
      setIsLoadingProducts(true);
      setSearchError(null);

      const requestParams: ProductResearchSearchRequest = {
        ...filters,
        query: searchQuery.trim() || undefined,
        ...overrideParams,
      };

      try {
        const res = await researchService.searchProducts(requestParams);
        setProducts(res.items);
        setTotalCount(res.total);
        setTotalPages(res.total_pages);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Lỗi truy vấn sản phẩm';
        setSearchError(msg);
        setProducts([]);
        setTotalCount(0);
      } finally {
        setIsLoadingProducts(false);
      }
    },
    [filters, searchQuery]
  );

  // Trigger search when filters change or initially
  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  // Check URL params for specific product
  useEffect(() => {
    if (urlProductId) {
      researchService
        .getProductDetail(urlProductId)
        .then((p) => {
          setDetailProduct(p);
          setIsDetailModalOpen(true);
        })
        .catch(() => {
          // If not found in API, ignore
        });
    }
  }, [urlProductId]);

  // Handle search submit
  const handleSearchSubmit = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    executeSearch({ page: 1 });
    loadSearchHistory();
  };

  // Handle clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setFilters({
      page: 1,
      page_size: 20,
      sort_by: 'opportunity_score',
      sort_dir: 'desc',
    });
  };

  // Compare selection toggle
  const handleToggleCompare = (product: MarketplaceProductItem) => {
    setSelectedCompareIds((prev) => {
      if (prev.includes(product.product_id)) {
        return prev.filter((id) => id !== product.product_id);
      }
      if (prev.length >= 4) {
        alert('Bạn chỉ có thể so sánh tối đa 4 sản phẩm cùng một lúc.');
        return prev;
      }
      return [...prev, product.product_id];
    });
  };

  // View detail
  const handleViewDetail = (product: MarketplaceProductItem) => {
    setDetailProduct(product);
    setIsDetailModalOpen(true);
  };

  // Handoff to Studio
  const handleHandoffToStudio = (product: MarketplaceProductItem) => {
    setHandoffProduct(product);
    setIsHandoffModalOpen(true);
  };

  // Restore search query from history
  const handleSelectHistoryQuery = (query: string) => {
    setSearchQuery(query);
    setFilters((prev) => ({ ...prev, page: 1 }));
    executeSearch({ query, page: 1 });
  };

  // Delete search history item
  const handleDeleteHistoryItem = async (historyId: string) => {
    try {
      await researchService.deleteSearchHistoryItem(historyId);
      setHistoryList((prev) => prev.filter((item) => item.history_id !== historyId));
    } catch {
      // ignore
    }
  };

  // Products currently selected for comparison
  const selectedCompareProducts = products.filter((p) =>
    selectedCompareIds.includes(p.product_id)
  );

  return (
    <PageContainer
      title="Nghiên cứu sản phẩm TikTok Shop"
      description="Tìm kiếm, phân tích và đối chiếu sản phẩm thời trang tiềm năng từ TikTok Shop để đưa vào quy trình sản xuất video affiliate."
      actions={
        <div className="flex items-center gap-2">
          {selectedCompareIds.length > 0 && (
            <Button
              size="sm"
              onClick={() => setIsCompareModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm inline-flex items-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Đối chiếu ({selectedCompareIds.length}/4)</span>
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* TikTok Shop Connection Banner */}
        <TikTokShopConnectionBanner
          connection={connection}
          onRefresh={loadInitialData}
        />

        {/* Search Bar */}
        <div>
          <ProductSearchBar
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onSearch={handleSearchSubmit}
            isLoading={isLoadingProducts}
          />
        </div>

        {/* Filter Bar with View Mode and History */}
        <ProductFilterBar
          categories={categories}
          filters={filters}
          onChange={(updated) =>
            setFilters((prev) => ({
              ...prev,
              ...updated,
            }))
          }
          onReset={handleClearFilters}
          viewMode={viewMode}
          onToggleViewMode={setViewMode}
          onOpenHistory={() => setIsHistoryDrawerOpen(true)}
          historyCount={historyList.length}
          totalResults={totalCount}
        />

        {/* Results Header */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <div>
            {isLoadingProducts ? (
              <span className="inline-flex items-center gap-1.5 text-indigo-600 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Đang tìm kiếm sản phẩm thời trang từ TikTok Shop...
              </span>
            ) : (
              <span>
                Tìm thấy <strong>{totalCount}</strong> sản phẩm thời trang phù hợp
              </span>
            )}
          </div>

          {selectedCompareIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-700 font-medium">
                Đã chọn <strong>{selectedCompareIds.length}</strong> sản phẩm để đối chiếu
              </span>
              <button
                type="button"
                onClick={() => setSelectedCompareIds([])}
                className="text-[11px] text-rose-500 hover:underline"
              >
                Bỏ chọn tất cả
              </button>
            </div>
          )}
        </div>

        {/* Product Results */}
        {searchError ? (
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-700">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <h4 className="font-bold text-sm">Không thể truy vấn sản phẩm</h4>
            <p className="text-xs mt-1 text-rose-600">{searchError}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => executeSearch()}
              className="mt-4 border-rose-200 hover:bg-rose-100/50"
            >
              Thử lại
            </Button>
          </div>
        ) : products.length === 0 && !isLoadingProducts ? (
          <EmptyState
            icon={Search}
            title={
              connection?.status === 'NOT_CONFIGURED' || connection?.status === 'DISCONNECTED'
                ? 'Chưa kết nối tài khoản TikTok Shop'
                : 'Không tìm thấy sản phẩm thời trang nào'
            }
            description={
              connection?.status === 'NOT_CONFIGURED' || connection?.status === 'DISCONNECTED'
                ? 'Hãy cấu hình TIKTOK_SHOP_APP_KEY và ủy quyền tài khoản TikTok Shop để tìm kiếm sản phẩm thương mại thực tế.'
                : 'Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh lại các bộ lọc danh mục và mức giá.'
            }
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                isSelectedForCompare={selectedCompareIds.includes(product.product_id)}
                onToggleCompare={handleToggleCompare}
                onViewDetail={handleViewDetail}
                onHandoffToStudio={handleHandoffToStudio}
              />
            ))}
          </div>
        ) : (
          <ProductTableView
            products={products}
            selectedCompareIds={selectedCompareIds}
            onToggleCompare={handleToggleCompare}
            onViewDetail={handleViewDetail}
            onHandoffToStudio={handleHandoffToStudio}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="secondary"
              size="sm"
              disabled={(filters.page || 1) <= 1 || isLoadingProducts}
              onClick={() => {
                const newPage = (filters.page || 1) - 1;
                setFilters((prev) => ({ ...prev, page: newPage }));
              }}
            >
              Trang trước
            </Button>
            <span className="text-xs text-slate-500 px-2">
              Trang {filters.page || 1} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={(filters.page || 1) >= totalPages || isLoadingProducts}
              onClick={() => {
                const newPage = (filters.page || 1) + 1;
                setFilters((prev) => ({ ...prev, page: newPage }));
              }}
            >
              Trang tiếp
            </Button>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailProduct(null);
          if (urlProductId) {
            navigate('/products', { replace: true });
          }
        }}
        product={detailProduct}
        onHandoffToStudio={handleHandoffToStudio}
      />

      {/* Product Comparison Modal */}
      <ProductComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        products={selectedCompareProducts}
        onRemoveProduct={(id) => {
          setSelectedCompareIds((prev) => prev.filter((pId) => pId !== id));
        }}
        onHandoffToStudio={handleHandoffToStudio}
      />

      {/* Studio Handoff Modal */}
      <StudioHandoffModal
        isOpen={isHandoffModalOpen}
        onClose={() => {
          setIsHandoffModalOpen(false);
          setHandoffProduct(null);
        }}
        product={handoffProduct}
      />

      {/* Search History Drawer */}
      <SearchHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        history={historyList}
        onSelectQuery={handleSelectHistoryQuery}
        onDeleteItem={handleDeleteHistoryItem}
      />
    </PageContainer>
  );
};
