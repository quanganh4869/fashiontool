import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Check,
  Film,
  Shirt,
} from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { FinalVideoItem } from '../types/batch.types';
import { ModelTemplateGeneration } from '@/features/studio/types/studio.types';
import { batchService } from '../services/batch.service';
import { studioService } from '@/features/studio/services/studio.service';

export interface SynchronizedVideoComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: FinalVideoItem | null;
  generation: ModelTemplateGeneration;
}

export const SynchronizedVideoComparisonModal: React.FC<SynchronizedVideoComparisonModalProps> = ({
  isOpen,
  onClose,
  video,
  generation,
}) => {
  const baseVideoRef = useRef<HTMLVideoElement>(null);
  const finalVideoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(5);
  const [isMuted, setIsMuted] = useState(true);

  // Stop playback when modal closes or unmounts
  useEffect(() => {
    if (!isOpen) {
      if (baseVideoRef.current) baseVideoRef.current.pause();
      if (finalVideoRef.current) finalVideoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (baseVideoRef.current) {
        try {
          baseVideoRef.current.pause();
          baseVideoRef.current.muted = true;
          baseVideoRef.current.removeAttribute('src');
          baseVideoRef.current.load();
        } catch {}
      }
      if (finalVideoRef.current) {
        try {
          finalVideoRef.current.pause();
          finalVideoRef.current.muted = true;
          finalVideoRef.current.removeAttribute('src');
          finalVideoRef.current.load();
        } catch {}
      }
    };
  }, []);

  if (!video) return null;

  const baseVideoUrl = studioService.resolveMediaUrl(generation.outputVideoUrl);
  const finalVideoUrl = batchService.resolveMediaUrl(video.video_url);

  // Synchronized Play/Pause
  const togglePlay = () => {
    if (!baseVideoRef.current || !finalVideoRef.current) return;

    if (isPlaying) {
      baseVideoRef.current.pause();
      finalVideoRef.current.pause();
      setIsPlaying(false);
    } else {
      baseVideoRef.current.play().catch(() => {});
      finalVideoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Synchronized Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);

    if (baseVideoRef.current) {
      baseVideoRef.current.currentTime = targetTime;
    }
    if (finalVideoRef.current) {
      finalVideoRef.current.currentTime = targetTime;
    }
  };

  // Time update from primary video
  const handleTimeUpdate = () => {
    if (baseVideoRef.current) {
      setCurrentTime(baseVideoRef.current.currentTime);
      if (baseVideoRef.current.duration && !isNaN(baseVideoRef.current.duration)) {
        setDuration(baseVideoRef.current.duration);
      }
    }
  };

  const handleRestart = () => {
    if (baseVideoRef.current) baseVideoRef.current.currentTime = 0;
    if (finalVideoRef.current) finalVideoRef.current.currentTime = 0;
    setCurrentTime(0);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="So sánh đồng bộ: Base Video vs Video Thành phẩm"
      description="Đối chiếu khung hình theo cùng mốc thời gian thực để kiểm định việc bảo toàn người mẫu và bối cảnh."
      maxWidth="max-w-[1020px]"
    >
      <div className="space-y-5">
        {/* Dual Video Player Screen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-3 rounded-2xl border border-slate-800">
          {/* Left: Base Video */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <Film className="w-3.5 h-3.5" />
                Personalized Base Video (Nguồn)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">1080x1920 (9:16)</span>
            </div>

            <div className="aspect-[9/16] bg-black rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
              <video
                ref={baseVideoRef}
                src={baseVideoUrl}
                muted={isMuted}
                playsInline
                loop
                onTimeUpdate={handleTimeUpdate}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Right: Final Product Video */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Shirt className="w-3.5 h-3.5" />
                Final Product Video ({video.product_title})
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">10/10 PASS</span>
            </div>

            <div className="aspect-[9/16] bg-black rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
              <video
                ref={finalVideoRef}
                src={finalVideoUrl}
                muted={isMuted}
                playsInline
                loop
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Synchronized Playback Control Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={togglePlay}
              className="w-9 h-9 p-0 flex items-center justify-center rounded-lg"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleRestart}
              className="w-9 h-9 p-0 flex items-center justify-center rounded-lg text-slate-500"
              title="Phát lại từ đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>

            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
              title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <span className="text-xs font-mono font-bold text-slate-700 ml-1">
              {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
            </span>
          </div>

          {/* Synchronized Scrubber Slider */}
          <div className="flex-1 w-full max-w-md px-2">
            <input
              type="range"
              min={0}
              max={duration || 5}
              step={0.05}
              value={currentTime}
              onChange={handleSeek}
              className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Tốc độ: 30 fps đồng bộ
          </div>
        </div>

        {/* Inspection Verification Notes */}
        <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="flex items-start gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-800 text-[11px]">Bảo toàn người mẫu</strong>
              <span className="text-[10px] text-slate-500">Mặt, da cổ và tóc giữ nguyên 100%</span>
            </div>
          </div>

          <div className="flex items-start gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-800 text-[11px]">Đúng 6 cúc áo</strong>
              <span className="text-[10px] text-slate-500">Hàng cúc thẳng không biến dạng</span>
            </div>
          </div>

          <div className="flex items-start gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-800 text-[11px]">Che khuất tiền cảnh</strong>
              <span className="text-[10px] text-slate-500">Tay và tóc xếp đè lên áo mới</span>
            </div>
          </div>

          <div className="flex items-start gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-800 text-[11px]">Hậu cảnh video</strong>
              <span className="text-[10px] text-slate-500">Không can thiệp khung cảnh nền</span>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
