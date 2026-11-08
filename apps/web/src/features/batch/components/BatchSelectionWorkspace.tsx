import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Square,
  Search,
  Sparkles,
  ShieldCheck,
  Package,
  Film,
  Shirt,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModelTemplateGeneration } from '@/features/studio/types/studio.types';
import { ProductAssetSummaryResponse } from '@/features/products/types/product.types';
import { productService } from '@/features/products/services/product.service';

export interface BatchSelectionWorkspaceProps {
  generation: ModelTemplateGeneration;
  products: ProductAssetSummaryResponse[];
  onStartPreflight: (selectedProductIds: string[]) => void;
  isLoading?: boolean;
}

export const BatchSelectionWorkspace: React.FC<BatchSelectionWorkspaceProps> = ({
  generation,
  products,
  onStartPreflight,
  isLoading = false,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        (p.custom_title || p.title).toLowerCase().includes(term) ||
        (p.brand || '').toLowerCase().includes(term) ||
        p.source_domain.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const handleToggleProduct = (productId: string) => {
    setSelectedIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.product_id));
    }
  };

  const isAllSelected =
    filteredProducts.length > 0 && selectedIds.length === filteredProducts.length;

  return (
    <div className="space-y-5">
      {/* 1. Base Video Header Banner */}
      <div className="bg-white text-[#242321] rounded-2xl p-5 border border-[#E8E5E0] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#F6F5F2] border border-[#E8E5E0] flex items-center justify-center shrink-0">
            <Film className="w-6 h-6 text-[#654B7B]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#654B7B] uppercase tracking-wider">
                Personalized Base Video (Nguồn chung)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> READY
              </span>
            </div>
            <h3 className="text-base font-semibold text-[#242321] mt-0.5">
              Người mẫu: {generation.modelName} • Mẫu: {generation.templateTitle}
            </h3>
            <p className="text-xs text-[#74716D] mt-0.5">
              Độ phân giải: 1080x1920 (9:16) • FPS: 30 • Toàn bộ chuyển động và diện mạo sẽ được bảo toàn.
            </p>
          </div>
        </div>

        <div className="text-xs text-[#74716D] font-mono bg-[#F6F5F2] px-3 py-1.5 rounded-lg border border-[#E8E5E0]">
          Base ID: {(generation.outputVideoAssetId || generation.generationId).slice(0, 16)}...
        </div>
      </div>

      {/* 2. Selection Action & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-indigo-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>{isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</span>
          </button>

          <span className="text-xs font-semibold text-slate-600">
            Đã chọn:{' '}
            <strong className="text-indigo-600 font-bold font-mono text-sm">
              {selectedIds.length}
            </strong>{' '}
            / {products.length} sản phẩm
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên sản phẩm..."
              className="text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg w-48 sm:w-56 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <Button
            onClick={() => onStartPreflight(selectedIds)}
            disabled={selectedIds.length === 0 || isLoading}
            isLoading={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Kiểm tra đợt sản xuất ({selectedIds.length})
          </Button>
        </div>
      </div>

      {/* 3. Product Grid with Selectable Cards */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
            const isSelected = selectedIds.includes(p.product_id);
            const primaryUrl = productService.resolveImageUrl(p.primary_image_url);
            const displayTitle = p.custom_title || p.title;

            return (
              <div
                key={p.product_id}
                onClick={() => handleToggleProduct(p.product_id)}
                className={`bg-white border rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col relative group ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-sm'
                }`}
              >
                {/* Checkbox overlay pill */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white/80 backdrop-blur-xs text-slate-400 border border-slate-300'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Photo */}
                <div className="aspect-[3/4] bg-[#F6F5F2] overflow-hidden relative flex items-center justify-center">
                  {primaryUrl ? (
                    <img
                      src={primaryUrl}
                      alt={displayTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Shirt className="w-8 h-8 text-[#74716D]" />
                  )}

                  <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs text-[#242321] border border-[#E8E5E0] text-[10px] px-2 py-0.5 rounded-md font-mono shadow-xs">
                    {p.source_domain}
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {p.brand || 'Thương hiệu'}
                    </span>
                    <h4
                      className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5"
                      title={displayTitle}
                    >
                      {displayTitle}
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-700 font-semibold font-mono">
                      {productService.formatPrice(p.price, p.currency)}
                    </span>
                    <span className="text-slate-400 text-[10px]">{p.total_images_count} ảnh</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <Package className="w-10 h-10 mx-auto text-slate-400" />
          <h4 className="text-sm font-bold text-slate-800">Không tìm thấy sản phẩm nào</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Dự án hiện chưa có sản phẩm phù hợp. Hãy nhập thêm sản phẩm từ liên kết cửa hàng trước khi
            tạo đợt sản xuất hàng loạt.
          </p>
        </div>
      )}
    </div>
  );
};
