import React, { useRef, useState, useEffect } from 'react';
import {
  ArrowLeft,
  Heart,
  Clock,
  Layers,
  Film,
  Shirt,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { TemplateDetail } from '../types/template.types';
import { templateService } from '../services/template.service';
import { Button } from '@/components/ui/Button';

export interface TemplateDetailViewProps {
  template: TemplateDetail;
  isFavoriteLoading: boolean;
  onToggleFavorite: () => Promise<void>;
  onBack: () => void;
}

export const TemplateDetailView: React.FC<TemplateDetailViewProps> = ({
  template,
  isFavoriteLoading,
  onToggleFavorite,
  onBack,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const streamUrl = template.streamUrl
    ? templateService.resolveMediaUrl(template.streamUrl)
    : templateService.getVideoStreamUrl(template.templateId);

  const posterUrl = template.posterUrl
    ? templateService.resolveMediaUrl(template.posterUrl)
    : undefined;

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

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  };

  const handleRetryVideo = () => {
    setVideoError(false);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#ECEAE4]">
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 font-medium text-[#74716D] hover:text-[#242321] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Thư viện video mẫu</span>
          </button>
          <span className="text-[#A19D97]">/</span>
          <span className="font-semibold text-[#242321] truncate max-w-xs sm:max-w-md">
            {template.title}
          </span>
        </div>

        {/* Favorite Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onToggleFavorite}
          disabled={isFavoriteLoading}
          className={`gap-2 cursor-pointer ${
            template.isFavorite
              ? 'bg-[#FFF0F0] border-[#E86060] text-[#D32F2F] hover:bg-[#FFE0E0]'
              : 'border-[#D8D4CE] text-[#55534E]'
          }`}
        >
          <Heart className={`w-4 h-4 ${template.isFavorite ? 'fill-[#D32F2F]' : ''}`} />
          <span>{template.isFavorite ? 'Đã lưu yêu thích' : 'Lưu video mẫu'}</span>
        </Button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Video Player & Specs (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Player Container - Constrained to max-w 380px and max-h 68vh so it fits in screen */}
          <div className="relative w-full max-w-[380px] mx-auto aspect-[9/16] max-h-[68vh] bg-black rounded-2xl overflow-hidden shadow-md flex items-center justify-center group">
            {videoError ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-white gap-3">
                <AlertCircle className="w-10 h-10 text-[#E86060]" />
                <p className="text-sm font-medium">Không thể phát video mẫu từ Local Storage.</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRetryVideo}
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
                  onError={() => setVideoError(true)}
                  className="w-full h-full object-contain cursor-pointer"
                >
                  Trình duyệt không hỗ trợ phát video HTML5.
                </video>

                {/* Big Center Play Button Overlay when paused */}
                {!isPlaying && !videoError && (
                  <button
                    type="button"
                    onClick={togglePlay}
                    aria-label="Phát video"
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer pointer-events-auto z-10"
                  >
                    <Play className="w-8 h-8 fill-white ml-1" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Quick Technical Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 bg-[#F6F5F2] rounded-xl text-xs text-[#55534E]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-[#74716D]">Thời lượng</span>
              <span className="font-semibold text-[#242321] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#A19D97]" />
                {templateService.formatDuration(template.durationMs)}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-[#74716D]">Tỷ lệ khung hình</span>
              <span className="font-semibold text-[#242321] flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#A19D97]" />
                {template.aspectRatio}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-[#74716D]">Độ phân giải</span>
              <span className="font-semibold text-[#242321] flex items-center gap-1">
                <Film className="w-3 h-3 text-[#A19D97]" />
                {template.width}x{template.height}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-[#74716D]">Frame rate</span>
              <span className="font-semibold text-[#242321]">{template.frameRate} fps</span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-[#74716D]">Video Codec</span>
              <span className="font-semibold text-[#242321] uppercase">{template.videoCodec}</span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-[#74716D]">Phiên bản mẫu</span>
              <span className="font-semibold text-[#242321] font-mono">{template.templateVersionId}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Information, Scenes, Garment Slots, Compatibility (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Header Title & Tags */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-[#242321] text-white font-medium">
                {template.categoryName}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#ECEAE4] text-[#55534E] font-mono text-[11px]">
                {template.templateCode}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#242321] tracking-tight">
              {template.title}
            </h1>

            <p className="text-sm text-[#55534E] leading-relaxed">
              {template.description || 'Chưa có mô tả chi tiết cho video mẫu này.'}
            </p>

            {/* Tags */}
            {template.tags && template.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <Tag className="w-3.5 h-3.5 text-[#A19D97]" />
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md bg-[#F6F5F2] text-[#74716D] text-xs font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Garment Slots Section */}
          <div className="flex flex-col gap-3 p-5 bg-white rounded-xl border border-[#D8D4CE]">
            <div className="flex items-center gap-2">
              <Shirt className="w-4 h-4 text-[#242321]" />
              <h2 className="text-base font-bold text-[#242321]">
                Vị trí thay trang phục (Garment Slots)
              </h2>
            </div>
            <p className="text-xs text-[#74716D]">
              Các khu vực trang phục đã được đánh giá khả năng trích xuất và thay thế tự động trong quy trình sản xuất.
            </p>

            {template.garmentSlots.length > 0 ? (
              <div className="flex flex-col gap-2.5 mt-1">
                {template.garmentSlots.map((slot) => {
                  const isSupported = slot.assessmentStatus === 'SUPPORTED';
                  const isLimited = slot.assessmentStatus === 'LIMITED';

                  return (
                    <div
                      key={slot.slotId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#F6F5F2] rounded-lg text-xs"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-[#242321]">
                          {slot.slotName} ({templateService.formatSlotName(slot.slotType)})
                        </span>
                        {slot.notes && (
                          <span className="text-[#74716D] text-[11px]">{slot.notes}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                            isSupported
                              ? 'bg-[#EBF7EE] text-[#2E7D32]'
                              : isLimited
                              ? 'bg-[#FFF8E6] text-[#B78103]'
                              : 'bg-[#F0EFEA] text-[#74716D]'
                          }`}
                        >
                          {isSupported ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          <span>
                            {isSupported
                              ? 'Tương thích tốt'
                              : isLimited
                              ? 'Tương thích giới hạn'
                              : 'Chưa đánh giá'}
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-[#74716D] bg-[#F6F5F2] rounded-lg">
                Chưa đánh giá vị trí thay trang phục cho video này.
              </div>
            )}
          </div>

          {/* Compatibility Specification Section */}
          <div className="flex flex-col gap-3 p-5 bg-white rounded-xl border border-[#D8D4CE]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#242321]" />
              <h2 className="text-base font-bold text-[#242321]">
                Khả năng tương thích người mẫu (Model Compatibility)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#F6F5F2] rounded-lg flex flex-col gap-1">
                <span className="text-[#74716D] font-medium">Số lượng người mẫu hỗ trợ:</span>
                <span className="font-semibold text-[#242321]">
                  {template.compatibility.supportedSubjectCount} người mẫu
                </span>
              </div>

              <div className="p-3 bg-[#F6F5F2] rounded-lg flex flex-col gap-1">
                <span className="text-[#74716D] font-medium">Yêu cầu khuôn mặt:</span>
                <span className="font-semibold text-[#242321]">
                  {template.compatibility.faceVisibilityRequirement || 'Chưa đánh giá'}
                </span>
              </div>

              <div className="p-3 bg-[#F6F5F2] rounded-lg flex flex-col gap-1">
                <span className="text-[#74716D] font-medium">Yêu cầu thân thể người mẫu:</span>
                <span className="font-semibold text-[#242321]">
                  {template.compatibility.bodyVisibilityRequirement || 'Chưa đánh giá'}
                </span>
              </div>

              <div className="p-3 bg-[#F6F5F2] rounded-lg flex flex-col gap-1">
                <span className="text-[#74716D] font-medium">Mức độ che khuất (Occlusion):</span>
                <span className="font-semibold text-[#242321]">
                  {template.compatibility.occlusionLevel || 'Chưa đánh giá'}
                </span>
              </div>
            </div>

            {/* Limitations Notice if present */}
            {template.compatibility.limitations && template.compatibility.limitations.length > 0 && (
              <div className="p-3 bg-[#FFF8E6] border border-[#F5E0B3] rounded-lg text-xs text-[#8A6100] flex flex-col gap-1 mt-1">
                <span className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Lưu ý giới hạn tương thích:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {template.compatibility.limitations.map((lim, idx) => (
                    <li key={idx}>{lim}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Scenes Breakdown Section */}
          <div className="flex flex-col gap-3 p-5 bg-white rounded-xl border border-[#D8D4CE]">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#242321]">
                Phân cảnh video ({template.scenes.length} cảnh)
              </h2>
            </div>

            {template.scenes.length > 0 ? (
              <div className="flex flex-col divide-y divide-[#ECEAE4]">
                {template.scenes.map((scene) => (
                  <div key={scene.sceneId} className="py-3 flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#242321]">
                        Cảnh {scene.sceneOrder} ({templateService.formatDuration(scene.startTimeMs)} – {templateService.formatDuration(scene.endTimeMs)})
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#F6F5F2] text-[#74716D] text-[11px] font-mono">
                        {scene.framing}
                      </span>
                    </div>

                    <p className="text-[#55534E] leading-relaxed">
                      {scene.actionDescription}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-[#A19D97] mt-0.5">
                      <span>Chuyển động máy: {scene.cameraMovement}</span>
                      <span>•</span>
                      <span>Hiển thị: {scene.subjectVisibility}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-[#74716D] bg-[#F6F5F2] rounded-lg">
                Chưa có phân tích cảnh quay cho video mẫu này.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
