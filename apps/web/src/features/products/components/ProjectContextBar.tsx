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
    <div className="bg-white text-[#242321] rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#E8E5E0]">
      <div className="flex items-center gap-3.5">
        <div className="relative w-12 h-16 bg-[#F6F5F2] rounded-lg overflow-hidden border border-[#E8E5E0] shrink-0 flex items-center justify-center">
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt="Base Video Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <Film className="w-5 h-5 text-[#74716D]" />
          )}
          <span className="absolute bottom-1 right-1 bg-emerald-500 w-2 h-2 rounded-full ring-2 ring-white" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Base Video READY
            </span>
            <span className="text-xs text-[#74716D]">
              Dự án: <span className="text-[#242321] font-semibold">{generation.projectName}</span>
            </span>
          </div>

          <h3 className="text-sm font-semibold text-[#242321] mt-1 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-[#242321]">
              <User className="w-3.5 h-3.5 text-[#654B7B]" />
              {generation.modelName} (v{generation.modelVersion})
            </span>
            <span className="text-[#D8D4CE]">•</span>
            <span className="flex items-center gap-1 text-[#242321]">
              <Clapperboard className="w-3.5 h-3.5 text-[#654B7B]" />
              {generation.templateTitle}
            </span>
          </h3>
          <p className="text-xs text-[#74716D] mt-0.5">
            Sản phẩm được trích xuất sẽ được lưu vào dự án này để chuẩn bị cho giai đoạn khớp trang phục.
          </p>
        </div>
      </div>

      {onBackToBaseVideo && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onBackToBaseVideo}
          className="gap-1.5 shrink-0 self-start md:self-auto text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Xem lại Base Video
        </Button>
      )}
    </div>
  );
};
