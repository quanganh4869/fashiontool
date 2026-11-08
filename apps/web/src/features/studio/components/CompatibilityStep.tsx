import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  User,
  Clapperboard,
  RefreshCw,
  FolderPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ModelProfileSummary } from '@/features/models';
import { TemplateSummary } from '@/features/library';
import { CompatibilityCheckResponse } from '../types/studio.types';
import { studioService } from '../services/studio.service';

interface CompatibilityStepProps {
  model: ModelProfileSummary;
  template: TemplateSummary;
  compatibility: CompatibilityCheckResponse | null;
  isLoading: boolean;
  error?: string | null;
  onRetryCheck: () => void;
  onChangeModel: () => void;
  onChangeTemplate: () => void;
  onBack: () => void;
  onStartGeneration: (projectName: string, confirmedLimitations: boolean) => void;
  isCreating: boolean;
}

export const CompatibilityStep: React.FC<CompatibilityStepProps> = ({
  model,
  template,
  compatibility,
  isLoading,
  error,
  onRetryCheck,
  onChangeModel,
  onChangeTemplate,
  onBack,
  onStartGeneration,
  isCreating,
}) => {
  const defaultProjectName = `${model.displayName} - ${template.title}`;
  const [projectName, setProjectName] = useState(defaultProjectName);
  const [confirmedLimitations, setConfirmedLimitations] = useState(false);

  const status = compatibility?.status ?? 'NOT_ASSESSED';
  const badgeConfig = studioService.getCompatibilityBadgeConfig(status);

  // Can only generate if:
  // 1. Not loading & no error
  // 2. status is SUPPORTED or (status is LIMITED and user checked confirmedLimitations)
  const canGenerate =
    !isLoading &&
    !error &&
    compatibility &&
    compatibility.canGenerate &&
    (status !== 'LIMITED' || confirmedLimitations);

  return (
    <div className="space-y-6 pb-28">
      <div>
        <h2 className="text-lg font-bold text-slate-900">3. Kiểm tra tương thích & Xác nhận</h2>
        <p className="text-sm text-slate-600">
          Đánh giá mức độ phù hợp giữa khuôn mặt, góc nhìn người mẫu và yêu cầu khung hình, độ che khuất của video mẫu.
        </p>
      </div>

      {/* Selected Items Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Model Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 items-center">
          <div className="w-16 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
            {model.coverImageUrl ? (
              <img
                src={model.coverImageUrl}
                alt={model.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <User className="w-6 h-6" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Hồ sơ người mẫu
            </span>
            <h4 className="font-bold text-slate-900 text-sm truncate mt-0.5">
              {model.displayName}
            </h4>
            <p className="text-xs text-slate-500">
              v{model.modelVersion} • {model.referenceAssetsCount} ảnh tham chiếu
            </p>
            <button
              type="button"
              onClick={onChangeModel}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1 inline-block"
            >
              Đổi người mẫu khác
            </button>
          </div>
        </div>

        {/* Template Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 items-center">
          <div className="w-16 h-20 rounded-lg overflow-hidden bg-[#F6F5F2] flex-shrink-0 border border-[#E8E5E0]">
            {template.posterUrl ? (
              <img
                src={template.posterUrl}
                alt={template.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                <Clapperboard className="w-6 h-6" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Video mẫu
            </span>
            <h4 className="font-bold text-slate-900 text-sm truncate mt-0.5">
              {template.title}
            </h4>
            <p className="text-xs text-slate-500">
              {template.categoryName} • Tỉ lệ {template.aspectRatio} • {studioService.formatDuration(template.durationMs)}
            </p>
            <button
              type="button"
              onClick={onChangeTemplate}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1 inline-block"
            >
              Đổi video mẫu khác
            </button>
          </div>
        </div>
      </div>

      {/* Compatibility Status Banner */}
      {isLoading ? (
        <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-700">
            Đang phân tích và kiểm tra tính tương thích giữa người mẫu và video mẫu...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-rose-800 font-semibold text-sm">
            <XCircle className="w-5 h-5 text-rose-600" />
            Không thể đánh giá tương thích
          </div>
          <p className="text-sm text-rose-700">{error}</p>
          <Button variant="secondary" size="sm" onClick={onRetryCheck}>
            Thử lại kiểm tra
          </Button>
        </div>
      ) : compatibility ? (
        <div className="space-y-4">
          <div
            className={`p-5 rounded-xl border ${badgeConfig.bgClass} ${badgeConfig.borderClass} space-y-3`}
          >
            <div className="flex items-start gap-3">
              {status === 'SUPPORTED' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : status === 'LIMITED' ? (
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              ) : status === 'UNSUPPORTED' ? (
                <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
              ) : (
                <HelpCircle className="w-6 h-6 text-slate-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-base">
                    Kết quả đánh giá:
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded border ${badgeConfig.bgClass} ${badgeConfig.textClass} ${badgeConfig.borderClass}`}
                  >
                    {badgeConfig.label}
                  </span>
                </div>

                {status === 'SUPPORTED' && (
                  <p className="text-sm text-slate-700">
                    Người mẫu và video mẫu tương thích hoàn toàn. Hệ thống sẵn sàng tổng hợp Personalized Base Video với chất lượng hình ảnh tối ưu.
                  </p>
                )}

                {status === 'LIMITED' && (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-800 font-medium">
                      Cặp mẫu này có một số hạn chế kỹ thuật:
                    </p>
                    <ul className="list-disc list-inside text-xs text-amber-900 space-y-1 pl-1">
                      {compatibility.warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {status === 'UNSUPPORTED' && (
                  <div className="space-y-2">
                    <p className="text-sm text-rose-900 font-semibold">
                      Không thể tiến hành tạo video do các nguyên nhân sau:
                    </p>
                    <ul className="list-disc list-inside text-xs text-rose-800 space-y-1 pl-1">
                      {compatibility.blockingReasons.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Checkbox confirmation for LIMITED status */}
            {status === 'LIMITED' && (
              <div className="mt-4 pt-4 border-t border-amber-200/60">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmedLimitations}
                    onChange={(e) => setConfirmedLimitations(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-amber-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-amber-950">
                    Tôi đã nắm rõ các lưu ý kỹ thuật này và đồng ý tiếp tục tạo Personalized Base Video.
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Granular Checklist Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Chi tiết tiêu chuẩn kiểm tra tương thích
              </h4>
              <span className="text-xs text-slate-500">
                {compatibility.checks.length} tiêu chí
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {compatibility.checks.map((chk) => {
                const itemBadge = studioService.getCompatibilityBadgeConfig(chk.status);
                return (
                  <div
                    key={chk.key}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-800 text-sm">
                        {chk.name}
                      </span>
                      <p className="text-xs text-slate-600">{chk.message}</p>
                    </div>

                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded border self-start sm:self-center ${itemBadge.bgClass} ${itemBadge.textClass} ${itemBadge.borderClass}`}
                    >
                      {itemBadge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Project Name Settings */}
      <div className="bg-white border border-[#E8E5E0] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <FolderPlus className="w-4 h-4 text-[#654B7B]" />
          <h4 className="text-sm font-bold text-slate-900">Thiết lập tên dự án mới</h4>
        </div>
        <p className="text-xs text-slate-600">
          Video nền khi tạo xong sẽ được tự động lưu vào dự án này để tiếp tục sang các bước ghép sản phẩm và thay đổi trang phục.
        </p>

        <div className="max-w-md">
          <Input
            label="Tên dự án mới sẽ tạo"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Nhập tên dự án..."
          />
        </div>
      </div>

      {/* Pinned Bottom Navigation */}
      <div className="fixed bottom-0 right-0 left-0 lg:left-[var(--sidebar-w,252px)] z-30 bg-white/95 backdrop-blur-md border-t border-[#E8E5E0] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-[left] duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-7 lg:px-8 py-3.5 flex items-center justify-between">
          <Button variant="secondary" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Quay lại: Chọn video mẫu
          </Button>

          <Button
            variant="primary"
            onClick={() => onStartGeneration(projectName, confirmedLimitations)}
            disabled={!canGenerate || isCreating}
            className="gap-2 shadow-sm font-semibold px-6 py-2.5 bg-[#654B7B] hover:bg-[#523C64] text-white"
          >
            {isCreating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Đang tạo dự án & khởi tạo video...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Tạo dự án & Bắt đầu tạo video</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
