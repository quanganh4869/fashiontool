import React, { useRef, useState, useEffect } from 'react';
import {
  Download,
  FolderKanban,
  CheckCircle2,
  Film,
  Play,
  Volume2,
  VolumeX,
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
  onOpenProjects,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoUrl = studioService.resolveMediaUrl(generation.outputVideoUrl);

  useEffect(() => {
    // Attempt autoplay muted so modern browsers don't block
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      setIsMuted(true);
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }

    return () => {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.muted = true;
        } catch {}
      }
    };
  }, [videoUrl]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E8E5E0]">
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
      <div className="flex flex-col items-center justify-center">
        <div className="w-full max-w-[380px] bg-white border border-[#E8E5E0] rounded-2xl overflow-hidden shadow-md p-3.5 space-y-3">
          <div
            className="relative w-full aspect-[9/16] bg-black rounded-xl overflow-hidden flex items-center justify-center shadow-inner cursor-pointer group"
            onClick={togglePlay}
          >
            {videoUrl ? (
              <>
                <video
                  key={videoUrl}
                  ref={videoRef}
                  src={videoUrl}
                  poster={
                    generation.outputThumbnailUrl
                      ? studioService.resolveMediaUrl(generation.outputThumbnailUrl)
                      : undefined
                  }
                  controls
                  playsInline
                  loop
                  preload="auto"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className="w-full h-full object-contain"
                >
                  Trình duyệt của bạn không hỗ trợ phát video HTML5.
                </video>

                {/* Big Center Play Button when paused */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-white/90 text-[#242321] flex items-center justify-center shadow-xl transform group-hover:scale-105 transition-transform">
                      <Play className="w-8 h-8 ml-1 text-[#654B7B] fill-current" />
                    </div>
                  </div>
                )}

                {/* Quick Mute/Unmute Overlay Button */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className="absolute bottom-14 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10"
                  aria-label={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
              </>
            ) : (
              <div className="text-center p-6 text-slate-400 space-y-2">
                <Film className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-xs">Không tìm thấy đường dẫn video</p>
              </div>
            )}
          </div>

          {videoUrl && (
            <div className="pt-1 flex justify-between items-center text-xs text-slate-500 px-1">
              <span className="font-mono text-[11px] text-slate-600 truncate max-w-[200px]">
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
    </div>
  );
};
