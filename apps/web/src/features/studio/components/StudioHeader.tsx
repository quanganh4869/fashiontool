import React from 'react';
import { Sparkles, ArrowLeft, PlusCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface StudioHeaderProps {
  onBackToDashboard: () => void;
  onNewProject: () => void;
  activeProjectName?: string | null;
  onNext?: () => void;
  canNext?: boolean;
  nextLabel?: string;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  onBackToDashboard,
  onNewProject,
  activeProjectName,
  onNext,
  canNext = true,
  nextLabel,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E5E0]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF9F5] hover:bg-[#E8E5E0] text-[#242321] border border-[#D6D2CC] rounded-xl text-xs font-semibold transition-all shadow-xs"
          title="Quay lại danh sách dự án"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Danh sách dự án
        </button>

        <div className="h-4 w-px bg-[#E8E5E0] hidden sm:block" />

        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#654B7B]/10 text-[#654B7B] rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#242321] tracking-tight">
              {activeProjectName ? `Dự án: ${activeProjectName}` : 'Tạo dự án video mới'}
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5 text-xs text-[#242321] hover:text-black border-[#D6D2CC]"
          onClick={onNewProject}
          title="Bắt đầu lại từ bước 1 để tạo video mới"
        >
          <PlusCircle className="w-3.5 h-3.5 text-[#654B7B]" />
          Tạo dự án mới
        </Button>

        {onNext && nextLabel && (
          <Button
            variant="primary"
            size="sm"
            disabled={!canNext}
            onClick={onNext}
            className={`gap-1.5 text-xs font-semibold shadow-xs transition-all ${
              canNext
                ? 'bg-[#654B7B] hover:bg-[#523C64] text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>{nextLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};
