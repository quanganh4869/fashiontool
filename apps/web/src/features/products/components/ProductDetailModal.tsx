import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Save,
  Star,
  HardDrive,
  ZoomIn,
  Building2,
  DollarSign,
  Barcode,
  Calendar,
  Layers,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProductAssetResponse } from '../types/product.types';
import { productService } from '../services/product.service';
import { ProductGalleryViewer } from './ProductGalleryViewer';

interface ProductDetailModalProps {
  product: ProductAssetResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (productId: string, updates: {
    customTitle?: string;
    customDescription?: string;
    primaryImageId?: string;
  }) => Promise<void>;
  isUpdating?: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onUpdate,
  isUpdating = false,
}) => {
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [primaryImageId, setPrimaryImageId] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (product) {
      setCustomTitle(product.custom_title || product.title);
      setCustomDescription(product.custom_description || product.description || '');
      const primary = product.images.find((img) => img.is_primary)?.image_id;
      setPrimaryImageId(primary || product.images[0]?.image_id || '');
      setSaveSuccess(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleSave = async () => {
    await onUpdate(product.product_id, {
      customTitle: customTitle.trim() || undefined,
      customDescription: customDescription.trim() || undefined,
      primaryImageId: primaryImageId || undefined,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                {product.product_id}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {product.source_domain}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Chi tiết tài nguyên sản phẩm
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Metadata Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
              <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Thương hiệu
              </span>
              <span className="font-semibold text-slate-800 truncate block mt-0.5">
                {product.brand || 'N/A'}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
              <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Giá niêm yết
              </span>
              <span className="font-semibold text-emerald-700 font-mono truncate block mt-0.5">
                {product.price ? productService.formatPrice(product.price, product.currency) : 'Liên hệ'}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
              <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                <Barcode className="w-3 h-3" /> SKU / Mã
              </span>
              <span className="font-semibold text-slate-800 font-mono truncate block mt-0.5">
                {product.sku || 'N/A'}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
              <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Ngày trích xuất
              </span>
              <span className="font-semibold text-slate-800 truncate block mt-0.5">
                {new Date(product.created_at).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>

          {/* Edit Form */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tùy chỉnh thông tin trong dự án
            </h4>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Tên hiển thị sản phẩm
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Mô tả chi tiết / Ghi chú trang phục
              </label>
              <textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <a
                href={product.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Truy cập link sản phẩm gốc
              </a>

              <div className="flex items-center gap-2">
                {saveSuccess && (
                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Đã cập nhật
                  </span>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  isLoading={isUpdating}
                  className="gap-1.5 text-xs shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </div>

          {/* High Resolution Image Gallery */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                Ảnh gốc lưu trữ Local Filesystem ({product.images.length})
              </h4>
              <span className="text-[11px] text-slate-400">
                Click để mở phóng to Lightbox
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {product.images.map((img, idx) => {
                const isPrimary = img.image_id === primaryImageId;
                const viewUrl = productService.resolveImageUrl(img.thumbnail_url || img.view_url);

                return (
                  <div
                    key={img.image_id}
                    className={`group relative rounded-xl border overflow-hidden bg-slate-900 transition-all ${
                      isPrimary
                        ? 'ring-2 ring-indigo-600 border-indigo-600 shadow-sm'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <div
                      onClick={() => setLightboxIndex(idx)}
                      className="aspect-[3/4] w-full cursor-pointer overflow-hidden flex items-center justify-center bg-slate-950"
                    >
                      <img
                        src={viewUrl}
                        alt={`Ảnh ${idx + 1}`}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <ZoomIn className="w-6 h-6 text-white drop-shadow-md" />
                      </div>
                    </div>

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

                    <div className="p-2 bg-white text-[10px] text-slate-500 flex flex-col gap-0.5 border-t border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="font-mono">
                          {img.width && img.height ? `${img.width}×${img.height}` : 'Ảnh gốc'}
                        </span>
                        <span>{productService.formatBytes(img.file_size_bytes)}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono truncate" title={img.storage_path}>
                        <HardDrive className="w-2.5 h-2.5 inline mr-1" />
                        {img.storage_path.split('/').pop()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Đóng
          </Button>
        </div>
      </div>

      {/* Lightbox if triggered */}
      {lightboxIndex !== null && (
        <ProductGalleryViewer
          images={product.images}
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
