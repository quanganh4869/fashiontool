import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shirt,
  Package,
  PlusCircle,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModelTemplateGeneration } from '@/features/studio/types/studio.types';
import {
  ProductAssetResponse,
  ProductAssetSummaryResponse,
} from '@/features/products/types/product.types';
import { productService } from '@/features/products/services/product.service';
import {
  ReplacementJobResponse,
  ReplacementPreflightResponse,
} from '../types/replacement.types';
import { replacementService } from '../services/replacement.service';
import { ReplacementPreflightModal } from './ReplacementPreflightModal';
import { ReplacementProgressStep } from './ReplacementProgressStep';
import { FinalProductVideoReview } from './FinalProductVideoReview';

export interface ReplacementWorkspaceStepProps {
  generation: ModelTemplateGeneration;
  onBackToProducts?: () => void;
  targetProduct?: ProductAssetSummaryResponse | ProductAssetResponse | null;
}

export const ReplacementWorkspaceStep: React.FC<ReplacementWorkspaceStepProps> = ({
  generation,
  onBackToProducts,
  targetProduct: initialTargetProduct,
}) => {
  const projectId = generation.projectId;

  // Products in project
  const [products, setProducts] = useState<ProductAssetSummaryResponse[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<
    ProductAssetSummaryResponse | ProductAssetResponse | null
  >(initialTargetProduct || null);

  // Replacement jobs
  const [jobs, setJobs] = useState<ReplacementJobResponse[]>([]);
  const [activeJob, setActiveJob] = useState<ReplacementJobResponse | null>(null);

  // Preflight state
  const [isPreflightModalOpen, setIsPreflightModalOpen] = useState(false);
  const [preflightData, setPreflightData] = useState<ReplacementPreflightResponse | null>(null);
  const [isLoadingPreflight, setIsLoadingPreflight] = useState(false);
  const [isStartingJob, setIsStartingJob] = useState(false);

  // Polling ref
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Load products and existing replacement jobs
  const loadData = useCallback(async () => {
    if (!projectId) return;
    try {
      const [productList, jobList] = await Promise.all([
        productService.listProducts(projectId).catch(() => []),
        replacementService.listJobs(projectId).catch(() => []),
      ]);

      setProducts(productList);
      setJobs(jobList);

      // If initial target product was given, keep it
      if (initialTargetProduct) {
        setSelectedProduct(initialTargetProduct);
      } else if (productList.length > 0 && !selectedProduct) {
        setSelectedProduct(productList[0]);
      }

      // If jobs exist, select latest job
      if (jobList.length > 0 && !activeJob) {
        setActiveJob(jobList[0]);
      }
    } catch (err: unknown) {
      console.error('Error loading replacement data:', err);
    }
  }, [projectId, initialTargetProduct, selectedProduct, activeJob]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Polling active job
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const pollJobStatus = useCallback(
    (jobId: string) => {
      stopPolling();
      pollingRef.current = setInterval(async () => {
        try {
          const updated = await replacementService.getJob(projectId, jobId);
          setActiveJob(updated);

          // Update in jobs array
          setJobs((prev) =>
            prev.map((j) => (j.job_id === updated.job_id ? updated : j))
          );

          if (
            updated.status === 'COMPLETED' ||
            updated.status === 'NEEDS_REVIEW' ||
            updated.status === 'FAILED' ||
            updated.status === 'CANCELLED'
          ) {
            stopPolling();
          }
        } catch (err) {
          console.error('Polling job failed:', err);
        }
      }, 2000);
    },
    [projectId, stopPolling]
  );

  // Start polling if active job is in progress
  useEffect(() => {
    if (
      activeJob &&
      activeJob.status !== 'COMPLETED' &&
      activeJob.status !== 'NEEDS_REVIEW' &&
      activeJob.status !== 'FAILED' &&
      activeJob.status !== 'CANCELLED'
    ) {
      pollJobStatus(activeJob.job_id);
    }
  }, [activeJob, pollJobStatus]);

  // 3. Preflight check
  const handleOpenPreflight = async (productToUse?: ProductAssetSummaryResponse) => {
    const prod = productToUse || selectedProduct;
    if (!prod) return;

    setSelectedProduct(prod);
    setIsPreflightModalOpen(true);
    setIsLoadingPreflight(true);
    setPreflightData(null);

    try {
      const baseVideoAssetId = generation.outputVideoAssetId || generation.generationId;
      const res = await replacementService.checkPreflight(
        projectId,
        baseVideoAssetId,
        prod.product_id
      );
      setPreflightData(res);
    } catch (err: unknown) {
      console.error('Preflight error:', err);
    } finally {
      setIsLoadingPreflight(false);
    }
  };

  // 4. Confirm Preflight & Start Job
  const handleConfirmStart = async (confirmedLimitations: boolean) => {
    if (!selectedProduct) return;
    try {
      setIsStartingJob(true);
      const baseVideoAssetId = generation.outputVideoAssetId || generation.generationId;
      const job = await replacementService.createJob(
        projectId,
        baseVideoAssetId,
        selectedProduct.product_id,
        confirmedLimitations
      );

      setIsPreflightModalOpen(false);
      setActiveJob(job);
      setJobs((prev) => [job, ...prev.filter((j) => j.job_id !== job.job_id)]);
      pollJobStatus(job.job_id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể khởi chạy quy trình thay trang phục');
    } finally {
      setIsStartingJob(false);
    }
  };

  // 5. Select another existing job
  const handleSelectJob = (job: ReplacementJobResponse) => {
    setActiveJob(job);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Job Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <Shirt className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Bước 7: Thay thế trang phục (Garment Replacement)
            </h3>
            <p className="text-xs text-slate-500">
              Dự án: <span className="font-semibold text-slate-700">{generation.projectName}</span> •
              Model: <span className="font-semibold text-slate-700">{generation.modelName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {products.length > 0 && (
            <Button
              onClick={() => handleOpenPreflight()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              Tạo phiên bản thay đồ mới
            </Button>
          )}

          {onBackToProducts && (
            <Button
              variant="secondary"
              onClick={onBackToProducts}
              className="text-slate-600 border-slate-300 hover:bg-slate-50 text-xs"
            >
              <Package className="w-3.5 h-3.5 mr-1" />
              Quản lý sản phẩm
            </Button>
          )}
        </div>
      </div>

      {/* Existing Jobs List Pill Strip */}
      {jobs.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold uppercase text-[10px] shrink-0">
            Các lần thay đồ ({jobs.length}):
          </span>
          {jobs.map((j) => {
            const isSelected = activeJob?.job_id === j.job_id;
            return (
              <button
                key={j.job_id}
                onClick={() => handleSelectJob(j)}
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Shirt className="w-3 h-3" />
                <span>{j.product_title}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                    j.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : j.status === 'FAILED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {j.status}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main View Area */}
      {activeJob ? (
        activeJob.status === 'COMPLETED' || activeJob.status === 'NEEDS_REVIEW' ? (
          <FinalProductVideoReview
            job={activeJob}
            onDecisionSubmitted={(updated) => {
              setActiveJob(updated);
              setJobs((prev) =>
                prev.map((j) => (j.job_id === updated.job_id ? updated : j))
              );
            }}
          />
        ) : (
          <ReplacementProgressStep
            job={activeJob}
            onViewResult={() => {
              // Refresh job
              replacementService.getJob(projectId, activeJob.job_id).then(setActiveJob);
            }}
            onCancel={() => {
              if (window.confirm('Bạn có chắc muốn hủy tác vụ thay đồ này?')) {
                stopPolling();
                setActiveJob((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
              }
            }}
          />
        )
      ) : (
        /* Empty State / Select Product to Replace */
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center space-y-6 shadow-xs max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
            <Shirt className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">
              Sẵn sàng thay trang phục cho Personalized Base Video
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Hệ thống sẽ giữ nguyên vẹn 100% người mẫu, chuyển động và background từ Base Video,
              sau đó thay thế áo sơ mi đen ban đầu bằng chiếc áo sơ mi trắng đúng quy cách 6 cúc,
              cổ nhọn và túi ngực từ Product Asset.
            </p>
          </div>

          {products.length > 0 ? (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-semibold text-slate-700">
                Chọn sản phẩm để áp dụng thay thế:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {products.map((p) => (
                  <div
                    key={p.product_id}
                    onClick={() => handleOpenPreflight(p)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/30 cursor-pointer transition-all flex items-center gap-3 group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0">
                      {p.primary_image_url ? (
                        <img
                          src={productService.resolveImageUrl(p.primary_image_url)}
                          alt={p.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 m-3 text-slate-400" />
                      )}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600">
                        {p.custom_title || p.title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {p.total_images_count} ảnh • {p.brand || p.source_domain}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-slate-500">
                Chưa có sản phẩm nào được nhập trong dự án này. Vui lòng nhập link sản phẩm trước.
              </p>
              {onBackToProducts && (
                <Button onClick={onBackToProducts} className="bg-indigo-600 text-white text-xs">
                  <Package className="w-4 h-4 mr-1.5" />
                  Đi tới Nhập sản phẩm
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Preflight Modal */}
      <ReplacementPreflightModal
        isOpen={isPreflightModalOpen}
        onClose={() => setIsPreflightModalOpen(false)}
        onConfirm={handleConfirmStart}
        generation={generation}
        product={selectedProduct}
        preflight={preflightData}
        isLoading={isLoadingPreflight}
        isStarting={isStartingJob}
      />
    </div>
  );
};
