import React, { useRef, useEffect } from 'react';
import { X, Film, Clock, Monitor } from 'lucide-react';
import { CompletedVideo } from '@/types/overview';
import { formatRelativeTime, formatDuration } from '@/utils/formatters';

export interface VideoPlayerDialogProps {
  video: CompletedVideo | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoPlayerDialog: React.FC<VideoPlayerDialogProps> = ({
  video,
  isOpen,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stop video playback and release resources when closed
  useEffect(() => {
    if (!isOpen && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !video) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-player-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        className="relative bg-white rounded-xl shadow-modal max-w-3xl w-full max-h-[92vh] flex flex-col md:flex-row overflow-hidden border border-[#E8E5E0]"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng trình xem video"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Video Player Zone (9:16 vertical ratio) */}
        <div className="bg-black flex items-center justify-center flex-1 max-h-[60vh] md:max-h-[85vh] p-2">
          <video
            ref={videoRef}
            src={video.videoUrl}
            controls
            autoPlay
            playsInline
            poster={video.thumbnailUrl || undefined}
            className="h-full max-h-[58vh] md:max-h-[82vh] aspect-[9/16] object-contain rounded"
          >
            Trình duyệt của bạn không hỗ trợ thẻ video HTML5.
          </video>
        </div>

        {/* Metadata Sidebar (Desktop) / Footer (Mobile) */}
        <div className="w-full md:w-[320px] p-5 flex flex-col justify-between bg-white border-t md:border-t-0 md:border-l border-[#E8E5E0] overflow-y-auto">
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#654B7B] bg-[#F2EDF5] px-2.5 py-1 rounded-md self-start">
              <Film className="w-3.5 h-3.5" />
              <span>Video TikTok Shop</span>
            </div>

            <h3
              id="video-player-title"
              className="text-base font-semibold text-[#242321] leading-snug"
            >
              {video.title}
            </h3>

            {video.productName && (
              <p className="text-xs text-[#74716D] leading-relaxed">
                Sản phẩm: <span className="font-medium text-[#4B4945]">{video.productName}</span>
              </p>
            )}

            <div className="mt-2 pt-3 border-t border-[#E8E5E0] flex flex-col gap-2 text-xs text-[#74716D]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Thời lượng:
                </span>
                <span className="font-semibold text-[#242321]">
                  {formatDuration(video.durationSeconds) || '—'}
                </span>
              </div>

              {video.resolution && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5" /> Độ phân giải:
                  </span>
                  <span className="font-semibold text-[#242321]">{video.resolution}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span>Hoàn thành:</span>
                <span className="font-medium text-[#4B4945]">
                  {formatRelativeTime(video.completedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E8E5E0]">
            <button
              type="button"
              onClick={onClose}
              className="w-full h-9 px-4 text-xs font-medium text-[#242321] bg-[#F6F5F2] hover:bg-[#EBE8E3] rounded-md transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
