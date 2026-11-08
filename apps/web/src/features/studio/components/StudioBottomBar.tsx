import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  User,
  Clapperboard,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StudioStep, CompatibilityCheckResponse } from '../types/studio.types';
import { ModelProfileSummary } from '@/features/models';
import { TemplateSummary } from '@/features/library';

interface StudioBottomBarProps {
  currentStep: StudioStep;
  selectedModel: ModelProfileSummary | null;
  selectedTemplate: TemplateSummary | null;
  compatibility: CompatibilityCheckResponse | null;
  activeProjectName?: string | null;
  isCreatingGeneration: boolean;
  onNext: () => void;
  onBack: () => void;
  onStartGeneration: () => void;
}

export const StudioBottomBar: React.FC<StudioBottomBarProps> = ({
  currentStep,
  selectedModel,
  selectedTemplate,
  compatibility,
  activeProjectName,
  isCreatingGeneration,
  onNext,
  onBack,
  onStartGeneration,
}) => {
  return (
    <div className="fixed bottom-0 right-0 left-0 lg:left-[var(--sidebar-w,252px)] z-50 bg-white/98 backdrop-blur-md border-t-2 border-[#654B7B]/20 px-4 sm:px-7 lg:px-8 py-3.5 shadow-[0_-6px_25px_rgba(0,0,0,0.15)] transition-[left] duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* LEFT SECTION: Back button & Current Status */}
        <div className="flex items-center gap-3 min-w-0">
          {currentStep !== 'model' && currentStep !== 'processing' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onBack}
              className="gap-1.5 shrink-0 text-xs font-semibold text-[#242321] border-[#D6D2CC]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </Button>
          )}

          {/* Contextual Status Tag */}
          <div className="hidden sm:flex items-center gap-2 text-xs truncate">
            {currentStep === 'model' && (
              selectedModel ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Đã chọn người mẫu: <strong className="text-slate-900">{selectedModel.displayName}</strong>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-medium border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Hãy click vào một người mẫu ở trên để chọn
                </span>
              )
            )}

            {currentStep === 'template' && (
              selectedTemplate ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Đã chọn video: <strong className="text-slate-900">{selectedTemplate.title}</strong>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-medium border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Hãy click vào một video mẫu ở trên để chọn
                </span>
              )
            )}

            {currentStep === 'confirm' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#654B7B]/10 text-[#654B7B] font-medium border border-[#654B7B]/20">
                <User className="w-3.5 h-3.5" />
                {selectedModel?.displayName}
                <span className="text-[#A3A09B]">•</span>
                <Clapperboard className="w-3.5 h-3.5" />
                {selectedTemplate?.title}
              </span>
            )}

            {['result', 'products', 'replacement'].includes(currentStep) && activeProjectName && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Dự án: <strong className="text-slate-900">{activeProjectName}</strong>
              </span>
            )}
          </div>
        </div>

        {/* RIGHT SECTION: PRIMARY NEXT ACTION BUTTON */}
        <div className="flex items-center gap-2 shrink-0">
          {currentStep === 'model' && (
            <Button
              variant="primary"
              onClick={onNext}
              disabled={!selectedModel}
              className={`gap-2 font-semibold px-5 py-2.5 text-sm transition-all shadow-sm ${
                selectedModel
                  ? 'bg-[#654B7B] hover:bg-[#523C64] text-white active:scale-98'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Tiếp tục: Sang bước 2 (Chọn video mẫu)</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          {currentStep === 'template' && (
            <Button
              variant="primary"
              onClick={onNext}
              disabled={!selectedTemplate}
              className={`gap-2 font-semibold px-5 py-2.5 text-sm transition-all shadow-sm ${
                selectedTemplate
                  ? 'bg-[#654B7B] hover:bg-[#523C64] text-white active:scale-98'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Tiếp tục: Sang bước 3 (Kiểm tra tương thích)</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          {currentStep === 'confirm' && (
            <Button
              variant="primary"
              onClick={onStartGeneration}
              disabled={!compatibility?.canGenerate || isCreatingGeneration}
              className="gap-2 font-semibold px-6 py-2.5 text-sm bg-[#654B7B] hover:bg-[#523C64] text-white shadow-sm active:scale-98"
            >
              {isCreatingGeneration ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang khởi tạo dự án...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Tạo dự án & Bắt đầu tạo video</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}

          {currentStep === 'result' && (
            <Button
              variant="primary"
              onClick={onNext}
              className="gap-2 font-semibold px-6 py-2.5 text-sm bg-[#654B7B] hover:bg-[#523C64] text-white shadow-sm active:scale-98"
            >
              <span>Tiếp tục: Sang bước 6 (Nhập sản phẩm)</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          {currentStep === 'products' && (
            <Button
              variant="primary"
              onClick={onNext}
              className="gap-2 font-semibold px-6 py-2.5 text-sm bg-[#654B7B] hover:bg-[#523C64] text-white shadow-sm active:scale-98"
            >
              <span>Tiếp tục: Sang bước 7 (Thay trang phục)</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
