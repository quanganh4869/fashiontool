import React from 'react';
import {
  ShieldCheck,
  FileCode2,
  ImageDown,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ExtractionJobResponse } from '../types/product.types';

interface ProductExtractionProgressProps {
  job: ExtractionJobResponse;
  onCancel?: () => void;
  isCancelling?: boolean;
}

interface StepDef {
  key: string;
  name: string;
  description: string;
  icon: React.ElementType;
}

const STEPS: StepDef[] = [
  {
    key: 'ANALYZING_URL',
    name: 'Kiểm tra an toàn liên kết',
    description: 'Bảo vệ SSRF, lọc subnet nội bộ và xác minh DNS an toàn',
    icon: ShieldCheck,
  },
  {
    key: 'FETCHING_METADATA',
    name: 'Trích xuất dữ liệu sản phẩm',
    description: 'Quét Schema JSON-LD, thẻ OpenGraph và phân tích HTML ngữ nghĩa',
    icon: FileCode2,
  },
  {
    key: 'DOWNLOADING_IMAGES',
    name: 'Tải & lưu trữ ảnh gốc',
    description: 'Kiểm tra magic bytes, tính SHA-256 và lưu Local Filesystem',
    icon: ImageDown,
  },
  {
    key: 'COMPLETED',
    name: 'Hoàn tất tài nguyên',
    description: 'Sẵn sàng xem trước và xác nhận đưa vào dự án',
    icon: CheckCircle2,
  },
];

export const ProductExtractionProgress: React.FC<ProductExtractionProgressProps> = ({
  job,
  onCancel,
  isCancelling = false,
}) => {
  const isFailed = job.status === 'FAILED';
  const isCancelled = job.status === 'CANCELLED';

  const getStepStatus = (_stepKey: string, index: number) => {
    if (isFailed || isCancelled) return 'failed';

    const orderMap: Record<string, number> = {
      PENDING: 0,
      ANALYZING_URL: 0,
      FETCHING_METADATA: 1,
      DOWNLOADING_IMAGES: 2,
      COMPLETED: 3,
      PARTIAL: 3,
    };

    const currentOrder = orderMap[job.status] ?? 0;

    if (currentOrder > index) return 'done';
    if (currentOrder === index) return 'active';
    return 'pending';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            {isFailed ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {isFailed
                ? 'Trích xuất thất bại'
                : isCancelled
                ? 'Đã hủy quá trình trích xuất'
                : 'Đang tiến hành trích xuất dữ liệu sản phẩm...'}
            </h4>
            <p className="text-xs text-slate-500 font-mono truncate max-w-md mt-0.5">
              {job.source_url}
            </p>
          </div>
        </div>

        {onCancel && !isFailed && !isCancelled && job.status !== 'COMPLETED' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            isLoading={isCancelling}
            className="text-xs text-slate-500 hover:text-red-600 gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Hủy
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-600 font-medium">
          <span className="truncate pr-2">{job.current_step || 'Đang khởi tạo...'}</span>
          <span className="font-mono text-indigo-600 font-semibold">{job.progress}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isFailed
                ? 'bg-red-500'
                : isCancelled
                ? 'bg-slate-400'
                : 'bg-indigo-600'
            }`}
            style={{ width: `${Math.max(5, Math.min(100, job.progress))}%` }}
          />
        </div>
      </div>

      {/* 4 Steps Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        {STEPS.map((step, idx) => {
          const stepStatus = getStepStatus(step.key, idx);
          const Icon = step.icon;

          return (
            <div
              key={step.key}
              className={`p-3 rounded-lg border text-xs transition-all ${
                stepStatus === 'done'
                  ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                  : stepStatus === 'active'
                  ? 'bg-indigo-50/60 border-indigo-300 text-slate-900 shadow-xs ring-1 ring-indigo-200'
                  : 'bg-slate-50/60 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`p-1 rounded-md ${
                    stepStatus === 'done'
                      ? 'bg-emerald-100 text-emerald-700'
                      : stepStatus === 'active'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {stepStatus === 'done' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : stepStatus === 'active' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </span>
                <span className="font-semibold text-[11px] truncate">{step.name}</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Error Message if Failed */}
      {isFailed && job.error_message && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>Lỗi trích xuất ({job.error_code || 'EXTRACTION_ERROR'})</span>
          </div>
          <p className="text-[11px] text-red-600">{job.error_message}</p>
        </div>
      )}
    </div>
  );
};
