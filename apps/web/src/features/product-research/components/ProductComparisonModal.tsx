import React from 'react';
import { PlusCircle, Sparkles, Trash2 } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { MarketplaceProductItem } from '../types/research.types';

export interface ProductComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: MarketplaceProductItem[];
  onRemoveProduct: (productId: string) => void;
  onHandoffToStudio: (product: MarketplaceProductItem) => void;
}

export const ProductComparisonModal: React.FC<ProductComparisonModalProps> = ({
  isOpen,
  onClose,
  products,
  onRemoveProduct,
  onHandoffToStudio,
}) => {
  if (products.length === 0) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Đối chiếu so sánh ${products.length} sản phẩm thời trang`}
      maxWidth="max-w-5xl"
    >
      <div className="space-y-4 text-xs text-slate-800">
        <p className="text-slate-500 text-xs">
          So sánh trực quan các chỉ số thương mại, mức hoa hồng và tiềm năng để chọn ra sản phẩm tối ưu nhất cho video affiliate.
        </p>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-3 w-36 text-slate-500 font-bold uppercase text-[10px]">Chỉ số đối chiếu</th>
                {products.map((p) => (
                  <th key={p.product_id} className="p-3 min-w-[200px] align-top">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-16 h-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                        <img src={p.primary_image_url} alt={p.title} className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveProduct(p.product_id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Bỏ khỏi so sánh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="font-bold text-slate-900 line-clamp-2 mt-2 leading-snug">
                      {p.title}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {/* Price */}
              <tr>
                <td className="p-3 bg-slate-50/50 text-slate-500 font-bold">Giá bán</td>
                {products.map((p) => (
                  <td key={p.product_id} className="p-3 font-black text-slate-900 text-sm">
                    {p.pricing.display_price}
                  </td>
                ))}
              </tr>

              {/* Commission Rate & Amount */}
              <tr>
                <td className="p-3 bg-slate-50/50 text-slate-500 font-bold">Hoa hồng Affiliate</td>
                {products.map((p) => (
                  <td key={p.product_id} className="p-3">
                    {p.commission.rate_percent !== null ? (
                      <div className="font-extrabold text-indigo-700">
                        {p.commission.rate_percent}%
                        <span className="text-[11px] font-semibold text-emerald-600 block">
                          ≈ {Math.round(p.commission.estimated_amount || 0).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">Chưa có dữ liệu</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Opportunity Score */}
              <tr>
                <td className="p-3 bg-slate-50/50 text-slate-500 font-bold">Điểm cơ hội</td>
                {products.map((p) => {
                  const opp = p.opportunity_score;
                  return (
                    <td key={p.product_id} className="p-3">
                      {opp.score !== null ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-black ${
                            opp.grade === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : opp.grade === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          {opp.score}đ (Hạng {opp.grade})
                        </span>
                      ) : (
                        <span className="text-slate-400">Thiếu dữ liệu</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Units Sold */}
              <tr>
                <td className="p-3 bg-slate-50/50 text-slate-500 font-bold">Đã bán (30d)</td>
                {products.map((p) => (
                  <td key={p.product_id} className="p-3 font-semibold">
                    {p.sales.units_sold_30d != null
                      ? `${p.sales.units_sold_30d.toLocaleString('vi-VN')} đơn vị`
                      : <span className="text-slate-400 font-normal">Chưa có dữ liệu</span>}
                  </td>
                ))}
              </tr>

              {/* Collaboration Status */}
              <tr>
                <td className="p-3 bg-slate-50/50 text-slate-500 font-bold">Tình trạng hợp tác</td>
                {products.map((p) => (
                  <td key={p.product_id} className="p-3 font-semibold">
                    {p.collaboration_status === 'OPEN_COLLABORATION' ? (
                      <span className="text-emerald-700 font-bold">Open Collaboration</span>
                    ) : (
                      <span className="text-amber-700 font-bold">Targeted</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Shop */}
              <tr>
                <td className="p-3 bg-slate-50/50 text-slate-500 font-bold">Cửa hàng</td>
                {products.map((p) => (
                  <td key={p.product_id} className="p-3 text-slate-600">
                    {p.shop_name || 'TikTok Shop'} ({p.region})
                  </td>
                ))}
              </tr>

              {/* Actions */}
              <tr>
                <td className="p-3 bg-slate-50/50 text-slate-500 font-bold">Quyết định</td>
                {products.map((p) => (
                  <td key={p.product_id} className="p-3">
                    <Button
                      size="sm"
                      onClick={() => {
                        onClose();
                        onHandoffToStudio(p);
                      }}
                      className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Đưa vào Studio
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Đóng so sánh
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
