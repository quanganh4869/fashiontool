import React from 'react';
import { RotateCcw, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { ModelUploadItem } from '../types/model-management.types';
import { formatFileSize } from '../utils/model-photo-format';

export interface ModelPhotoItemProps {
  item: ModelUploadItem;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

export const ModelPhotoItem: React.FC<ModelPhotoItemProps> = ({
  item,
  onRetry,
  onRemove,
}) => {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg border border-[#E8E5E0] bg-white shadow-sm">
      {/* Thumbnail */}
      <div className="w-12 h-14 rounded-md bg-[#F6F5F2] overflow-hidden shrink-0 border border-[#E8E5E0]">
        <img
          src={item.previewUrl}
          alt={item.file.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info & Progress */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[#242321] truncate">
            {item.file.name}
          </p>
          <span className="text-[11px] text-[#74716D] whitespace-nowrap">
            {formatFileSize(item.file.size)}
          </span>
        </div>

        {/* Status Line */}
        <div className="flex items-center justify-between text-[11px]">
          {item.status === 'uploading' && (
            <span className="text-[#654B7B] font-medium flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin shrink-0" />
              Đang tải lên {item.progress}%
            </span>
          )}
          {item.status === 'verifying' && (
            <span className="text-[#9A6B26] font-medium flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin shrink-0" />
              Đang kiểm tra
            </span>
          )}
          {item.status === 'completed' && (
            <span className="text-[#367458] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              Đã tải lên
            </span>
          )}
          {item.status === 'error' && (
            <span className="text-[#A94442] font-medium flex items-center gap-1 truncate">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {item.errorMessage || 'Tải lên thất bại'}
            </span>
          )}
          {item.status === 'queued' && (
            <span className="text-[#74716D]">Đang chờ...</span>
          )}
        </div>

        {/* Progress Bar */}
        {(item.status === 'uploading' || item.status === 'verifying') && (
          <div className="w-full bg-[#E8E5E0] h-1.5 rounded-full overflow-hidden mt-0.5">
            <div
              className="bg-[#654B7B] h-full transition-all duration-fast rounded-full"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Action Buttons: Retry or Remove */}
      <div className="flex items-center gap-1 shrink-0">
        {item.status === 'error' && (
          <button
            type="button"
            onClick={() => onRetry(item.id)}
            aria-label="Thử lại tải ảnh"
            className="w-7 h-7 rounded-md hover:bg-[#F2EDF5] text-[#654B7B] flex items-center justify-center transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label="Xóa khỏi hàng đợi"
          className="w-7 h-7 rounded-md hover:bg-[#F6F5F2] text-[#74716D] hover:text-[#242321] flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
