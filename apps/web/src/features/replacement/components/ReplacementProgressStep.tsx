import React from 'react';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Cpu,
  Clock,
  Sparkles,
  Shirt,
  Layers,
  Film,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReplacementJobResponse, ReplacementJobStatus } from '../types/replacement.types';

export interface ReplacementProgressStepProps {
  job: ReplacementJobResponse;
  onCancel?: () => void;
  onRetry?: () => void;
  onViewResult?: () => void;
  isCancelling?: boolean;
}

interface PipelineStage {
  key: ReplacementJobStatus[];
  title: string;
  description: string;
  icon: React.ElementType;
}

const STAGES: PipelineStage[] = [
  {
    key: ['PENDING', 'VALIDATING_INPUTS'],
    title: '1. Khởi tạo & Kiểm tra điều kiện',
    description: 'Đối chiếu Model Base Video, Product Asset và quy cách Product Truth Sheet.',
    icon: ShieldCheck,
  },
  {
    key: ['ANALYZING_BASE_VIDEO', 'SEGMENTING_GARMENT'],
    title: '2. Phân tích & Phân đoạn trang phục',
    description: 'Giải mã frames, tách vùng áo cũ đồng thời bảo vệ 100% khuôn mặt, tóc, cổ và bàn tay.',
    icon: Layers,
  },
  {
    key: ['TRACKING_GARMENT', 'PREPARING_PRODUCT', 'BUILDING_CONSTRAINTS'],
    title: '3. Tracking & Định vị cấu trúc sản phẩm',
    description: 'Xác định đường nẹp áo, cổ nhọn, túi ngực trái và neo giữ đúng 6 cúc áo theo chuyển động.',
    icon: Shirt,
  },
  {
    key: ['GENERATING_FRAMES', 'COMPOSITING', 'TEMPORAL_CHECK'],
    title: '4. Thay trang phục & Xử lý che khuất (Occlusion)',
    description: 'Tổng hợp sắc trắng, họa tiết vải và tái ghép lớp tóc/bàn tay đè lên áo, khử nhấp nháy.',
    icon: Sparkles,
  },
  {
    key: ['RENDERING', 'QUALITY_REVIEW', 'COMPLETED'],
    title: '5. Đóng gói MP4 & Kiểm định 10 tiêu chí',
    description: 'Xuất video H.264, tạo contact sheet 8 frame và chấm điểm chất lượng tự động.',
    icon: Film,
  },
];

export const ReplacementProgressStep: React.FC<ReplacementProgressStepProps> = ({
  job,
  onCancel,
  onRetry,
  onViewResult,
  isCancelling = false,
}) => {
  const isFailed = job.status === 'FAILED' || job.status === 'BLOCKED';
  const isCompleted = job.status === 'COMPLETED' || job.status === 'NEEDS_REVIEW';

  const getStageStatus = (stage: PipelineStage, currentStatus: ReplacementJobStatus) => {
    if (isFailed) return 'failed';
    const currentIdx = STAGES.findIndex((s) => s.key.includes(currentStatus));
    const stageIdx = STAGES.indexOf(stage);

    if (stageIdx < currentIdx || isCompleted) return 'completed';
    if (stageIdx === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-2">
              <Cpu className="w-3.5 h-3.5" />
              <span>Backend Local AI Processing Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Đang thực hiện thay thế trang phục
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Đang thay trang phục áo sơ mi cho người mẫu{' '}
              <span className="font-semibold text-slate-700">{job.model_name}</span> bằng sản phẩm{' '}
              <span className="font-semibold text-slate-700">{job.product_title}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isCompleted && (
              <Button onClick={onViewResult} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Xem kết quả video
              </Button>
            )}
            {isFailed && onRetry && (
              <Button onClick={onRetry} className="bg-rose-600 hover:bg-rose-700 text-white">
                Thử lại xử lý
              </Button>
            )}
            {!isCompleted && !isFailed && onCancel && (
              <Button
                variant="secondary"
                onClick={onCancel}
                disabled={isCancelling}
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                {isCancelling ? 'Đang hủy...' : 'Hủy tác vụ'}
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar & Current Status */}
        <div className="pt-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700 flex items-center gap-2">
              {!isCompleted && !isFailed && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />}
              {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {isFailed && <AlertCircle className="w-4 h-4 text-rose-600" />}
              {job.current_step || 'Đang khởi tạo pipeline...'}
            </span>
            <span className="font-mono font-bold text-indigo-600 text-base">
              {Math.round(job.progress)}%
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFailed
                  ? 'bg-rose-500'
                  : isCompleted
                  ? 'bg-emerald-500'
                  : 'bg-linear-to-r from-indigo-500 to-indigo-600'
              }`}
              style={{ width: `${Math.max(5, Math.min(100, job.progress))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Khởi tạo lúc: {new Date(job.created_at).toLocaleTimeString('vi-VN')}
            </span>
            <span className="font-mono">Mã Job: {job.job_id.slice(0, 16)}...</span>
          </div>
        </div>

        {/* Failure Message */}
        {isFailed && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-900">
                Xử lý không thành công: {job.error_code || 'Lỗi không xác định'}
              </p>
              <p className="text-xs text-rose-700 mt-1">
                {job.error_message || 'Vui lòng kiểm tra lại cấu hình tài nguyên hoặc tài nguyên base video.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 5 Sequential Stages Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider px-1">
          Quy trình xử lý cục bộ chuyên sâu
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {STAGES.map((stage, idx) => {
            const status = getStageStatus(stage, job.status);
            const Icon = stage.icon;

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all flex items-start gap-4 ${
                  status === 'completed'
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : status === 'active'
                    ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                    : status === 'failed'
                    ? 'bg-rose-50/40 border-rose-200'
                    : 'bg-white border-slate-200 opacity-60'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    status === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : status === 'active'
                      ? 'bg-indigo-600 text-white animate-pulse'
                      : status === 'failed'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-sm font-bold ${
                        status === 'completed'
                          ? 'text-emerald-900'
                          : status === 'active'
                          ? 'text-indigo-900'
                          : status === 'failed'
                          ? 'text-rose-900'
                          : 'text-slate-700'
                      }`}
                    >
                      {stage.title}
                    </h4>

                    {status === 'completed' && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Hoàn thành
                      </span>
                    )}
                    {status === 'active' && (
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Đang xử lý
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{stage.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety & Local Processing Notice */}
      <div className="p-4 bg-slate-100/80 rounded-xl border border-slate-200 text-slate-600 text-xs flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
        <p>
          Hệ thống đảm bảo xử lý 100% cục bộ trên phần cứng máy chủ Backend thông qua PyTorch, ONNX
          Runtime và OpenCV. Không truyền hình ảnh người mẫu, dữ liệu pose hay video ra bất kỳ dịch vụ
          AI bên thứ ba nào.
        </p>
      </div>
    </div>
  );
};
