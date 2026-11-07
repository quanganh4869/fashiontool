import React, { useState } from 'react';
import {
  Save,
  RotateCcw,
  Star,
  ExternalLink,
  Tag,
  AlertTriangle,
  ZoomIn,
  Building2,
  DollarSign,
  Barcode,
  Images,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ExtractionJobResponse } from '../types/product.types';
import { productService } from '../services/product.service';
import { ProductGalleryViewer } from './ProductGalleryViewer';

interface ProductExtractionPreviewProps {
  job: ExtractionJobResponse;
  onSave: (payload: {
    customTitle?: string;
    customDescription?: string;
    primaryImageId?: string;
  }) => void;
  onReset: () => void;
  isSaving: boolean;
}

export const ProductExtractionPreview: React.FC<ProductExtractionPreviewProps> = ({
  job,
  onSave,
  onReset,
  isSaving,
}) => {
  const extracted = job.extracted_data;

  const [customTitle, setCustomTitle] = useState(extracted?.title || '');
  const [customDescription, setCustomDescription] = useState(
    extracted?.description || ''
  );
  const [primaryImageId, setPrimaryImageId] = useState<string>(
    extracted?.images.find((img) => img.is_primary)?.image_id ||
      extracted?.images[0]?.image_id ||
      ''
  );

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!extracted) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
        Không tìm thấy dữ liệu sản phẩm đã trích xuất.
      </div>
    );
  }

  const handleSave = () => {
    onSave({
      customTitle: customTitle.trim() || undefined,
      customDescription: customDescription.trim() || undefined,
      primaryImageId: primaryImageId || undefined,
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 bg-emerald-100 text-emerald-700 rounded-md">
              <Images className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              Kiểm tra & Xác nhận thông tin sản phẩm
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dữ liệu trích xuất từ{' '}
            <a
              href={job.source_url}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-medium"
            >
              {extracted.source_domain}
              <ExternalLink className="w-3 h-3" />
            </a>
            . Vui lòng rà soát gallery ảnh gốc và tinh chỉnh tiêu đề trước khi lưu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onReset}
            disabled={isSaving}
            className="gap-1.5 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Nhập link khác
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            className="gap-1.5 text-xs shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            Lưu sản phẩm vào dự án
          </Button>
        </div>
      </div>

      {/* Warnings Banner if any */}
      {extracted.warnings && extracted.warnings.length > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Cảnh báo dữ liệu trích xuất ({extracted.warnings.length})</span>
          </div>
          <ul className="list-disc list-inside text-[11px] text-amber-700 space-y-0.5">
            {extracted.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Product Metadata Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
          <span className="text-slate-400 block text-[11px] flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Thương hiệu
          </span>
          <span className="font-semibold text-slate-800 truncate block mt-0.5">
            {extracted.brand || 'Chưa xác định'}
          </span>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
          <span className="text-slate-400 block text-[11px] flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> Giá niêm yết
          </span>
          <span className="font-semibold text-emerald-700 truncate block mt-0.5 font-mono">
            {productService.formatPrice(extracted.price, extracted.currency)}
          </span>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
          <span className="text-slate-400 block text-[11px] flex items-center gap-1">
            <Tag className="w-3 h-3" /> Phân loại
          </span>
          <span className="font-semibold text-slate-800 truncate block mt-0.5">
            {extracted.category || 'Thời trang'}
          </span>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
          <span className="text-slate-400 block text-[11px] flex items-center gap-1">
            <Barcode className="w-3 h-3" /> SKU / Mã
          </span>
          <span className="font-semibold text-slate-800 font-mono truncate block mt-0.5">
            {extracted.sku || 'N/A'}
          </span>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs col-span-2 sm:col-span-1">
          <span className="text-slate-400 block text-[11px] flex items-center gap-1">
            <Images className="w-3 h-3" /> Số ảnh thu thập
          </span>
          <span className="font-semibold text-indigo-700 truncate block mt-0.5 font-mono">
            {extracted.images.length} ảnh gốc
          </span>
        </div>
      </div>

      {/* Editable Fields: Title and Description */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Tên sản phẩm hiển thị trong dự án <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Nhập tên nhận diện cho sản phẩm..."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {extracted.title && extracted.title !== customTitle && (
            <p className="text-[11px] text-slate-400 truncate">
              Tên gốc: {extracted.title}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Ghi chú / Mô tả đặc điểm trang phục
          </label>
          <input
            type="text"
            value={customDescription}
            onChange={(e) => setCustomDescription(e.target.value)}
            placeholder="Mô tả chất liệu, màu sắc nổi bật, form dáng..."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* High-Resolution Image Gallery */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Images className="w-4 h-4 text-indigo-600" />
            Bộ sưu tập ảnh gốc ({extracted.images.length})
          </h4>
          <span className="text-[11px] text-slate-400">
            Click vào ảnh để phóng to Lightbox và kiểm tra chi tiết
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {extracted.images.map((img, idx) => {
            const isPrimary = img.image_id === primaryImageId;
            const previewUrl = productService.resolveImageUrl(img.thumbnail_url || img.view_url);

            return (
              <div
                key={img.image_id}
                className={`group relative rounded-xl border overflow-hidden bg-slate-900 transition-all ${
                  isPrimary
                    ? 'ring-2 ring-indigo-600 border-indigo-600 shadow-sm'
                    : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                {/* Image Container with natural aspect ratio */}
                <div
                  onClick={() => setLightboxIndex(idx)}
                  className="aspect-[3/4] w-full cursor-pointer overflow-hidden flex items-center justify-center bg-slate-950"
                >
                  <img
                    src={previewUrl}
                    alt={`Ảnh ${idx + 1}`}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <ZoomIn className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                </div>

                {/* Primary Star Pill */}
                {isPrimary ? (
                  <div className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white" />
                    Chính
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPrimaryImageId(img.image_id)}
                    className="absolute top-2 left-2 bg-black/60 hover:bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                  >
                    <Star className="w-3 h-3" />
                    Đặt ảnh chính
                  </button>
                )}

                {/* Bottom Meta Bar */}
                <div className="p-2 bg-white text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-100">
                  <span className="font-mono">
                    {img.width && img.height ? `${img.width}×${img.height}` : 'Ảnh gốc'}
                  </span>
                  <span>{productService.formatBytes(img.file_size_bytes)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <ProductGalleryViewer
          images={extracted.images}
          initialIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          onSetPrimary={(id) => setPrimaryImageId(id)}
          primaryImageId={primaryImageId}
        />
      )}
    </div>
  );
};
