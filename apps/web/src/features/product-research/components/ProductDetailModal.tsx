import React, { useState } from 'react';
import {
  ExternalLink,
  PlusCircle,
  Sparkles,
  TrendingUp,
  Percent,
  Store,
} from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { MarketplaceProductItem } from '../types/research.types';

export interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: MarketplaceProductItem | null;
  onHandoffToStudio: (product: MarketplaceProductItem) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  onHandoffToStudio,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!product) return null;

  const activeImage = selectedImage || product.primary_image_url;
  const opp = product.opportunity_score;
  const gallery = product.image_gallery.length > 0 ? product.image_gallery : [product.primary_image_url];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết nghiên cứu sản phẩm TikTok Shop"
      maxWidth="max-w-4xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-slate-800">
        {/* Left Column: Gallery */}
        <div className="md:col-span-5 space-y-3">
          <div className="aspect-[3/4] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center">
            <img
              src={activeImage}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnails */}
          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`w-14 h-18 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                    activeImage === img ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Shop Source Info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center justify-between font-semibold text-slate-900">
              <span className="flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-indigo-600" />
                {product.shop_name || 'TikTok Shop'}
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded uppercase">
                {product.region}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              ID: {product.source_product_id}
            </p>
            <p className="text-[11px] text-slate-500">
              Cập nhật: {new Date(product.updated_at).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Right Column: Commercial Analysis & Details */}
        <div className="md:col-span-7 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {product.internal_category === 'WOMEN_FASHION'
                  ? 'Thời trang Nữ'
                  : product.internal_category === 'MEN_FASHION'
                  ? 'Thời trang Nam'
                  : product.internal_category}
              </span>
              {product.collaboration_status === 'OPEN_COLLABORATION' ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Open Collaboration
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Targeted Collaboration
                </span>
              )}
            </div>

            <h2 className="text-base font-extrabold text-slate-900 leading-snug">
              {product.title}
            </h2>
          </div>

          {/* Commercial Pricing & Commission Section */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-indigo-100/70">
            {/* Price Box */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">Giá bán thực tế</span>
              <div className="text-xl font-black text-slate-900">
                {product.pricing.display_price}
              </div>
              {product.pricing.original_price && (
                <div className="text-xs text-slate-400 line-through">
                  Giá gốc: {Math.round(product.pricing.original_price).toLocaleString('vi-VN')} đ
                </div>
              )}
            </div>

            {/* Commission Box */}
            <div className="space-y-1 border-l border-slate-200 pl-3.5">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-indigo-600" />
                Hoa hồng Affiliate
              </span>
              <div className="text-xl font-black text-indigo-700">
                {product.commission.rate_percent !== null ? `${product.commission.rate_percent}%` : 'N/A'}
              </div>
              {product.commission.estimated_amount != null && (
                <div className="text-xs font-semibold text-emerald-600">
                  ≈ {Math.round(product.commission.estimated_amount || 0).toLocaleString('vi-VN')} đ / đơn (Ước tính)
                </div>
              )}
            </div>
          </div>

          {/* Opportunity Score Analysis */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Đánh giá tiềm năng (Opportunity Score)
              </span>
              <span
                className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                  opp.grade === 'A'
                    ? 'bg-emerald-100 text-emerald-800'
                    : opp.grade === 'B'
                    ? 'bg-blue-100 text-blue-800'
                    : opp.grade === 'C'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {opp.score !== null ? `${opp.score}/100 (Hạng ${opp.grade})` : 'Thiếu dữ liệu'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{opp.explanation}</p>

            {opp.breakdown && (
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-[10px] text-center font-semibold text-slate-600">
                <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block font-normal">Hoa hồng</span>
                  {opp.breakdown.commission_score}/35
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block font-normal">Doanh số</span>
                  {opp.breakdown.sales_score}/30
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block font-normal">Mức giá</span>
                  {opp.breakdown.price_accessibility_score}/20
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block font-normal">Hợp tác</span>
                  {opp.breakdown.collaboration_score}/15
                </div>
              </div>
            )}
          </div>

          {/* Sales Performance (Verified Reality) */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Hiệu suất bán hàng (TikTok Shop Sales Data)
            </span>
            {product.sales.is_available ? (
              <div className="grid grid-cols-2 gap-2 pt-1 font-semibold text-slate-800">
                <div>Đã bán 30 ngày: <span className="text-emerald-700">{product.sales.units_sold_30d?.toLocaleString('vi-VN')} đơn vị</span></div>
                {product.sales.gmv_30d && (
                  <div>GMV ước tính: <span className="text-emerald-700">{Math.round(product.sales.gmv_30d).toLocaleString('vi-VN')} đ</span></div>
                )}
              </div>
            ) : (
              <p className="text-slate-400 italic text-[11px] pt-0.5">
                Chưa có dữ liệu thống kê doanh số từ API đối tác cho sản phẩm này.
              </p>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-700">Mô tả sản phẩm</span>
              <p className="text-slate-600 line-clamp-3 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {product.description}
              </p>
            </div>
          )}

          {/* Footer CTAs */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 gap-3">
            <a
              href={product.product_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 inline-flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Xem trên TikTok Shop
            </a>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Đóng
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  onHandoffToStudio(product);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Đưa vào Studio sản xuất
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
