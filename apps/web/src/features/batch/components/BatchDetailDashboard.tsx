import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  Ban,
  Play,
  Clock,
  Shirt,
  RefreshCw,
  FolderKanban,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import {
  BatchDetailResponse,
  BatchProductionStatus,
} from '../types/batch.types';
import { ReplacementJobResponse } from '@/features/replacement/types/replacement.types';
import { replacementService } from '@/features/replacement/services/replacement.service';

export interface BatchDetailDashboardProps {
  batchDetail: BatchDetailResponse;
  onRefresh: () => void;
  onCancelBatch: () => void;
  onRetryJob: (jobId: string) => void;
  onGoToLibrary?: () => void;
  isCancelling?: boolean;
}

export const BatchDetailDashboard: React.FC<BatchDetailDashboardProps> = ({
  batchDetail,
  onRefresh,
  onCancelBatch,
  onRetryJob,
  onGoToLibrary,
  isCancelling = false,
}) => {
  const { batch, jobs } = batchDetail;
  const isFinished =
    batch.status === 'COMPLETED' ||
    batch.status === 'PARTIALLY_COMPLETED' ||
    batch.status === 'FAILED' ||
    batch.status === 'CANCELLED';

  const [previewJob, setPreviewJob] = useState<ReplacementJobResponse | null>(null);

  const getStatusBadge = (status: BatchProductionStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> HOÀN THÀNH TOÀN BỘ
          </span>
        );
      case 'PARTIALLY_COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> HOÀN THÀNH MỘT PHẦN
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> ĐANG XỬ LÝ TUẦN TỰ
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            <Ban className="w-3.5 h-3.5" /> ĐÃ HỦY
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <AlertCircle className="w-3.5 h-3.5" /> THẤT BẠI
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            <Clock className="w-3.5 h-3.5" /> ĐANG TRONG HÀNG ĐỢI
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Overview Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {getStatusBadge(batch.status)}
              <span className="text-xs text-slate-400 font-mono">Mã Đợt: {batch.batch_id}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{batch.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Video nền nguồn: <strong className="text-slate-700">{batch.base_video_title}</strong> •
              Người mẫu: <strong className="text-slate-700">{batch.model_name}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onRefresh}
              className="text-xs text-slate-600 gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Làm mới
            </Button>

            {!isFinished && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onCancelBatch}
                disabled={isCancelling}
                className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" /> Hủy đợt
              </Button>
            )}

            {onGoToLibrary && (
              <Button
                onClick={onGoToLibrary}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shadow-xs"
              >
                <FolderKanban className="w-3.5 h-3.5" /> Thư viện video thành phẩm
              </Button>
            )}
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700 flex items-center gap-2">
              {!isFinished && <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />}
              Tiến độ sản xuất tổng thể
            </span>
            <span className="text-indigo-600 font-mono text-sm font-bold">{batch.progress}%</span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                batch.status === 'COMPLETED'
                  ? 'bg-emerald-500'
                  : batch.status === 'FAILED'
                  ? 'bg-rose-500'
                  : 'bg-linear-to-r from-indigo-500 to-indigo-600'
              }`}
              style={{ width: `${Math.max(3, Math.min(100, batch.progress))}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Tổng số</span>
              <strong className="text-sm font-mono text-slate-800">{batch.total_jobs}</strong>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg text-center">
              <span className="text-[10px] text-emerald-700 uppercase font-bold block">Thành công</span>
              <strong className="text-sm font-mono text-emerald-800">{batch.completed_jobs}</strong>
            </div>
            <div className="p-2.5 bg-indigo-50 rounded-lg text-center">
              <span className="text-[10px] text-indigo-700 uppercase font-bold block">Đang xử lý</span>
              <strong className="text-sm font-mono text-indigo-800">{batch.processing_jobs}</strong>
            </div>
            <div className="p-2.5 bg-slate-100 rounded-lg text-center">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Trong hàng đợi</span>
              <strong className="text-sm font-mono text-slate-700">{batch.queued_jobs}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Child Replacement Jobs Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider px-1">
          Chi tiết từng video sản phẩm ({jobs.length})
        </h3>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
          {jobs.map((job, idx) => {
            const isCompleted = job.status === 'COMPLETED' || job.status === 'NEEDS_REVIEW';
            const isFailed = job.status === 'FAILED' || job.status === 'BLOCKED';
            const isRunning = !isCompleted && !isFailed && job.status !== 'CANCELLED' && job.status !== 'PENDING';
            const thumbUrl = replacementService.resolveMediaUrl(job.output_thumbnail_url);

            return (
              <div
                key={job.job_id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                {/* Left: Thumbnail & Product info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-14 rounded-lg bg-slate-900 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200 relative group">
                    {thumbUrl ? (
                      <img src={thumbUrl} alt={job.product_title} className="w-full h-full object-cover" />
                    ) : (
                      <Shirt className="w-5 h-5 text-slate-400" />
                    )}

                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() => setPreviewJob(job)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                        title="Xem nhanh video"
                      >
                        <Play className="w-5 h-5 fill-white" />
                      </button>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[280px]">
                        {idx + 1}. {job.product_title}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isFailed
                            ? 'bg-rose-100 text-rose-800'
                            : isRunning
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[380px]">
                      {job.current_step || 'Đang chuẩn bị dữ liệu...'}
                    </p>

                    {isFailed && (
                      <p className="text-[11px] text-rose-700 font-semibold mt-0.5">
                        Lỗi: {job.error_message || 'Xử lý thất bại'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Progress & Action buttons */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-indigo-600">
                      {Math.round(job.progress)}%
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {job.job_id.slice(0, 10)}...
                    </span>
                  </div>

                  {isCompleted && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPreviewJob(job)}
                      className="text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 gap-1"
                    >
                      <Play className="w-3.5 h-3.5" /> Xem video
                    </Button>
                  )}

                  {isFailed && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onRetryJob(job.job_id)}
                      className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Thử lại
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Video Preview Modal */}
      {previewJob && (
        <Dialog
          isOpen={true}
          onClose={() => setPreviewJob(null)}
          title={`Video thành phẩm: ${previewJob.product_title}`}
          description={`Thời lượng: ${(previewJob.duration_ms || 5000) / 1000}s • Độ phân giải: 1080x1920 (9:16)`}
          maxWidth="max-w-[540px]"
        >
          <div className="space-y-4">
            <div className="bg-black rounded-xl overflow-hidden aspect-[9/16] max-h-[540px] mx-auto flex items-center justify-center">
              <video
                src={replacementService.resolveMediaUrl(previewJob.output_video_url)}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setPreviewJob(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
