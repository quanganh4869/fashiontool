import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Info,
  Layers,
  Activity,
} from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { templateService } from '../services/template.service';
import { TemplateDetail } from '../types/template.types';

export interface TemplateUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (template: TemplateDetail) => void;
}

export const TemplateUploadModal: React.FC<TemplateUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('cat-streetwear');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStepText, setCurrentStepText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedTemplate, setCompletedTemplate] = useState<TemplateDetail | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up preview URL on unmount or file change
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  // Reset modal state on open/close
  useEffect(() => {
    if (!isOpen) {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
      setSelectedFile(null);
      setVideoPreviewUrl(null);
      setTitle('');
      setTags('');
      setCategoryId('cat-streetwear');
      setIsSubmitting(false);
      setCurrentStepText('');
      setErrorMessage(null);
      setCompletedTemplate(null);
      if (stepTimerRef.current) {
        clearInterval(stepTimerRef.current);
      }
    }
  }, [isOpen, videoPreviewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('mp4') && !file.type.includes('quicktime') && !file.name.endsWith('.mp4') && !file.name.endsWith('.mov')) {
      setErrorMessage('Định dạng tệp không hợp lệ. Vui lòng chọn tệp MP4 hoặc MOV.');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage('Dung lượng tệp vượt quá 100MB.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoPreviewUrl(URL.createObjectURL(file));

    // Auto populate title if empty
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
      }
      const fakeEvent = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(fakeEvent);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setErrorMessage('Vui lòng chọn tệp video mẫu.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tên video mẫu.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Sequence progress messages
    const steps = [
      'Đang tải tệp video lên máy chủ backend...',
      'Động cơ cục bộ: Phân tích thông số media & trích xuất khung hình...',
      'Động cơ cục bộ: Phát hiện chuyển cảnh & theo dõi dáng người 17 khớp (COCO)...',
      'Động cơ cục bộ: Phân đoạn cơ thể & nhận diện phân vùng trang phục...',
      'Đang hoàn tất lưu trữ phân tích và đăng ký mẫu vào hệ thống...',
    ];
    let stepIndex = 0;
    setCurrentStepText(steps[0]);

    stepTimerRef.current = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setCurrentStepText(steps[stepIndex]);
      }
    }, 2000);

    try {
      const template = await templateService.uploadTemplate(
        selectedFile,
        title.trim(),
        categoryId,
        tags.trim()
      );

      if (stepTimerRef.current) {
        clearInterval(stepTimerRef.current);
      }
      setIsSubmitting(false);
      setCompletedTemplate(template);
    } catch (err: unknown) {
      if (stepTimerRef.current) {
        clearInterval(stepTimerRef.current);
      }
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra trong quá trình xử lý video.';
      setErrorMessage(msg);
    }
  };

  const handleFinish = () => {
    if (completedTemplate) {
      onSuccess(completedTemplate);
    }
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Tải lên video mẫu thực tế"
      description="Tải lên video thời trang bạn đã tải về (TikTok, Douyin, Reels). Động cơ AI cục bộ sẽ phân tích chuyển động, khớp xương và trang phục."
      maxWidth="max-w-[680px]"
    >
      <div className="space-y-5">
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Upload Success State */}
        {completedTemplate ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-400" />
              <div>
                <h4 className="font-semibold text-emerald-200">Phân tích video thành công!</h4>
                <p className="text-xs text-emerald-400/80 mt-0.5">
                  Động cơ backend đã trích xuất toàn bộ dữ liệu chuyển động và phân vùng trang phục.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                <span className="text-zinc-400 block mb-1">Mã mẫu:</span>
                <span className="font-mono text-zinc-100 font-semibold">{completedTemplate.templateCode}</span>
              </div>
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                <span className="text-zinc-400 block mb-1">Thời lượng & Tỉ lệ:</span>
                <span className="text-zinc-100 font-semibold">
                  {templateService.formatDuration(completedTemplate.durationMs)} ({completedTemplate.aspectRatio})
                </span>
              </div>
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg col-span-2">
                <div className="flex items-center gap-1.5 text-zinc-400 mb-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Phân vùng trang phục nhận diện được:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {completedTemplate.garmentSlotsSummary.length > 0 ? (
                    completedTemplate.garmentSlotsSummary.map((slot) => (
                      <span
                        key={slot}
                        className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px]"
                      >
                        {templateService.formatSlotName(slot)}
                      </span>
                    ))
                  ) : (
                    <span className="text-zinc-500">Đã nhận diện toàn bộ cơ thể (Full-body)</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button variant="primary" onClick={handleFinish}>
                Sử dụng mẫu này ngay
              </Button>
            </div>
          </div>
        ) : isSubmitting ? (
          /* Processing State */
          <div className="py-10 text-center space-y-4">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <Activity className="w-7 h-7 text-indigo-400 absolute animate-pulse" />
            </div>
            <div>
              <h4 className="text-base font-medium text-zinc-100">Đang xử lý & phân tích video cục bộ</h4>
              <p className="text-xs text-indigo-400 font-mono mt-1.5 animate-pulse min-h-[18px]">
                {currentStepText}
              </p>
            </div>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Quá trình xử lý chạy 100% trên máy chủ nội bộ bằng FFmpeg & Computer Vision cục bộ, không gửi dữ liệu ra ngoài.
            </p>
          </div>
        ) : (
          /* Upload & Form State */
          <div className="space-y-4">
            {/* File Dropzone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                selectedFile
                  ? 'border-indigo-500/50 bg-indigo-500/5 hover:border-indigo-500'
                  : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,.mp4,.mov"
                className="hidden"
                onChange={handleFileChange}
              />

              {selectedFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-indigo-400">
                    <FileVideo className="w-8 h-8" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-zinc-100 truncate max-w-xs">{selectedFile.name}</p>
                      <p className="text-xs text-zinc-400">
                        {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • Nhấp để chọn tệp khác
                      </p>
                    </div>
                  </div>

                  {videoPreviewUrl && (
                    <div className="relative mx-auto w-36 aspect-[9/16] rounded-lg overflow-hidden bg-black border border-zinc-700 shadow-md">
                      <video
                        src={videoPreviewUrl}
                        controls
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-zinc-200">
                      Kéo thả video vào đây hoặc <span className="text-indigo-400 underline">chọn tệp</span>
                    </span>
                    <p className="text-xs text-zinc-500 mt-1">
                      Hỗ trợ MP4, MOV (Tối đa 100MB, khuyến nghị tỉ lệ đứng 9:16)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Metadata Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Tên video mẫu <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Đi bộ đường phố năng động TikTok"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Phong cách / Danh mục
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="cat-streetwear">Đường phố (Streetwear)</option>
                    <option value="cat-formal">Công sở / Thanh lịch (Formal)</option>
                    <option value="cat-sportswear">Thể thao (Sportswear)</option>
                    <option value="cat-casual">Đời thường (Casual)</option>
                    <option value="cat-traditional">Truyền thống / Áo dài</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Thẻ (Tags, phân cách bằng dấu phẩy)
                  </label>
                  <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="streetwear, tiktok, walk"
                  />
                </div>
              </div>
            </div>

            {/* Note about backend analysis */}
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400">
              <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <span>
                Hệ thống Backend sẽ tự động chạy pipeline trích xuất khung hình, nhận diện 17 điểm khớp xương người mẫu và phân chia các vùng trang phục (áo, quần/váy) phục vụ ghép ảnh người mẫu thực tế.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!selectedFile || !title.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Tải lên & Phân tích
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
