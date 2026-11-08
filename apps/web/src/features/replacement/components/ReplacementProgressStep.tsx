import React from 'react';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  StopCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReplacementJobResponse } from '../types/replacement.types';

export interface ReplacementProgressStepProps {
  job: ReplacementJobResponse;
  onCancel?: () => void;
  onRetry?: () => void;
  onViewResult?: () => void;
  isCancelling?: boolean;
}

export const ReplacementProgressStep: React.FC<ReplacementProgressStepProps> = ({
  job,
  onCancel,
  onRetry,
  onViewResult,
  isCancelling = false,
}) => {
  const isFailed = job.status === 'FAILED' || job.status === 'BLOCKED';
  const isCompleted = job.status === 'COMPLETED' || job.status === 'NEEDS_REVIEW';
  const progressValue = Math.max(0, Math.min(100, Math.round(job.progress || 0)));

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      {/* Main Clean Card */}
      <div className="bg-white border border-[#E8E5E0] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isCompleted && !isFailed && (
              <Loader2 className="w-5 h-5 text-[#654B7B] animate-spin" />
            )}
            {isCompleted && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
            {isFailed && (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <h3 className="text-base font-semibold text-[#242321]">
              {isCompleted
                ? 'Đã thay trang phục thành công'
                : isFailed
                ? 'Quá trình thay trang phục bị lỗi'
                : 'Đang thay trang phục cho video'}
            </h3>
          </div>

          <span className="font-mono font-bold text-2xl text-[#654B7B]">
            {progressValue}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3.5 bg-[#F0EDE8] rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isCompleted
                ? 'bg-emerald-500'
                : isFailed
                ? 'bg-rose-500'
                : 'bg-[#654B7B]'
            }`}
            style={{ width: `${Math.max(4, progressValue)}%` }}
          />
        </div>

        {/* Current status */}
        <div className="text-xs text-[#74716D] font-medium flex items-center justify-between">
          <span>{job.current_step || 'Đang xử lý...'}</span>
          <span>{job.model_name} • {job.product_title}</span>
        </div>

        {/* Failure Message */}
        {isFailed && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-xs text-rose-800">
            <span className="font-semibold block">
              Lỗi: {job.error_code || 'Lỗi không xác định'}
            </span>
            <p className="font-mono">{job.error_message || 'Có lỗi xảy ra trong quá trình xử lý.'}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div>
          {!isCompleted && !isFailed && onCancel && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onCancel}
              disabled={isCancelling}
              className="gap-2 text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <StopCircle className="w-4 h-4" />
              {isCancelling ? 'Đang hủy...' : 'Hủy'}
            </Button>
          )}

          {isFailed && onRetry && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onRetry}
              className="gap-2"
            >
              Thử lại
            </Button>
          )}
        </div>

        {isCompleted && onViewResult && (
          <Button
            variant="primary"
            onClick={onViewResult}
            className="gap-2 ml-auto shadow-sm"
          >
            <span>Xem kết quả</span>
          </Button>
        )}
      </div>
    </div>
  );
};
