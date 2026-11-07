import React from 'react';
import { Film, User, Clapperboard, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModelTemplateGeneration } from '@/features/studio/types/studio.types';
import { studioService } from '@/features/studio/services/studio.service';

interface ProjectContextBarProps {
  generation: ModelTemplateGeneration;
  onBackToBaseVideo?: () => void;
}

export const ProjectContextBar: React.FC<ProjectContextBarProps> = ({
  generation,
  onBackToBaseVideo,
}) => {
  const thumbUrl = generation.outputThumbnailUrl
    ? studioService.resolveMediaUrl(generation.outputThumbnailUrl)
    : undefined;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-700">
      <div className="flex items-center gap-3.5">
        <div className="relative w-12 h-16 bg-slate-950 rounded-lg overflow-hidden border border-slate-700 shrink-0 flex items-center justify-center">
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt="Base Video Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <Film className="w-5 h-5 text-slate-500" />
          )}
          <span className="absolute bottom-1 right-1 bg-emerald-500 w-2 h-2 rounded-full ring-2 ring-slate-900" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Base Video READY
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Dự án: <span className="text-white font-medium">{generation.projectName}</span>
            </span>
          </div>

          <h3 className="text-sm font-semibold text-white mt-1 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-slate-300">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              {generation.modelName} (v{generation.modelVersion})
            </span>
            <span className="text-slate-500">•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Clapperboard className="w-3.5 h-3.5 text-indigo-400" />
              {generation.templateTitle}
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Sản phẩm được trích xuất sẽ được lưu vào dự án này để chuẩn bị cho giai đoạn khớp trang phục.
          </p>
        </div>
      </div>

      {onBackToBaseVideo && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onBackToBaseVideo}
          className="gap-1.5 bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700 hover:text-white shrink-0 self-start md:self-auto text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Xem lại Base Video
        </Button>
      )}
    </div>
  );
};
