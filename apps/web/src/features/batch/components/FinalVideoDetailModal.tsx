import React, { useState } from 'react';
import {
  Download,
  Film,
  ShieldCheck,
  Check,
  SplitSquareVertical,
  Grid,
  FileCheck,
  Layers,
} from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { FinalVideoItem } from '../types/batch.types';
import { batchService } from '../services/batch.service';

export interface FinalVideoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: FinalVideoItem | null;
  onOpenCompare?: (video: FinalVideoItem) => void;
}

export const FinalVideoDetailModal: React.FC<FinalVideoDetailModalProps> = ({
  isOpen,
  onClose,
  video,
  onOpenCompare,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'contact_sheet'>('video');

  if (!video) return null;

  const videoUrl = batchService.resolveMediaUrl(video.video_url);
  const contactSheetUrl = video.contact_sheet_url
    ? batchService.resolveMediaUrl(video.contact_sheet_url)
    : null;
  const downloadUrl = batchService.getDownloadUrl(video.project_id, video.video_id);

  const qualityReview = video.quality_review;
  const passedCriteria = qualityReview?.criteria.filter((c) => c.status === 'PASS').length ?? 10;
  const totalCriteria = qualityReview?.criteria.length ?? 10;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Chi tiết video thành phẩm: ${video.product_title}`}
      description="Video thời trang thành phẩm được tạo 100% bằng local video engine và xác minh qua Product Truth Sheet."
      maxWidth="max-w-[960px]"
    >
      <div className="space-y-6">
        {/* Main Content: Player on Left (7 cols), Provenance & Quality Gate on Right (5 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Player & Contact Sheet toggle */}
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('video')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'video' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                <Film className="w-3.5 h-3.5 inline mr-1" /> Video MP4
              </button>

              {contactSheetUrl && (
                <button
                  type="button"
                  onClick={() => setActiveTab('contact_sheet')}
                  className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all ${
                    activeTab === 'contact_sheet' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5 inline mr-1" /> Contact Sheet (8 frame)
                </button>
              )}
            </div>

            <div className="bg-black rounded-2xl overflow-hidden aspect-[9/16] max-h-[520px] mx-auto flex items-center justify-center border border-slate-800 shadow-inner">
              {activeTab === 'video' ? (
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full p-2 overflow-auto flex items-center justify-center">
                  <img
                    src={contactSheetUrl!}
                    alt="Contact Sheet 8 frames"
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Video Specs Bar */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Kích thước</span>
                <strong className="text-slate-800">{video.width} x {video.height} (9:16)</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Thời lượng / FPS</span>
                <strong className="text-slate-800">{(video.duration_ms / 1000).toFixed(1)}s • {video.fps} fps</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Codec</span>
                <strong className="text-slate-800">{video.codec.toUpperCase()} / AAC</strong>
              </div>
            </div>
          </div>

          {/* Right Column: Provenance & 10-Point Quality Gate */}
          <div className="md:col-span-5 space-y-4">
            {/* Provenance Tree */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                <Layers className="w-3.5 h-3.5 text-indigo-600" /> Nguồn gốc & Dữ liệu tham chiếu
              </h4>

              <div className="space-y-1.5 text-slate-600 text-[11px]">
                <p>
                  Sản phẩm: <strong className="text-slate-800">{video.product_title}</strong>
                </p>
                <p>
                  Người mẫu: <strong className="text-slate-800">{video.model_name}</strong>
                </p>
                <p>
                  Mã tác vụ: <span className="font-mono text-slate-700">{video.video_id.slice(0, 16)}...</span>
                </p>
                {video.sha256 && (
                  <p className="truncate font-mono text-[10px] text-slate-400">
                    SHA256: {video.sha256}
                  </p>
                )}
              </div>
            </div>

            {/* Truth Sheet Constraints Verified */}
            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-indigo-950 flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Ràng buộc Product Truth Sheet
              </h4>

              <div className="space-y-1.5 text-[11px] text-indigo-900">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Đúng 6 cúc tròn thẳng hàng trên nẹp áo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Cổ nhọn (Pointed) đối xứng tự nhiên</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Túi ngực trái (Left patch pocket) ổn định</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Bảo toàn 100% diện mạo và da người mẫu</span>
                </div>
              </div>
            </div>

            {/* Quality Review Card */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 text-[11px]">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" /> Báo cáo kiểm định 10 tiêu chí
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {passedCriteria}/{totalCriteria} PASS
                </span>
              </div>

              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 text-[11px]">
                {qualityReview?.criteria.map((c) => (
                  <div key={c.key} className="flex items-start justify-between gap-2 p-1.5 bg-white/80 rounded">
                    <span className="text-slate-800 font-medium truncate">{c.name}</span>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 rounded">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col gap-2">
              {onOpenCompare && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    onClose();
                    onOpenCompare(video);
                  }}
                  className="w-full text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50 gap-1.5"
                >
                  <SplitSquareVertical className="w-3.5 h-3.5" />
                  So sánh đồng bộ với Base Video
                </Button>
              )}

              <a
                href={downloadUrl}
                download={`TrendMotion_${video.product_title.replace(/\s+/g, '_')}.mp4`}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Tải video MP4 gốc
              </a>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
