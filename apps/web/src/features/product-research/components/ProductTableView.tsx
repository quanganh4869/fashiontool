import React from 'react';
import { Eye, PlusCircle, CheckSquare, Square, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MarketplaceProductItem } from '../types/research.types';

export interface ProductTableViewProps {
  products: MarketplaceProductItem[];
  selectedCompareIds: string[];
  onToggleCompare: (product: MarketplaceProductItem) => void;
  onViewDetail: (product: MarketplaceProductItem) => void;
  onHandoffToStudio: (product: MarketplaceProductItem) => void;
}

export const ProductTableView: React.FC<ProductTableViewProps> = ({
  products,
  selectedCompareIds,
  onToggleCompare,
  onViewDetail,
  onHandoffToStudio,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-3 w-10 text-center">So sánh</th>
              <th className="py-3 px-3 w-16">Ảnh</th>
              <th className="py-3 px-4 min-w-[220px]">Sản phẩm & Cửa hàng</th>
              <th className="py-3 px-3">Danh mục</th>
              <th className="py-3 px-3 text-right">Giá bán</th>
              <th className="py-3 px-3 text-right">Hoa hồng</th>
              <th className="py-3 px-3 text-right">Đã bán (30d)</th>
              <th className="py-3 px-3 text-center">Hợp tác</th>
              <th className="py-3 px-3 text-center">Điểm cơ hội</th>
              <th className="py-3 px-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {products.map((p) => {
              const isSelected = selectedCompareIds.includes(p.product_id);
              const opp = p.opportunity_score;
              return (
                <tr key={p.product_id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Select Checkbox */}
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleCompare(p)}
                      title={isSelected ? 'Bỏ chọn so sánh' : 'Chọn để so sánh'}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>

                  {/* Thumbnail */}
                  <td className="py-3 px-3">
                    <div className="w-12 h-16 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                      <img
                        src={p.primary_image_url}
                        alt={p.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </td>

                  {/* Title & Shop */}
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      <span
                        onClick={() => onViewDetail(p)}
                        className="font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer line-clamp-2"
                      >
                        {p.title}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Shop: {p.shop_name || 'TikTok Shop'} ({p.region})
                      </span>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-3">
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {p.internal_category === 'WOMEN_FASHION'
                        ? 'Nữ'
                        : p.internal_category === 'MEN_FASHION'
                        ? 'Nam'
                        : p.internal_category}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                    {p.pricing.display_price}
                  </td>

                  {/* Commission */}
                  <td className="py-3 px-3 text-right">
                    {p.commission.rate_percent !== null ? (
                      <div className="font-extrabold text-indigo-600">
                        {p.commission.rate_percent}%
                        <span className="text-[10px] text-slate-400 block font-normal">
                          ≈ {Math.round(p.commission.estimated_amount || 0).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </td>

                  {/* Units Sold */}
                  <td className="py-3 px-3 text-right font-bold text-slate-800">
                    {p.sales.units_sold_30d != null
                      ? p.sales.units_sold_30d.toLocaleString('vi-VN')
                      : <span className="text-slate-400 font-normal">Chưa có DL</span>}
                  </td>

                  {/* Collaboration Status */}
                  <td className="py-3 px-3 text-center">
                    {p.collaboration_status === 'OPEN_COLLABORATION' ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Open
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Targeted
                      </span>
                    )}
                  </td>

                  {/* Opportunity Score */}
                  <td className="py-3 px-3 text-center">
                    {opp.score !== null ? (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md ${
                          opp.grade === 'A'
                            ? 'bg-emerald-100 text-emerald-800'
                            : opp.grade === 'B'
                            ? 'bg-blue-100 text-blue-800'
                            : opp.grade === 'C'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                        title={opp.explanation}
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        {opp.score} ({opp.grade})
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Thiếu DL</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onViewDetail(p)}
                        className="h-8 px-2 text-xs text-slate-700"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onHandoffToStudio(p)}
                        className="h-8 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1"
                        title="Đưa vào Studio"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Vào Studio
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
