import React from 'react';
import {
  Loader2,
  CheckCircle2,
  XCircle,
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

  // Step phases tracking
  const phases = [
    {
      key: 'VALIDATING',
      name: 'Kiểm tra dữ liệu đầu vào',
      description: 'Xác minh hồ sơ người mẫu, ảnh tham chiếu và source video mẫu từ Local Storage.',
    },
    {
      key: 'PROCESSING',
      name: 'Tổng hợp video cá nhân hóa',
      description: 'Đưa người mẫu AI vào video mẫu bằng pipeline FFmpeg xử lý cục bộ.',
    },
    {
      key: 'QUALITY_REVIEW',
      name: 'Kiểm tra chất lượng tự động',
      description: 'Phân tích dữ liệu luồng FFprobe, kiểm tra độ sắc nét khuôn mặt và tính toàn vẹn.',
    },
  ];

  const getPhaseStatus = (phaseKey: string) => {
    if (isCompleted) return 'done';
    if (isFailed || isCancelled) {
      if (generation.status === phaseKey) return 'error';
      return 'pending';
    }
    if (generation.status === phaseKey) return 'active';

    const order = ['VALIDATING', 'PROCESSING', 'QUALITY_REVIEW'];
    const currentIdx = order.indexOf(generation.status);
    const phaseIdx = order.indexOf(phaseKey);

    if (currentIdx > phaseIdx) return 'done';
    return 'pending';
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-slate-900">
          {isCompleted
            ? 'Đã hoàn tất tổng hợp video!'
            : isFailed
            ? 'Quá trình tổng hợp gặp sự cố'
            : isCancelled
            ? 'Đã hủy quá trình tổng hợp'
            : 'Đang tiến hành tạo Personalized Base Video'}
        </h2>
        <p className="text-sm text-slate-600">
          {isCompleted
            ? 'Video nền cá nhân hóa đã được tạo thành công và vượt qua vòng kiểm tra chất lượng.'
            : isFailed
            ? 'Hệ thống đã ghi nhận lỗi và bảo toàn các tệp tin an toàn.'
            : 'Hệ thống đang thực hiện tổng hợp cục bộ bằng Local Processing Pipeline. Vui lòng giữ trang để theo dõi.'}
        </p>
      </div>

      {/* Main Status & Progress Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Progress Bar & Percentage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-800 flex items-center gap-2">
              {!isCompleted && !isFailed && !isCancelled && (
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
              )}
              {generation.currentStep || 'Đang khởi chạy...'}
            </span>
            <span className="font-mono font-bold text-indigo-600 text-base">
              {generation.progress}%
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isCompleted
                  ? 'bg-emerald-500'
                  : isFailed
                  ? 'bg-rose-500'
                  : isCancelled
                  ? 'bg-slate-400'
                  : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.max(5, Math.min(100, generation.progress))}%` }}
            />
          </div>
        </div>

        {/* Phase Timeline Cards */}
        <div className="space-y-3 pt-2">
          {phases.map((ph, idx) => {
            const phaseStatus = getPhaseStatus(ph.key);

            return (
              <div
                key={ph.key}
                className={`p-4 rounded-xl border transition-colors flex items-start gap-3.5 ${
                  phaseStatus === 'active'
                    ? 'bg-indigo-50/50 border-indigo-200'
                    : phaseStatus === 'done'
                    ? 'bg-emerald-50/30 border-emerald-200'
                    : phaseStatus === 'error'
                    ? 'bg-rose-50/40 border-rose-200'
                    : 'bg-slate-50/60 border-slate-100 opacity-60'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {phaseStatus === 'done' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : phaseStatus === 'active' ? (
                    <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  ) : phaseStatus === 'error' ? (
                    <XCircle className="w-5 h-5 text-rose-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 text-slate-400 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900">{ph.name}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{ph.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error Box if Failed */}
        {isFailed && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-rose-900 font-semibold text-sm">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              Chi tiết lỗi xử lý
            </div>
            <p className="text-xs text-rose-700 font-mono bg-white/70 p-2.5 rounded border border-rose-100">
              {generation.errorMessage || 'Lỗi không xác định trong quá trình tổng hợp video.'}
            </p>
            {generation.errorCode && (
              <span className="text-[11px] text-rose-500 font-mono">
                Mã lỗi: {generation.errorCode}
              </span>
            )}
          </div>
        )}

        {/* Generation Metadata */}
        <div className="border-t border-slate-100 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-500">
          <div>
            <span className="block text-slate-400">Mã tiến trình:</span>
            <span className="font-mono text-slate-700 truncate block">
              {generation.generationId}
            </span>
          </div>
          <div>
            <span className="block text-slate-400">Người mẫu:</span>
            <span className="font-medium text-slate-700 truncate block">
              {generation.modelName}
            </span>
          </div>
          <div>
            <span className="block text-slate-400">Video mẫu:</span>
            <span className="font-medium text-slate-700 truncate block">
              {generation.templateTitle}
            </span>
          </div>
          <div>
            <span className="block text-slate-400">Dự án:</span>
            <span className="font-medium text-slate-700 truncate block">
              {generation.projectName}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <div>
          {!isCompleted && !isFailed && !isCancelled && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onCancel}
              disabled={isCancelling}
              className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
            >
              <StopCircle className="w-4 h-4" />
              {isCancelling ? 'Đang hủy...' : 'Hủy tiến trình'}
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
              {isRetrying ? 'Đang thử lại...' : 'Thử lại bước này'}
            </Button>
          )}
        </div>

        {isCompleted && (
          <Button
            variant="primary"
            onClick={onViewResult}
            className="gap-2 ml-auto"
          >
            Xem kết quả & Kiểm định
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
