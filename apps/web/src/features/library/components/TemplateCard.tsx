import React, { useState } from 'react';
import { Heart, Film, Clock } from 'lucide-react';
import { TemplateSummary } from '../types/template.types';
import { templateService } from '../services/template.service';

export interface TemplateCardProps {
  template: TemplateSummary;
  onPreview?: (template: TemplateSummary) => void;
  onClick: (template: TemplateSummary) => void;
  onToggleFavorite: (templateId: string) => Promise<boolean>;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onClick,
  onToggleFavorite,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isFavLoading, setIsFavLoading] = useState(false);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavLoading) return;
    setIsFavLoading(true);
    try {
      await onToggleFavorite(template.templateId);
    } catch {
      // Handled in parent/hook
    } finally {
      setIsFavLoading(false);
    }
  };

  return (
    <div
      onClick={() => onClick(template)}
      className="group relative flex flex-col bg-white rounded-xl border border-[#D8D4CE] overflow-hidden hover:border-[#242321] hover:shadow-md transition-all duration-200 cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(template);
        }
      }}
      aria-label={`Video mẫu ${template.title}`}
    >
      {/* Poster Container - 9:16 Aspect Ratio container */}
      <div className="relative w-full aspect-[9/16] bg-[#F6F5F2] overflow-hidden flex items-center justify-center">
        {!imageError && template.posterUrl ? (
          <img
            src={template.posterUrl}
            alt={template.title}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center text-[#74716D] gap-2">
            <Film className="w-8 h-8 text-[#A19D97]" />
            <span className="text-xs">Chưa có ảnh xem trước</span>
          </div>
        )}

        {/* Top Badges Overlay */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
          {/* Aspect Ratio & Resolution Badge */}
          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold tracking-wide">
            {template.aspectRatio}
          </span>

          {/* Favorite Button */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            disabled={isFavLoading}
            aria-label={template.isFavorite ? 'Bỏ lưu khỏi yêu thích' : 'Lưu vào yêu thích'}
            className={`pointer-events-auto p-1.5 rounded-full backdrop-blur-xs transition-all cursor-pointer shadow-xs ${
              template.isFavorite
                ? 'bg-[#FFF0F0] text-[#D32F2F] hover:bg-[#FFE0E0]'
                : 'bg-black/40 text-white hover:bg-black/70 hover:scale-110'
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                template.isFavorite ? 'fill-[#D32F2F]' : ''
              } ${isFavLoading ? 'animate-pulse' : ''}`}
            />
          </button>
        </div>

        {/* Bottom Badges Overlay: Duration */}
        <div className="absolute bottom-2.5 right-2.5 pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[11px] font-medium font-mono">
            <Clock className="w-3 h-3" />
            {templateService.formatDuration(template.durationMs)}
          </span>
        </div>
      </div>

      {/* Card Information Body */}
      <div className="p-3.5 flex flex-col gap-1.5 flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between gap-1 text-[11px] text-[#74716D]">
            <span className="font-medium truncate">{template.categoryName}</span>
            <span className="font-mono text-[10px] text-[#A19D97] shrink-0">
              {template.templateCode}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-[#242321] line-clamp-1 mt-0.5 group-hover:text-[#000000] transition-colors">
            {template.title}
          </h3>
        </div>

        {/* Garment slots badges */}
        {template.garmentSlotsSummary.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1.5 border-t border-[#F0EFEA] text-[10px]">
            {template.garmentSlotsSummary.map((slot) => (
              <span
                key={slot}
                className="px-1.5 py-0.5 rounded bg-[#F6F5F2] text-[#55534E] font-medium"
              >
                {templateService.formatSlotName(slot)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
