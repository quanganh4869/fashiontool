import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MODEL_UPLOAD_CONFIG } from '../constants/model-management.constants';

export interface ModelPhotoUploaderProps {
  onFilesSelected: (files: FileList | File[]) => void;
  disabled?: boolean;
}

export const ModelPhotoUploader: React.FC<ModelPhotoUploaderProps> = ({
  onFilesSelected,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      // Reset input value so same files can be re-selected if needed
      e.target.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full min-h-[180px] p-6 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
        isDragOver
          ? 'bg-[#F2EDF5] border-[#654B7B]'
          : 'bg-[#FBFAF8] border-[#D8D4CE] hover:border-[#654B7B]/60 hover:bg-[#F9F7FA]'
      } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={MODEL_UPLOAD_CONFIG.ACCEPTED_INPUT_STRING}
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="Chọn ảnh từ thiết bị"
      />

      <div className="w-12 h-12 rounded-full bg-white border border-[#E8E5E0] shadow-sm flex items-center justify-center text-[#654B7B] mb-3 transition-transform group-hover:scale-105">
        {isDragOver ? (
          <UploadCloud className="w-6 h-6 animate-bounce" />
        ) : (
          <ImageIcon className="w-6 h-6" />
        )}
      </div>

      <h3 className="text-sm font-semibold text-[#242321]">
        {isDragOver ? 'Thả ảnh để thêm vào hồ sơ' : 'Kéo thả ảnh người mẫu vào đây'}
      </h3>
      <p className="text-xs text-[#74716D] mt-1 max-w-sm leading-relaxed">
        Hoặc chọn ảnh từ thiết bị của bạn. Hỗ trợ JPG, PNG, WebP tối đa 20MB / ảnh.
      </p>

      <div className="mt-4" onClick={(e) => e.stopPropagation()}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className="bg-white border-[#E8E5E0] hover:bg-[#F6F5F2] text-xs font-medium"
        >
          Chọn ảnh từ thiết bị
        </Button>
      </div>
    </div>
  );
};
