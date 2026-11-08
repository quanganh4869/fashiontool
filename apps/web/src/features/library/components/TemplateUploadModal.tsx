import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
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
  const [categoryId, setCategoryId] = useState('fashion_walk');
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
      setCategoryId('fashion_walk');
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
      setErrorMessage('Vui lòng chọn video mẫu.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tên video mẫu.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const steps = [
      'Đang tải video lên...',
      'Đang phân tích khung hình & chuyển động...',
      'Đang theo dõi dáng người và trang phục...',
      'Đang hoàn tất xử lý...',
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
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải video lên.';
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
      title="Tải lên video mẫu"
      maxWidth="max-w-[600px]"
    >
      <div className="space-y-4 pt-1">
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Upload Success State */}
        {completedTemplate ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-600" />
              <div>
                <h4 className="font-semibold text-emerald-950">Tải lên video thành công</h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Đã hoàn tất phân tích video và đưa vào thư viện mẫu.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#F6F5F2] border border-[#E8E5E0] rounded-lg">
                <span className="text-[#74716D] block mb-1">Mã mẫu:</span>
                <span className="font-mono text-[#242321] font-semibold">{completedTemplate.templateCode}</span>
              </div>
              <div className="p-3 bg-[#F6F5F2] border border-[#E8E5E0] rounded-lg">
                <span className="text-[#74716D] block mb-1">Thời lượng & Tỉ lệ:</span>
                <span className="text-[#242321] font-semibold">
                  {templateService.formatDuration(completedTemplate.durationMs)} ({completedTemplate.aspectRatio})
                </span>
              </div>
              <div className="p-3 bg-[#F6F5F2] border border-[#E8E5E0] rounded-lg col-span-2">
                <div className="flex items-center gap-1.5 text-[#74716D] mb-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#654B7B]" />
                  <span>Phân vùng trang phục nhận diện:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {completedTemplate.garmentSlotsSummary.length > 0 ? (
                    completedTemplate.garmentSlotsSummary.map((slot) => (
                      <span
                        key={slot}
                        className="px-2 py-0.5 rounded bg-white border border-[#E8E5E0] text-[#242321] text-[11px] font-medium"
                      >
                        {templateService.formatSlotName(slot)}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#74716D]">Toàn thân</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="primary" onClick={handleFinish}>
                Sử dụng mẫu này ngay
              </Button>
            </div>
          </div>
        ) : isSubmitting ? (
          /* Processing State - Light, High Contrast */
          <div className="py-12 text-center space-y-4">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-14 h-14 rounded-full border-4 border-[#654B7B]/20 border-t-[#654B7B] animate-spin" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-[#242321]">Đang xử lý video mẫu</h4>
              <p className="text-sm font-semibold text-[#654B7B] mt-2">
                {currentStepText}
              </p>
            </div>
          </div>
        ) : (
          /* Upload & Form State - Match Light Design System */
          <div className="space-y-4">
            {/* File Dropzone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                selectedFile
                  ? 'border-[#654B7B] bg-[#F2EDF5]'
                  : 'border-[#D8D4CE] bg-[#FBFAF8] hover:border-[#654B7B]/70 hover:bg-[#F9F7FA]'
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
                  <div className="flex items-center justify-center gap-2 text-[#654B7B]">
                    <FileVideo className="w-7 h-7" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-[#242321] truncate max-w-xs">{selectedFile.name}</p>
                      <p className="text-xs text-[#74716D]">
                        {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • Bấm để chọn tệp khác
                      </p>
                    </div>
                  </div>

                  {videoPreviewUrl && (
                    <div className="relative mx-auto w-32 aspect-[9/16] rounded-lg overflow-hidden border border-[#E8E5E0] bg-black shadow-sm">
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
                  <div className="w-12 h-12 rounded-full bg-white border border-[#E8E5E0] shadow-sm flex items-center justify-center text-[#654B7B] mx-auto">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-[#242321]">
                      Kéo thả video vào đây hoặc <span className="text-[#654B7B] underline">chọn tệp</span>
                    </span>
                    <p className="text-xs text-[#74716D] mt-1">
                      Hỗ trợ MP4, MOV (Tối đa 100MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Metadata Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#242321] mb-1.5">
                  Tên video mẫu <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Đi bộ đường phố năng động"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#242321] mb-1.5">
                    Danh mục
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8D4CE] rounded-lg text-sm text-[#242321] focus:outline-none focus:border-[#654B7B]"
                  >
                    <option value="fashion_walk">Fashion Walk</option>
                    <option value="mirror_outfit">Mirror Outfit</option>
                    <option value="studio_pose">Studio Pose</option>
                    <option value="runway">Runway</option>
                    <option value="lifestyle">Lifestyle</option>
                    <option value="closeup_product">Close-up Product</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#242321] mb-1.5">
                    Thẻ (Tags)
                  </label>
                  <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="streetwear, walk"
                  />
                </div>
              </div>
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
                    Đang tải lên...
                  </>
                ) : (
                  'Tải lên'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
