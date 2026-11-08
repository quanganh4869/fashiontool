import React from 'react';
import {
  Sparkles,
  PlusCircle,
  Eye,
  CheckSquare,
  Square,
  TrendingUp,
  Percent,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MarketplaceProductItem } from '../types/research.types';

export interface ProductCardProps {
  product: MarketplaceProductItem;
  isSelectedForCompare?: boolean;
  onToggleCompare?: (product: MarketplaceProductItem) => void;
  onViewDetail: (product: MarketplaceProductItem) => void;
  onHandoffToStudio: (product: MarketplaceProductItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSelectedForCompare = false,
  onToggleCompare,
  onViewDetail,
  onHandoffToStudio,
}) => {
  const opp = product.opportunity_score;
  const grade = opp.grade;

  // Grade color scheme
  const gradeStyles: Record<string, { bg: string; text: string; border: string }> = {
    A: { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600' },
    B: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700' },
    C: { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600' },
    D: { bg: 'bg-slate-400', text: 'text-white', border: 'border-slate-500' },
    'N/A': { bg: 'bg-slate-200', text: 'text-slate-600', border: 'border-slate-300' },
  };

  const currentGradeStyle = gradeStyles[grade] || gradeStyles['N/A'];

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Product Image Section */}
      <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
        {product.primary_image_url ? (
          <img
            src={product.primary_image_url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
            Chưa có hình ảnh
          </div>
        )}

        {/* Opportunity Score Pill */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 shadow-sm">
          <span
            className={`h-6 px-2 rounded-lg text-[11px] font-black tracking-wide flex items-center gap-1 border ${currentGradeStyle.bg} ${currentGradeStyle.text} ${currentGradeStyle.border}`}
            title={opp.explanation}
          >
            <Sparkles className="w-3 h-3" />
            {opp.score !== null ? `${opp.score}đ (Hạng ${grade})` : 'Chưa đủ dữ liệu'}
          </span>
        </div>

        {/* Compare Checkbox */}
        {onToggleCompare && (
          <button
            type="button"
            onClick={() => onToggleCompare(product)}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors"
            title={isSelectedForCompare ? 'Bỏ chọn so sánh' : 'Chọn để so sánh'}
          >
            {isSelectedForCompare ? (
              <CheckSquare className="w-4 h-4 text-indigo-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-200" />
            )}
          </button>
        )}

        {/* Collaboration Status Banner */}
        <div className="absolute bottom-2 left-2 right-2">
          {product.collaboration_status === 'OPEN_COLLABORATION' ? (
            <span className="inline-block text-[10px] font-bold text-emerald-800 bg-white/95 px-2 py-0.5 rounded-md shadow-sm border border-emerald-100 backdrop-blur-sm">
              Open Collaboration (Nhận hoa hồng tự do)
            </span>
          ) : (
            <span className="inline-block text-[10px] font-bold text-amber-800 bg-white/95 px-2 py-0.5 rounded-md shadow-sm border border-amber-100 backdrop-blur-sm">
              Targeted (Lời mời riêng)
            </span>
          )}
        </div>
      </div>

      {/* Product Content Section */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {/* Shop & Region */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1 truncate max-w-[180px]">
              <Store className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{product.shop_name || 'TikTok Shop'}</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {product.region}
            </span>
          </div>

          {/* Product Title */}
          <h3
            className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors cursor-pointer"
            onClick={() => onViewDetail(product)}
            title={product.title}
          >
            {product.title}
          </h3>
        </div>

        {/* Commercial Metrics Grid */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          {/* Price */}
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-black text-slate-900">
                {product.pricing.display_price}
              </span>
              {product.pricing.original_price && (
                <span className="text-[11px] text-slate-400 line-through">
                  {Math.round(product.pricing.original_price).toLocaleString('vi-VN')} đ
                </span>
              )}
            </div>

            {product.pricing.discount_percentage && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                -{product.pricing.discount_percentage}%
              </span>
            )}
          </div>

          {/* Commission & Sales */}
          <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                <Percent className="w-3 h-3 text-indigo-500" />
                Hoa hồng
              </span>
              <div className="font-extrabold text-indigo-700">
                {product.commission.rate_percent !== null ? (
                  <>
                    {product.commission.rate_percent}%{' '}
                    <span className="text-[9px] font-medium text-slate-500 block">
                      ≈ {Math.round(product.commission.estimated_amount || 0).toLocaleString('vi-VN')}đ
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400 font-normal">Chưa có DL</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                Đã bán (30d)
              </span>
              <div className="font-extrabold text-slate-900">
                {product.sales.units_sold_30d != null ? (
                  <>
                    {product.sales.units_sold_30d.toLocaleString('vi-VN')}{' '}
                    <span className="text-[9px] font-medium text-slate-500 block">đơn vị</span>
                  </>
                ) : (
                  <span className="text-slate-400 font-normal">Chưa có DL</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewDetail(product)}
            title="Xem chi tiết sản phẩm"
            className="text-xs text-slate-700 hover:text-slate-900 gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            Chi tiết
          </Button>

          <Button
            size="sm"
            onClick={() => onHandoffToStudio(product)}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1 shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Vào Studio
          </Button>
        </div>
      </div>
    </div>
  );
};
