import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ModelAsset } from '../types/model-management.types';

export interface ModelPhotoViewerProps {
  assets: ModelAsset[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ModelPhotoViewer: React.FC<ModelPhotoViewerProps> = ({
  assets,
  initialIndex = 0,
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : assets.length - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < assets.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, assets.length, onClose]);

  if (!isOpen || assets.length === 0) return null;

  const currentAsset = assets[currentIndex] || assets[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh người mẫu phóng to"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Header: Counter & Close Button */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between text-white z-10">
        <span className="text-sm font-medium px-3 py-1 rounded-full bg-black/50 border border-white/20 tabular-nums">
          {currentIndex + 1} / {assets.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng trình xem ảnh"
          className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 flex items-center justify-center transition-colors border border-white/20"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Main Image Viewport */}
      <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center p-2">
        <img
          src={currentAsset.viewUrl}
          alt={currentAsset.originalFilename}
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl transition-all"
        />

        {/* Previous Button */}
        {assets.length > 1 && (
          <button
            type="button"
            aria-label="Ảnh trước"
            onClick={() =>
              setCurrentIndex((prev) => (prev > 0 ? prev - 1 : assets.length - 1))
            }
            className="absolute left-2 sm:-left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Button */}
        {assets.length > 1 && (
          <button
            type="button"
            aria-label="Ảnh kế tiếp"
            onClick={() =>
              setCurrentIndex((prev) => (prev < assets.length - 1 ? prev + 1 : 0))
            }
            className="absolute right-2 sm:-right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Filename Caption */}
      <div className="absolute bottom-4 inset-x-4 text-center">
        <span className="text-xs text-white/80 bg-black/50 px-3 py-1 rounded-md max-w-sm truncate inline-block border border-white/10">
          {currentAsset.originalFilename} {currentAsset.isCover && '• Ảnh đại diện'}
        </span>
      </div>
    </div>
  );
};
