import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Package,
  PlusCircle,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  Shirt,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModelTemplateGeneration } from '@/features/studio/types/studio.types';
import {
  ExtractionJobResponse,
  ProductAssetResponse,
  ProductAssetSummaryResponse,
} from '../types/product.types';
import { productService } from '../services/product.service';
import { ProjectContextBar } from './ProjectContextBar';
import { ProductInputSection } from './ProductInputSection';
import { ProductExtractionProgress } from './ProductExtractionProgress';
import { ProductExtractionPreview } from './ProductExtractionPreview';
import { ProductAssetList } from './ProductAssetList';
import { ProductDetailModal } from './ProductDetailModal';

interface ProductManagementStepProps {
  generation: ModelTemplateGeneration;
  onBackToBaseVideo?: () => void;
  onProceedToReplacement?: (productId?: string) => void;
}

type ViewMode = 'list' | 'input' | 'extracting' | 'preview';

export const ProductManagementStep: React.FC<ProductManagementStepProps> = ({
  generation,
  onBackToBaseVideo,
  onProceedToReplacement,
}) => {
  const projectId = generation.projectId;

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Product Assets list
  const [products, setProducts] = useState<ProductAssetSummaryResponse[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Active Extraction Job
  const [extractionJob, setExtractionJob] = useState<ExtractionJobResponse | null>(null);
  const [isStartingExtraction, setIsStartingExtraction] = useState(false);
  const [isCancellingExtraction, setIsCancellingExtraction] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Selected Detail Modal
  const [selectedProductDetail, setSelectedProductDetail] = useState<ProductAssetResponse | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Polling ref
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Fetch products list
  const loadProducts = useCallback(async () => {
    if (!projectId) return;
    try {
      setIsLoadingProducts(true);
      setListError(null);
      const list = await productService.listProducts(projectId);
      setProducts(list);

      // If no products yet, default to input mode
      if (list.length === 0 && viewMode === 'list') {
        setViewMode('input');
      }
    } catch (err: unknown) {
      setListError(err instanceof Error ? err.message : 'Không thể tải danh sách sản phẩm');
    } finally {
      setIsLoadingProducts(false);
    }
  }, [projectId, viewMode]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // 2. Stop extraction polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // 3. Start extraction
  const handleStartExtraction = async (url: string) => {
    if (!projectId) return;
    try {
      setIsStartingExtraction(true);
      const job = await productService.startExtraction(projectId, { url });
      setExtractionJob(job);
      setViewMode('extracting');

      // Begin polling
      stopPolling();
      pollingRef.current = setInterval(async () => {
        try {
          const updated = await productService.getExtractionStatus(projectId, job.job_id);
          setExtractionJob(updated);

          if (updated.status === 'COMPLETED' || updated.status === 'PARTIAL') {
            stopPolling();
            setViewMode('preview');
          } else if (updated.status === 'FAILED' || updated.status === 'CANCELLED') {
            stopPolling();
          }
        } catch {
          // keep polling until max or cancel
        }
      }, 1200);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi khởi tạo quá trình trích xuất');
      setViewMode('input');
    } finally {
      setIsStartingExtraction(false);
    }
  };

  // 4. Cancel extraction
  const handleCancelExtraction = async () => {
    if (!projectId || !extractionJob) return;
    try {
      setIsCancellingExtraction(true);
      const updated = await productService.cancelExtraction(projectId, extractionJob.job_id);
      setExtractionJob(updated);
      stopPolling();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể hủy quá trình trích xuất');
    } finally {
      setIsCancellingExtraction(false);
    }
  };

  // 5. Save product asset to project
  const handleSaveProduct = async (payload: {
    customTitle?: string;
    customDescription?: string;
    primaryImageId?: string;
  }) => {
    if (!projectId || !extractionJob) return;
    try {
      setIsSavingProduct(true);
      await productService.saveProduct(projectId, {
        extraction_job_id: extractionJob.job_id,
        custom_title: payload.customTitle,
        custom_description: payload.customDescription,
        primary_image_id: payload.primaryImageId,
      });

      // Reload products list and switch to list mode
      await loadProducts();
      setViewMode('list');
      setExtractionJob(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể lưu sản phẩm vào dự án');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // 6. View product details
  const handleViewDetails = async (targetProductId: string) => {
    if (!projectId) return;
    try {
      const detail = await productService.getProduct(projectId, targetProductId);
      setSelectedProductDetail(detail);
      setIsDetailModalOpen(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể lấy thông tin chi tiết sản phẩm');
    }
  };

  // 7. Update product details
  const handleUpdateProduct = async (
    targetProductId: string,
    updates: {
      customTitle?: string;
      customDescription?: string;
      primaryImageId?: string;
    }
  ) => {
    if (!projectId) return;
    try {
      setIsUpdatingProduct(true);
      const updated = await productService.updateProduct(projectId, targetProductId, updates);
      setSelectedProductDetail(updated);
      await loadProducts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi cập nhật sản phẩm');
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  // 8. Delete product
  const handleDeleteProduct = async (targetProductId: string) => {
    if (!projectId) return;
    try {
      setDeletingProductId(targetProductId);
      await productService.deleteProduct(projectId, targetProductId);
      await loadProducts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi xóa sản phẩm');
    } finally {
      setDeletingProductId(null);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* 1. Project Context Bar */}
      <ProjectContextBar
        generation={generation}
        onBackToBaseVideo={onBackToBaseVideo}
      />

      {/* 2. Top Navigation Tabs / Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              stopPolling();
              setViewMode('list');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Sản phẩm trong dự án ({products.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('input');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'input' || viewMode === 'extracting' || viewMode === 'preview'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Thêm sản phẩm mới từ liên kết
          </button>

          {products.length > 0 && onProceedToReplacement && (
            <button
              type="button"
              onClick={() => onProceedToReplacement()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs"
            >
              <Shirt className="w-4 h-4" />
              Tiến hành thay trang phục (Bước 7)
            </button>
          )}
        </div>

        {viewMode === 'list' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={loadProducts}
            isLoading={isLoadingProducts}
            className="text-xs text-slate-500 gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Làm mới
          </Button>
        )}
      </div>

      {/* 3. Error Banner */}
      {listError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{listError}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={loadProducts} className="text-xs">
            Thử lại
          </Button>
        </div>
      )}

      {/* 4. Main Body based on ViewMode */}
      {viewMode === 'list' && (
        <ProductAssetList
          products={products}
          onViewDetails={handleViewDetails}
          onDelete={handleDeleteProduct}
          onAddNewClick={() => setViewMode('input')}
          onStartReplacement={onProceedToReplacement}
          isDeletingId={deletingProductId}
        />
      )}

      {viewMode === 'input' && (
        <div className="space-y-6">
          <ProductInputSection
            onExtract={handleStartExtraction}
            isLoading={isStartingExtraction}
          />

          {/* Quick list preview if products already exist */}
          {products.length > 0 && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  Sản phẩm đã có trong dự án ({products.length})
                </h4>
                <button
                  onClick={() => setViewMode('list')}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Xem toàn bộ
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {products.slice(0, 4).map((p) => (
                  <div
                    key={p.product_id}
                    onClick={() => handleViewDetails(p.product_id)}
                    className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center gap-2.5 cursor-pointer hover:border-indigo-400 transition-colors"
                  >
                    <div className="w-10 h-10 rounded bg-[#F6F5F2] border border-[#E8E5E0] shrink-0 overflow-hidden flex items-center justify-center">
                      {p.primary_image_url ? (
                        <img
                          src={productService.resolveImageUrl(p.primary_image_url)}
                          alt={p.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {p.custom_title || p.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {p.total_images_count} ảnh • {p.source_domain}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'extracting' && extractionJob && (
        <ProductExtractionProgress
          job={extractionJob}
          onCancel={handleCancelExtraction}
          isCancelling={isCancellingExtraction}
        />
      )}

      {viewMode === 'preview' && extractionJob && (
        <ProductExtractionPreview
          job={extractionJob}
          onSave={handleSaveProduct}
          onReset={() => {
            stopPolling();
            setExtractionJob(null);
            setViewMode('input');
          }}
          isSaving={isSavingProduct}
        />
      )}

      {/* 5. Detail Inspection Modal */}
      <ProductDetailModal
        product={selectedProductDetail}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedProductDetail(null);
        }}
        onUpdate={handleUpdateProduct}
        isUpdating={isUpdatingProduct}
      />

      {/* Pinned Bottom Navigation */}
      <div className="fixed bottom-0 right-0 left-0 lg:left-[var(--sidebar-w,252px)] z-30 bg-white/95 backdrop-blur-md border-t border-[#E8E5E0] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-[left] duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-7 lg:px-8 py-3.5 flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={onBackToBaseVideo}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại: Kết quả Base Video
          </Button>

          {onProceedToReplacement && (
            <Button
              variant="primary"
              onClick={() => onProceedToReplacement()}
              disabled={products.length === 0}
              className="gap-2 shadow-sm"
            >
              <span>Tiếp tục: Thay trang phục</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
