import React from 'react';
import {
  Loader2,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  ArrowRight,
  StopCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModelTemplateGeneration } from '../types/studio.types';

interface GenerationProgressStepProps {
  generation: ModelTemplateGeneration;
  onCancel: () => void;
  onRetry: () => void;
  onViewResult: () => void;
  isCancelling: boolean;
  isRetrying: boolean;
}

export const GenerationProgressStep: React.FC<GenerationProgressStepProps> = ({
  generation,
  onCancel,
  onRetry,
  onViewResult,
  isCancelling,
  isRetrying,
}) => {
  const isFailed = generation.status === 'FAILED';
  const isCancelled = generation.status === 'CANCELLED';
  const isCompleted = generation.status === 'COMPLETED';

  const progressValue = Math.max(0, Math.min(100, Math.round(generation.progress || 0)));

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      {/* Main Clean Progress Card */}
      <div className="bg-white border border-[#E8E5E0] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isCompleted && !isFailed && !isCancelled && (
              <Loader2 className="w-5 h-5 text-[#654B7B] animate-spin" />
            )}
            {isCompleted && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
            {isFailed && (
              <AlertOctagon className="w-5 h-5 text-rose-600" />
            )}
            <h3 className="text-base font-semibold text-[#242321]">
              {isCompleted
                ? 'Đã tạo video thành công'
                : isFailed
                ? 'Quá trình xử lý bị lỗi'
                : isCancelled
                ? 'Đã hủy xử lý'
                : 'Đang xử lý video'}
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
                : isCancelled
                ? 'bg-slate-400'
                : 'bg-[#654B7B]'
            }`}
            style={{ width: `${Math.max(4, progressValue)}%` }}
          />
        </div>

        {/* Current concise status */}
        <div className="text-xs text-[#74716D] font-medium flex items-center justify-between">
          <span>{generation.currentStep || 'Đang xử lý...'}</span>
          <span>{generation.modelName} • {generation.templateTitle}</span>
        </div>

        {/* Error Box if Failed */}
        {isFailed && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-xs text-rose-800">
            <span className="font-semibold block">Lỗi:</span>
            <p className="font-mono">{generation.errorMessage || 'Lỗi không xác định.'}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div>
          {!isCompleted && !isFailed && !isCancelled && (
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

          {isFailed && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onRetry}
              disabled={isRetrying}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              Thử lại
            </Button>
          )}
        </div>

        {isCompleted && (
          <Button
            variant="primary"
            onClick={onViewResult}
            className="gap-2 ml-auto shadow-sm"
          >
            <span>Xem kết quả</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
