import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shirt,
  PlusCircle,
  Layers,
  FolderKanban,
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
import {
  BatchDetailResponse,
  BatchPreflightResponse,
  FinalVideoItem,
} from '@/features/batch/types/batch.types';
import { batchService } from '@/features/batch/services/batch.service';
import { BatchSelectionWorkspace } from '@/features/batch/components/BatchSelectionWorkspace';
import { BatchReviewModal } from '@/features/batch/components/BatchReviewModal';
import { BatchDetailDashboard } from '@/features/batch/components/BatchDetailDashboard';
import { FinalVideoLibraryView } from '@/features/batch/components/FinalVideoLibraryView';
import { FinalVideoDetailModal } from '@/features/batch/components/FinalVideoDetailModal';
import { SynchronizedVideoComparisonModal } from '@/features/batch/components/SynchronizedVideoComparisonModal';

export interface ReplacementWorkspaceStepProps {
  generation: ModelTemplateGeneration;
  onBackToProducts?: () => void;
  targetProduct?: ProductAssetSummaryResponse | ProductAssetResponse | null;
}

type WorkspaceMode = 'single' | 'batch' | 'library';

export const ReplacementWorkspaceStep: React.FC<ReplacementWorkspaceStepProps> = ({
  generation,
  onBackToProducts,
  targetProduct: initialTargetProduct,
}) => {
  const projectId = generation.projectId;

  // Workspace Mode: 'single' | 'batch' | 'library'
  const [mode, setMode] = useState<WorkspaceMode>('single');

  // Products in project
  const [products, setProducts] = useState<ProductAssetSummaryResponse[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<
    ProductAssetSummaryResponse | ProductAssetResponse | null
  >(initialTargetProduct || null);

  // Single Replacement jobs
  const [jobs, setJobs] = useState<ReplacementJobResponse[]>([]);
  const [activeJob, setActiveJob] = useState<ReplacementJobResponse | null>(null);

  // Single Preflight state
  const [isPreflightModalOpen, setIsPreflightModalOpen] = useState(false);
  const [preflightData, setPreflightData] = useState<ReplacementPreflightResponse | null>(null);
  const [isLoadingPreflight, setIsLoadingPreflight] = useState(false);
  const [isStartingJob, setIsStartingJob] = useState(false);

  // Batch Production state
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [activeBatchDetail, setActiveBatchDetail] = useState<BatchDetailResponse | null>(null);
  const [isBatchReviewOpen, setIsBatchReviewOpen] = useState(false);
  const [batchPreflightData, setBatchPreflightData] = useState<BatchPreflightResponse | null>(null);
  const [isLoadingBatchPreflight, setIsLoadingBatchPreflight] = useState(false);
  const [isStartingBatch, setIsStartingBatch] = useState(false);
  const [isCancellingBatch, setIsCancellingBatch] = useState(false);

  // Final Video Modals
  const [selectedVideoDetail, setSelectedVideoDetail] = useState<FinalVideoItem | null>(null);
  const [selectedCompareVideo, setSelectedCompareVideo] = useState<FinalVideoItem | null>(null);

  // Polling refs
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const batchPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Load products and existing single replacement jobs
  const loadData = useCallback(async () => {
    if (!projectId) return;
    try {
      const [productList, jobList, batchList] = await Promise.all([
        productService.listProducts(projectId).catch(() => []),
        replacementService.listJobs(projectId).catch(() => []),
        batchService.listBatches(projectId).catch(() => []),
      ]);

      setProducts(productList);
      setJobs(jobList);

      if (initialTargetProduct) {
        setSelectedProduct(initialTargetProduct);
      } else if (productList.length > 0 && !selectedProduct) {
        setSelectedProduct(productList[0]);
      }

      if (jobList.length > 0 && !activeJob) {
        setActiveJob(jobList[0]);
      }

      if (batchList.length > 0 && !activeBatchId) {
        setActiveBatchId(batchList[0].batch_id);
      }
    } catch (err: unknown) {
      console.error('Error loading replacement data:', err);
    }
  }, [projectId, initialTargetProduct, selectedProduct, activeJob, activeBatchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Polling Single Job
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
          setJobs((prev) => prev.map((j) => (j.job_id === updated.job_id ? updated : j)));

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

  // 3. Polling Batch
  const stopBatchPolling = useCallback(() => {
    if (batchPollingRef.current) {
      clearInterval(batchPollingRef.current);
      batchPollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopBatchPolling();
  }, [stopBatchPolling]);

  const pollBatchStatus = useCallback(
    (bId: string) => {
      stopBatchPolling();
      batchPollingRef.current = setInterval(async () => {
        try {
          const detail = await batchService.getBatch(projectId, bId);
          setActiveBatchDetail(detail);

          const bStatus = detail.batch.status;
          if (
            bStatus === 'COMPLETED' ||
            bStatus === 'PARTIALLY_COMPLETED' ||
            bStatus === 'FAILED' ||
            bStatus === 'CANCELLED'
          ) {
            stopBatchPolling();
          }
        } catch (err) {
          console.error('Polling batch failed:', err);
        }
      }, 2000);
    },
    [projectId, stopBatchPolling]
  );

  const loadBatchDetail = useCallback(
    async (bId: string) => {
      try {
        const detail = await batchService.getBatch(projectId, bId);
        setActiveBatchDetail(detail);
        if (detail.batch.status === 'PROCESSING' || detail.batch.status === 'QUEUED') {
          pollBatchStatus(bId);
        }
      } catch (err) {
        console.error('Failed to load batch detail:', err);
      }
    },
    [projectId, pollBatchStatus]
  );

  useEffect(() => {
    if (activeBatchId && mode === 'batch') {
      loadBatchDetail(activeBatchId);
    }
  }, [activeBatchId, mode, loadBatchDetail]);

  // 4. Single Preflight & Create
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

  // 5. Batch Preflight & Create
  const handleStartBatchPreflight = async (selectedProductIds: string[]) => {
    if (selectedProductIds.length === 0) return;
    try {
      setIsLoadingBatchPreflight(true);
      const baseVideoAssetId = generation.outputVideoAssetId || generation.generationId;
      const res = await batchService.checkBatchPreflight(
        projectId,
        baseVideoAssetId,
        selectedProductIds
      );
      setBatchPreflightData(res);
      setIsBatchReviewOpen(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi kiểm tra đợt sản xuất');
    } finally {
      setIsLoadingBatchPreflight(false);
    }
  };

  const handleConfirmBatchCreation = async (
    validProductIds: string[],
    confirmedLimitations: boolean,
    idempotencyKey: string
  ) => {
    try {
      setIsStartingBatch(true);
      const baseVideoAssetId = generation.outputVideoAssetId || generation.generationId;
      const newBatch = await batchService.createBatch(projectId, {
        project_id: projectId,
        base_video_asset_id: baseVideoAssetId,
        product_asset_ids: validProductIds,
        confirmed_limitations: confirmedLimitations,
        idempotency_key: idempotencyKey,
      });

      setIsBatchReviewOpen(false);
      setActiveBatchId(newBatch.batch_id);
      loadBatchDetail(newBatch.batch_id);
      setMode('batch');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể tạo đợt sản xuất hàng loạt');
    } finally {
      setIsStartingBatch(false);
    }
  };

  const handleCancelActiveBatch = async () => {
    if (!activeBatchId) return;
    if (!window.confirm('Xác nhận dừng các tác vụ đang trong hàng đợi của đợt này?')) return;
    try {
      setIsCancellingBatch(true);
      await batchService.cancelBatch(projectId, activeBatchId);
      loadBatchDetail(activeBatchId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể hủy đợt sản xuất');
    } finally {
      setIsCancellingBatch(false);
    }
  };

  const handleRetryBatchJob = async (jobId: string) => {
    if (!activeBatchId) return;
    try {
      await batchService.retryJob(projectId, activeBatchId, jobId);
      loadBatchDetail(activeBatchId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể thử lại tác vụ');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Mode Selector Navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
            <Shirt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Bước 7: Thay thế trang phục & Sản xuất hàng loạt
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dự án: <span className="font-semibold text-slate-700">{generation.projectName}</span> •
              Model: <span className="font-semibold text-slate-700">{generation.modelName}</span>
            </p>
          </div>
        </div>

        {/* 3 Main Mode Switchers */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              mode === 'single'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Thay đồ đơn lẻ</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('batch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              mode === 'batch'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sản xuất hàng loạt</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('library')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              mode === 'library'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Thư viện video ({jobs.filter((j) => j.status === 'COMPLETED' || j.status === 'NEEDS_REVIEW').length})</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          MODE 1: SINGLE REPLACEMENT WORKSPACE
      ===================================================================== */}
      {mode === 'single' && (
        <div className="space-y-6">
          {/* Action strip */}
          <div className="flex items-center justify-between">
            {jobs.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 font-semibold uppercase text-[10px] shrink-0">
                  Lần chạy ({jobs.length}):
                </span>
                {jobs.map((j) => {
                  const isSelected = activeJob?.job_id === j.job_id;
                  return (
                    <button
                      key={j.job_id}
                      onClick={() => setActiveJob(j)}
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

            <div className="flex items-center gap-2 ml-auto">
              <Button
                size="sm"
                onClick={() => handleOpenPreflight()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Thay trang phục mới
              </Button>
            </div>
          </div>

          {activeJob ? (
            activeJob.status === 'COMPLETED' || activeJob.status === 'NEEDS_REVIEW' ? (
              <FinalProductVideoReview
                job={activeJob}
                onDecisionSubmitted={(updated) => {
                  setActiveJob(updated);
                  setJobs((prev) => prev.map((j) => (j.job_id === updated.job_id ? updated : j)));
                }}
              />
            ) : (
              <ReplacementProgressStep
                job={activeJob}
                onViewResult={() => {
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
            <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Shirt className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Sẵn sàng thay trang phục cho Personalized Base Video
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Chọn một sản phẩm thời trang trong dự án để thay thế trang phục trên video nền.
              </p>
              {products.length > 0 ? (
                <div className="pt-2">
                  <Button onClick={() => handleOpenPreflight(products[0])} className="bg-indigo-600 text-white text-xs">
                    Bắt đầu thay đồ ngay
                  </Button>
                </div>
              ) : onBackToProducts ? (
                <div className="pt-2">
                  <Button onClick={onBackToProducts} variant="secondary" className="text-xs">
                    Thêm sản phẩm vào dự án
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          MODE 2: BATCH PRODUCTION WORKSPACE
      ===================================================================== */}
      {mode === 'batch' && (
        <div className="space-y-6">
          {activeBatchDetail ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveBatchDetail(null)}
                  className="text-xs text-indigo-600 hover:bg-indigo-50"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1" /> Tạo đợt sản xuất mới
                </Button>
              </div>

              <BatchDetailDashboard
                batchDetail={activeBatchDetail}
                onRefresh={() => activeBatchId && loadBatchDetail(activeBatchId)}
                onCancelBatch={handleCancelActiveBatch}
                onRetryJob={handleRetryBatchJob}
                onGoToLibrary={() => setMode('library')}
                isCancelling={isCancellingBatch}
              />
            </div>
          ) : (
            <BatchSelectionWorkspace
              generation={generation}
              products={products}
              onStartPreflight={handleStartBatchPreflight}
              isLoading={isLoadingBatchPreflight}
            />
          )}
        </div>
      )}

      {/* =====================================================================
          MODE 3: FINAL VIDEO LIBRARY WORKSPACE
      ===================================================================== */}
      {mode === 'library' && (
        <FinalVideoLibraryView
          generation={generation}
          onOpenVideoDetail={(v) => setSelectedVideoDetail(v)}
          onOpenCompare={(v) => setSelectedCompareVideo(v)}
          onNewBatchClick={() => {
            setActiveBatchDetail(null);
            setMode('batch');
          }}
        />
      )}

      {/* Single Preflight Modal */}
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

      {/* Batch Review Modal */}
      <BatchReviewModal
        isOpen={isBatchReviewOpen}
        onClose={() => setIsBatchReviewOpen(false)}
        onConfirm={handleConfirmBatchCreation}
        preflight={batchPreflightData}
        isLoading={isLoadingBatchPreflight}
        isStarting={isStartingBatch}
      />

      {/* Final Video Detail Modal */}
      <FinalVideoDetailModal
        isOpen={Boolean(selectedVideoDetail)}
        onClose={() => setSelectedVideoDetail(null)}
        video={selectedVideoDetail}
        onOpenCompare={(v) => {
          setSelectedVideoDetail(null);
          setSelectedCompareVideo(v);
        }}
      />

      {/* Synchronized Comparison Modal */}
      <SynchronizedVideoComparisonModal
        isOpen={Boolean(selectedCompareVideo)}
        onClose={() => setSelectedCompareVideo(null)}
        video={selectedCompareVideo}
        generation={generation}
      />
    </div>
  );
};
