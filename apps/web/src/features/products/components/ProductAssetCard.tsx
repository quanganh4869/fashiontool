import React from 'react';
import {
  Trash2,
  Eye,
  ExternalLink,
  Images,
  Building2,
  Shirt,
} from 'lucide-react';
import { ProductAssetSummaryResponse } from '../types/product.types';
import { productService } from '../services/product.service';

interface ProductAssetCardProps {
  product: ProductAssetSummaryResponse;
  onViewDetails: (productId: string) => void;
  onDelete: (productId: string) => void;
  onStartReplacement?: (productId: string) => void;
  isDeleting?: boolean;
}

export const ProductAssetCard: React.FC<ProductAssetCardProps> = ({
  product,
  onViewDetails,
  onDelete,
  onStartReplacement,
  isDeleting = false,
}) => {
  const displayTitle = product.custom_title || product.title;
  const primaryUrl = productService.resolveImageUrl(product.primary_image_url);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group">
      {/* Image Container */}
      <div className="relative aspect-[3/4] bg-[#F6F5F2] overflow-hidden flex items-center justify-center">
        {primaryUrl ? (
          <img
            src={primaryUrl}
            alt={displayTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-[#74716D] text-xs">
            <Images className="w-8 h-8 mb-1" />
            <span>Chưa có ảnh</span>
          </div>
        )}

        {/* Total Images Pill */}
        <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs text-[#242321] border border-[#E8E5E0] text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
          <Images className="w-3 h-3 text-[#654B7B]" />
          {product.total_images_count} ảnh
        </div>

        {/* Source Domain Badge */}
        <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-xs text-[#242321] border border-[#E8E5E0] text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 font-mono shadow-xs">
          <span>{product.source_domain}</span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 truncate max-w-[140px]">
              <Building2 className="w-3 h-3 text-slate-400" />
              {product.brand || 'Thương hiệu'}
            </span>
            <span className="font-semibold text-emerald-700 font-mono">
              {productService.formatPrice(product.price, product.currency)}
            </span>
          </div>

          <h4
            className="text-xs font-bold text-slate-900 line-clamp-2 title-tooltip cursor-pointer hover:text-indigo-600 transition-colors"
            title={displayTitle}
            onClick={() => onViewDetails(product.product_id)}
          >
            {displayTitle}
          </h4>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
          {onStartReplacement && (
            <button
              type="button"
              onClick={() => onStartReplacement(product.product_id)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
              title="Thay trang phục bằng sản phẩm này"
            >
              <Shirt className="w-3.5 h-3.5" />
              Thay đồ
            </button>
          )}

          <button
            type="button"
            onClick={() => onViewDetails(product.product_id)}
            className={`${
              onStartReplacement ? 'px-2' : 'flex-1'
            } flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors`}
          >
            <Eye className="w-3.5 h-3.5" />
            Chi tiết
          </button>

          <a
            href={product.source_url}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Mở link gốc"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            disabled={isDeleting}
            onClick={() => {
              if (window.confirm(`Xác nhận xóa sản phẩm "${displayTitle}" khỏi dự án?`)) {
                onDelete(product.product_id);
              }
            }}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Xóa khỏi dự án"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
