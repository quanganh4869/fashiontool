import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Star,
  HardDrive,
  Hash,
  Maximize2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProductImageSource } from '../types/product.types';
import { productService } from '../services/product.service';

interface ProductGalleryViewerProps {
  images: ProductImageSource[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onSetPrimary?: (imageId: string) => void;
  primaryImageId?: string;
}

export const ProductGalleryViewer: React.FC<ProductGalleryViewerProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  onSetPrimary,
  primaryImageId,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setScale(1);
  }, [initialIndex, isOpen]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setScale(1);
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setScale(1);
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  if (!currentImage) return null;

  const resolvedUrl = productService.resolveImageUrl(currentImage.view_url || currentImage.source_url);
  const isPrimary = primaryImageId
    ? currentImage.image_id === primaryImageId
    : currentImage.is_primary;

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const handleResetZoom = () => setScale(1);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-between p-4 select-none">
      {/* Top Header Bar */}
      <div className="w-full max-w-6xl flex items-center justify-between text-white py-2 px-4 bg-slate-900/80 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-200">
            Chi tiết ảnh {currentIndex + 1} / {images.length}
          </span>
          {isPrimary && (
            <span className="flex items-center gap-1 text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
              <Star className="w-3 h-3 fill-amber-300" />
              Ảnh chính
            </span>
          )}
        </div>

        {/* Zoom Controls & Close */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button
              onClick={handleZoomOut}
              className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-2 text-xs font-mono text-slate-300 hover:text-white"
              title="Đặt lại zoom"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {onSetPrimary && !isPrimary && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onSetPrimary(currentImage.image_id)}
              className="gap-1.5 text-xs bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700"
            >
              <Star className="w-3.5 h-3.5" />
              Đặt làm ảnh chính
            </Button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image View Area */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden my-4">
        {/* Left Nav Button */}
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 z-10 p-3 rounded-full bg-slate-900/70 hover:bg-slate-800 text-white border border-slate-700 shadow-lg backdrop-blur-xs transition-all hover:scale-105"
            title="Ảnh trước (Mũi tên trái)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Image Stage */}
        <div className="max-w-4xl max-h-[70vh] flex items-center justify-center p-2">
          <img
            src={resolvedUrl}
            alt={`Ảnh sản phẩm ${currentIndex + 1}`}
            style={{ transform: `scale(${scale})` }}
            className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-150"
          />
        </div>

        {/* Right Nav Button */}
        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 z-10 p-3 rounded-full bg-slate-900/70 hover:bg-slate-800 text-white border border-slate-700 shadow-lg backdrop-blur-xs transition-all hover:scale-105"
            title="Ảnh tiếp theo (Mũi tên phải)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Technical Metadata Details */}
      <div className="w-full max-w-6xl bg-slate-900/90 rounded-xl p-3 text-xs text-slate-300 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
            Kích thước:{' '}
            <strong className="text-white font-mono">
              {currentImage.width && currentImage.height
                ? `${currentImage.width} × ${currentImage.height} px`
                : 'Chưa có metadata kích thước'}
            </strong>
          </span>

          <span className="flex items-center gap-1.5 text-slate-400">
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            Dung lượng:{' '}
            <strong className="text-white font-mono">
              {productService.formatBytes(currentImage.file_size_bytes)}
            </strong>{' '}
            ({currentImage.mime_type})
          </span>

          <span className="flex items-center gap-1.5 text-slate-400" title={currentImage.checksum_sha256}>
            <Hash className="w-3.5 h-3.5 text-indigo-400" />
            SHA-256:{' '}
            <strong className="text-emerald-400 font-mono">
              {currentImage.checksum_sha256
                ? `${currentImage.checksum_sha256.substring(0, 12)}...`
                : 'N/A'}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {currentImage.source_url && (
            <a
              href={currentImage.source_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Nguồn ảnh gốc
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
