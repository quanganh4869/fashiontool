import React, { useRef } from 'react';
import {
  RotateCcw,
  Download,
  FolderKanban,
  CheckCircle2,
  Film,
  ArrowRight,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModelTemplateGeneration } from '../types/studio.types';
import { studioService } from '../services/studio.service';
import { QualityReviewReportCard } from './QualityReviewReportCard';

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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 bg-emerald-100 text-emerald-700 rounded-md">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Personalized Base Video đã sẵn sàng
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Video nền đã cá nhân hóa người mẫu <span className="font-semibold text-slate-900">{generation.modelName}</span> kết hợp cùng video mẫu <span className="font-semibold text-slate-900">{generation.templateTitle}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCreateNewVersion}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Tạo phiên bản mới
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenProjects}
            className="gap-2"
          >
            <FolderKanban className="w-4 h-4" />
            Quản lý trong dự án
          </Button>

          {onProceedToProducts && (
            <Button
              variant="primary"
              size="sm"
              onClick={onProceedToProducts}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            >
              <Package className="w-4 h-4" />
              <span>Tiếp tục: Nhập sản phẩm</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Layout: Video Player + Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Video Player Column (5 cols on large) */}
        <div className="lg:col-span-5 bg-white border border-[#E8E5E0] rounded-2xl overflow-hidden shadow-sm flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-[340px] aspect-[9/16] bg-black rounded-xl overflow-hidden flex items-center justify-center">
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                poster={generation.outputThumbnailUrl ? studioService.resolveMediaUrl(generation.outputThumbnailUrl) : undefined}
                controls
                playsInline
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
            <div className="w-full max-w-[340px] pt-3 flex justify-between items-center text-xs text-slate-400 px-1">
              <span className="font-mono text-[11px] truncate max-w-[200px]">
                {generation.outputVideoAssetId || generation.generationId}
              </span>
              <a
                href={videoUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                Tải file
              </a>
            </div>
          )}
        </div>

        {/* Info & Quality Report Column (7 cols on large) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Video Technical Specs Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Thông số kỹ thuật video xuất ra
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Độ phân giải</span>
                <span className="font-bold text-slate-800 font-mono">
                  {generation.width && generation.height
                    ? `${generation.width} × ${generation.height}`
                    : '1080 × 1920'}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Tỉ lệ & FPS</span>
                <span className="font-bold text-slate-800 font-mono">
                  {generation.fps ? `${generation.fps} fps` : '30 fps'} (9:16)
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Thời lượng</span>
                <span className="font-bold text-slate-800 font-mono">
                  {studioService.formatDuration(generation.durationMs)}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Mã hóa video</span>
                <span className="font-bold text-slate-800 font-mono">
                  {generation.codec || 'H.264 / AAC'}
                </span>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-500 border-t border-slate-100 flex items-center justify-between">
              <span>Đã lưu vào Dự án:</span>
              <span className="font-semibold text-slate-900">{generation.projectName}</span>
            </div>
          </div>

          {/* Quality Review Report */}
          <QualityReviewReportCard report={generation.qualityReview} />
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border border-[#E8E5E0] p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] rounded-xl flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={onCreateNewVersion}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Tạo phiên bản mới
        </Button>

        {onProceedToProducts && (
          <Button
            variant="primary"
            onClick={onProceedToProducts}
            className="gap-2 shadow-sm"
          >
            <Package className="w-4 h-4" />
            <span>Tiếp tục: Nhập sản phẩm</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
