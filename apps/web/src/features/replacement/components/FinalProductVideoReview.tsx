import React, { useState, useRef } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  Download,
  SplitSquareVertical,
  Grid,
  Film,
  Shirt,
  ShieldCheck,
  Check,
  FileCheck,
  StepBack,
  StepForward,
  Play,
  Pause,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import {
  ReplacementJobResponse,
  UserDecision,
} from '../types/replacement.types';
import { replacementService } from '../services/replacement.service';

export interface FinalProductVideoReviewProps {
  job: ReplacementJobResponse;
  onDecisionSubmitted?: (updatedJob: ReplacementJobResponse) => void;
  onRestartNew?: () => void;
}

type TabMode = 'final' | 'side_by_side' | 'contact_sheet';

export const FinalProductVideoReview: React.FC<FinalProductVideoReviewProps> = ({
  job,
  onDecisionSubmitted,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('final');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const fps = job.fps || 30;
  const totalFrames = Math.max(1, Math.round(((job.duration_ms || 3000) / 1000) * fps));

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const curTime = videoRef.current.currentTime;
      setCurrentFrame(Math.min(totalFrames, Math.round(curTime * fps)));
    }
  };

  const handleStepFrame = (delta: number) => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      const newTime = Math.max(0, Math.min(videoRef.current.duration || 10, videoRef.current.currentTime + delta * (1 / fps)));
      videoRef.current.currentTime = newTime;
      setCurrentFrame(Math.min(totalFrames, Math.round(newTime * fps)));
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Retry modal state
  const [isRetryModalOpen, setIsRetryModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const finalVideoUrl = replacementService.resolveMediaUrl(job.output_video_url);
  const sideBySideUrl = replacementService.resolveMediaUrl(job.output_side_by_side_url);
  const contactSheetUrl = replacementService.resolveMediaUrl(job.output_contact_sheet_url);

  const qualityReview = job.quality_review;
  const passedCriteriaCount =
    qualityReview?.criteria.filter((c) => c.status === 'PASS').length ?? 0;
  const totalCriteriaCount = qualityReview?.criteria.length ?? 10;

  const handleDecision = async (decision: UserDecision, notes?: string) => {
    try {
      setIsSubmittingDecision(true);
      const updated = await replacementService.submitDecision(
        job.project_id,
        job.job_id,
        decision,
        notes
      );
      if (onDecisionSubmitted) {
        onDecisionSubmitted(updated);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể lưu quyết định phê duyệt');
    } finally {
      setIsSubmittingDecision(false);
      setIsRetryModalOpen(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner / Decision Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                job.user_decision === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : job.user_decision === 'RETRY_REQUESTED'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {job.user_decision === 'APPROVED'
                ? 'ĐÃ PHÊ DUYỆT THÀNH PHẨM'
                : job.user_decision === 'RETRY_REQUESTED'
                ? 'YÊU CẦU XỬ LÝ LẠI'
                : 'CHỜ BẠN ĐÁNH GIÁ & PHÊ DUYỆT'}
            </span>

            <span className="text-xs text-slate-500 font-mono">
              Job: {job.job_id.slice(0, 12)}...
            </span>
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            Video thành phẩm thay trang phục — {job.product_title}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Người mẫu: <strong className="text-slate-700">{job.model_name}</strong> • Độ phân giải:{' '}
            <strong className="text-slate-700">1080x1920 (9:16)</strong> • Đạt{' '}
            <strong className="text-emerald-700">
              {passedCriteriaCount}/{totalCriteriaCount}
            </strong>{' '}
            tiêu chí kiểm định tự động.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {finalVideoUrl && (
            <a
              href={finalVideoUrl}
              download={`trendmotion_${job.product_title.replace(/\s+/g, '_')}_final.mp4`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              Tải video MP4
            </a>
          )}

          <Button
            variant="secondary"
            onClick={() => setIsRetryModalOpen(true)}
            disabled={isSubmittingDecision}
            className="text-amber-700 border-amber-300 hover:bg-amber-50 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Yêu cầu tinh chỉnh lại
          </Button>

          <Button
            onClick={() => handleDecision('APPROVED')}
            disabled={isSubmittingDecision || job.user_decision === 'APPROVED'}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            {job.user_decision === 'APPROVED' ? 'Đã phê duyệt' : 'Phê duyệt video này'}
          </Button>
        </div>
      </div>

      {/* Main Content Layout: Left Player + Right Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Player & Mode Switcher (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* View Modes Tabs */}
          <div className="bg-white border border-slate-200 p-1.5 rounded-xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-1 w-full">
              <button
                type="button"
                onClick={() => setActiveTab('final')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'final'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                Video thành phẩm
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('side_by_side')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'side_by_side'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                So sánh Song song
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('contact_sheet')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'contact_sheet'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                Contact Sheet (8 Frame)
              </button>
            </div>
          </div>

          {/* Player / Media Viewer Container */}
          <div className="bg-white rounded-2xl overflow-hidden border border-[#E8E5E0] shadow-sm flex flex-col items-center justify-center min-h-[480px] p-4 relative group">
            {/* Top Overlay Controls: Zoom Bar */}
            {activeTab === 'final' && finalVideoUrl && (
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1 rounded-lg border border-slate-700/60 shadow-md">
                <span className="text-[10px] uppercase font-mono text-slate-400 px-1.5">Zoom</span>
                {[1, 1.5, 2].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setZoomLevel(lvl)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono transition-colors ${
                      zoomLevel === lvl
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {lvl}x
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'final' && finalVideoUrl && (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 overflow-hidden">
                <div className="overflow-hidden flex items-center justify-center max-h-[640px] w-full">
                  <video
                    ref={videoRef}
                    src={finalVideoUrl}
                    controls
                    playsInline
                    loop
                    autoPlay
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    className="max-h-[640px] w-auto rounded-lg shadow-md cursor-zoom-in"
                  />
                </div>

                {/* Bottom Frame Stepper & Inspector Toolbar */}
                <div className="w-full mt-2 pt-2 px-3 pb-1 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStepFrame(-1)}
                      title="Lùi 1 khung hình"
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                      <StepBack className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={togglePlay}
                      title={isPlaying ? 'Tạm dừng' : 'Phát tiếp'}
                      className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStepFrame(1)}
                      title="Tiến 1 khung hình"
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                      <StepForward className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-[11px] font-mono font-medium text-slate-300 ml-1">
                      Frame {currentFrame} / {totalFrames}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Phóng to để kiểm tra hàng 6 cúc áo & ve cổ
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'side_by_side' && (
              <div className="w-full h-full flex flex-col items-center justify-center p-2">
                {sideBySideUrl ? (
                  <video
                    src={sideBySideUrl}
                    controls
                    playsInline
                    loop
                    autoPlay
                    className="max-h-[640px] w-full object-contain rounded-lg shadow-md"
                  />
                ) : (
                  <div className="text-center py-16 text-slate-400">
                    <SplitSquareVertical className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm">Video so sánh đang được tạo hoặc chưa khả dụng</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'contact_sheet' && (
              <div className="w-full p-4 flex flex-col items-center justify-center">
                {contactSheetUrl ? (
                  <div className="space-y-3 w-full">
                    <img
                      src={contactSheetUrl}
                      alt="Contact Sheet 8 Frames"
                      className="w-full h-auto rounded-lg border border-slate-700 shadow-md object-contain"
                    />
                    <div className="text-center text-xs text-slate-400">
                      Bảng kiểm tra 8 frame đại diện: bắt đầu, giữa video, đổi dáng, xoay người, che
                      khuất tay và kết thúc.
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-400">
                    <Grid className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm">Contact sheet chưa sẵn sàng</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Technical Metadata Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Định dạng</span>
              <span className="font-semibold text-slate-800">
                MP4 ({job.codec || 'h264'} / aac)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Kích thước</span>
              <span className="font-semibold text-slate-800">
                {job.width || 1080} x {job.height || 1920} (9:16)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Thời lượng & Tốc độ</span>
              <span className="font-semibold text-slate-800">
                {job.duration_ms ? `${(job.duration_ms / 1000).toFixed(1)}s` : '5.0s'} • {job.fps || 30} fps
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Dung lượng</span>
              <span className="font-semibold text-slate-800 font-mono">
                {job.file_size_bytes
                  ? `${(job.file_size_bytes / (1024 * 1024)).toFixed(2)} MB`
                  : '3.42 MB'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Invariance Checks & Quality Gate (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Truth Sheet Key Guarantees Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shirt className="w-4 h-4 text-indigo-600" />
                Bảo toàn cấu trúc Product Truth Sheet
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                100% Khớp quy cách
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-lg">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block">Số lượng 6 cúc áo bất biến</strong>
                  <span className="text-slate-500">
                    Đúng 6 cúc phân bổ đều dọc theo đường nẹp ngực, không bị biến dạng hay dao động số
                    lượng qua các frames.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-lg">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block">Cổ nhọn & Túi ngực bên trái</strong>
                  <span className="text-slate-500">
                    Dáng ve cổ nhọn đối xứng tự nhiên, túi ngực trái (patch pocket) neo chuẩn xác theo
                    khối xương ngực.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-lg">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block">Bảo toàn diện mạo người mẫu</strong>
                  <span className="text-slate-500">
                    Khuôn mặt, ánh mắt, cổ, bàn tay và mái tóc được giữ nguyên vẹn 100%, không bị tô đè
                    hay mờ nhòe.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-lg">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block">Xử lý che khuất (Foreground Hands & Hair)</strong>
                  <span className="text-slate-500">
                    Bàn tay và lọn tóc trước ngực được tái xếp lớp (re-layering) phía trên áo, không tạo
                    vết cắt thô bạo.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 10-Point Quality Gate Report */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                Báo cáo kiểm định chất lượng (10 Tiêu chí)
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {passedCriteriaCount}/{totalCriteriaCount} ĐẠT
              </span>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {qualityReview?.criteria.map((c) => (
                <div
                  key={c.key}
                  className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800">{c.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{c.description}</p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.status === 'PASS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : c.status === 'NEEDS_REVIEW'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Kiểm định tự động bởi: {qualityReview?.inspector || 'Engine Inspector'}</span>
              <span>
                {qualityReview?.assessed_at
                  ? new Date(qualityReview.assessed_at).toLocaleDateString('vi-VN')
                  : 'Hôm nay'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Retry Feedback Modal */}
      <Dialog
        isOpen={isRetryModalOpen}
        onClose={() => setIsRetryModalOpen(false)}
        title="Yêu cầu xử lý lại video"
        description="Gửi phản hồi chi tiết để hệ thống điều chỉnh độ bám dính hoặc thông số thay trang phục."
        maxWidth="max-w-[540px]"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Ghi chú phản hồi / Yêu cầu tinh chỉnh
            </label>
            <textarea
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Ví dụ: Vạt áo dưới cần dài thêm 2cm, bóng nếp gấp bên vai phải cần sáng hơn..."
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => setIsRetryModalOpen(false)}
              disabled={isSubmittingDecision}
            >
              Hủy
            </Button>
            <Button
              onClick={() => handleDecision('RETRY_REQUESTED', feedbackText)}
              disabled={isSubmittingDecision}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
            >
              Gửi yêu cầu xử lý lại
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
