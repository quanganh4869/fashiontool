import React, { useRef, useEffect } from 'react';
import {
  RotateCcw,
  Download,
  FolderKanban,
  CheckCircle2,
  Film,
  ArrowRight,
  Package,
  User,
  Clapperboard,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModelTemplateGeneration } from '../types/studio.types';
import { studioService } from '../services/studio.service';

interface GenerationResultStepProps {
  generation: ModelTemplateGeneration;
  onCreateNewVersion: () => void;
  onOpenProjects: () => void;
  onProceedToProducts?: () => void;
}

export const GenerationResultStep: React.FC<GenerationResultStepProps> = ({
  generation,
  onCreateNewVersion,
  onOpenProjects,
  onProceedToProducts,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = studioService.resolveMediaUrl(generation.outputVideoUrl);

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.muted = true;
          videoRef.current.removeAttribute('src');
          videoRef.current.load();
        } catch {}
      }
    };
  }, []);

  return (
    <div className="space-y-6 pb-28">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E5E0]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 bg-emerald-100 text-emerald-700 rounded-md">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Personalized Base Video đã hoàn thành
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 font-medium text-slate-800">
              <User className="w-3.5 h-3.5 text-[#654B7B]" />
              Người mẫu: {generation.modelName}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-medium text-slate-800">
              <Clapperboard className="w-3.5 h-3.5 text-[#654B7B]" />
              Video mẫu: {generation.templateTitle}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
              Dự án đã lưu: <span className="font-semibold text-slate-900">{generation.projectName}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenProjects}
            className="gap-2 text-xs"
          >
            <FolderKanban className="w-4 h-4 text-slate-500" />
            Danh sách dự án
          </Button>
        </div>
      </div>

      {/* Main Video View - Centered Prominently */}
      <div className="flex flex-col items-center justify-center pt-2">
        <div className="w-full max-w-[420px] bg-white border border-[#E8E5E0] rounded-2xl overflow-hidden shadow-md p-4 space-y-3">
          <div className="relative w-full aspect-[9/16] bg-black rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                poster={
                  generation.outputThumbnailUrl
                    ? studioService.resolveMediaUrl(generation.outputThumbnailUrl)
                    : undefined
                }
                controls
                autoPlay
                playsInline
                loop
                className="w-full h-full object-contain"
              >
                Trình duyệt của bạn không hỗ trợ phát video HTML5.
              </video>
            ) : (
              <div className="text-center p-6 text-slate-400 space-y-2">
                <Film className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-xs">Không tìm thấy đường dẫn video</p>
              </div>
            )}
          </div>

          {videoUrl && (
            <div className="pt-1 flex justify-between items-center text-xs text-slate-500 px-1">
              <span className="font-mono text-[11px] text-slate-600 truncate max-w-[220px]">
                {generation.outputVideoAssetId || generation.generationId}
              </span>
              <a
                href={videoUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium p-1 hover:bg-indigo-50 rounded transition-colors"
              >
                <Download className="w-4 h-4" />
                Tải file video
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Pinned Bottom Navigation */}
      <div className="fixed bottom-0 right-0 left-0 lg:left-[var(--sidebar-w,252px)] z-30 bg-white/95 backdrop-blur-md border-t border-[#E8E5E0] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-[left] duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-7 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <Button
            variant="secondary"
            onClick={onCreateNewVersion}
            className="gap-2 text-xs"
          >
            <RotateCcw className="w-4 h-4" />
            Làm lại video khác
          </Button>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Dự án đã lưu: <span className="font-bold text-slate-900">{generation.projectName}</span>
          </div>

          {onProceedToProducts && (
            <Button
              variant="primary"
              onClick={onProceedToProducts}
              className="gap-2 shadow-sm font-semibold px-6 py-2.5 bg-[#654B7B] hover:bg-[#523C64] text-white text-sm"
            >
              <Package className="w-4 h-4" />
              <span>Tiếp tục: Sang bước 6 (Nhập sản phẩm)</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
