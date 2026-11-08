import React, { useRef, useState, useEffect } from 'react';
import { AlertCircle, RotateCcw, Clock, Layers, Film, Play } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { TemplateSummary } from '../types/template.types';
import { templateService } from '../services/template.service';

export interface TemplatePreviewDialogProps {
  template: TemplateSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateDetail?: (templateId: string) => void;
  onSelect?: (template: TemplateSummary) => void;
}

export const TemplatePreviewDialog: React.FC<TemplatePreviewDialogProps> = ({
  template,
  isOpen,
  onClose,
  onNavigateDetail,
  onSelect,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Stop video & reset state when closed or template changes
  useEffect(() => {
    if (!isOpen) {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.muted = true;
          videoRef.current.currentTime = 0;
        } catch {}
      }
      setHasError(false);
      setErrorMessage(null);
      setIsPlaying(false);
    }
  }, [isOpen, template]);

  // Guaranteed unmount media release
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

  if (!template) return null;

  const streamUrl = template.previewUrl
    ? templateService.resolveMediaUrl(template.previewUrl)
    : templateService.getVideoStreamUrl(template.templateId);

  const posterUrl = template.posterUrl
    ? templateService.resolveMediaUrl(template.posterUrl)
    : undefined;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  };

  const handleVideoError = () => {
    setHasError(true);
    setErrorMessage('Không thể phát video mẫu từ Local Storage.');
  };

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage(null);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={template.title}
      description={`Mã mẫu: ${template.templateCode} • ${template.categoryName}`}
      maxWidth="max-w-[480px]"
    >
      <div className="flex flex-col gap-4 mt-2">
        {/* Video Player Container (9:16 Aspect Ratio) */}
        <div className="relative w-full max-h-[65vh] aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center group">
          {hasError ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-white gap-3">
              <AlertCircle className="w-10 h-10 text-[#E86060]" />
              <p className="text-sm font-medium">{errorMessage}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRetry}
                className="gap-2 text-white border-white/40 hover:bg-white/10"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Thử lại</span>
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                key={streamUrl}
                src={streamUrl}
                poster={posterUrl}
                controls
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={handleVideoError}
                className="w-full h-full object-contain cursor-pointer"
              >
                Trình duyệt của bạn không hỗ trợ thẻ phát video HTML5.
              </video>

              {/* Big Center Play Button Overlay when paused */}
              {!isPlaying && !hasError && (
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label="Phát video"
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer pointer-events-auto z-10"
                >
                  <Play className="w-7 h-7 fill-white ml-0.5" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Video Metadata Summary Strip */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-[#F6F5F2] rounded-lg text-xs text-[#55534E]">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#74716D]" />
            <span>{templateService.formatDuration(template.durationMs)}</span>
          </div>

          <div className="flex items-center gap-1.5 justify-center">
            <Layers className="w-3.5 h-3.5 text-[#74716D]" />
            <span>Tỷ lệ: {template.aspectRatio}</span>
          </div>

          <div className="flex items-center gap-1.5 justify-end">
            <Film className="w-3.5 h-3.5 text-[#74716D]" />
            <span>{template.width}x{template.height}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-1">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Đóng
          </Button>

          {onSelect ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onSelect(template);
                onClose();
              }}
            >
              Chọn video mẫu này
            </Button>
          ) : onNavigateDetail ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onNavigateDetail(template.templateId);
              }}
            >
              Xem chi tiết video mẫu
            </Button>
          ) : null}
        </div>
      </div>
    </Dialog>
  );
};
