import React, { useState, useMemo } from 'react';
import { Search, Package, Sparkles } from 'lucide-react';
import { ProductAssetSummaryResponse } from '../types/product.types';
import { ProductAssetCard } from './ProductAssetCard';
import { Button } from '@/components/ui/Button';

interface ProductAssetListProps {
  products: ProductAssetSummaryResponse[];
  onViewDetails: (productId: string) => void;
  onDelete: (productId: string) => void;
  onAddNewClick: () => void;
  isDeletingId?: string | null;
}

export const ProductAssetList: React.FC<ProductAssetListProps> = ({
  products,
  onViewDetails,
  onDelete,
  onAddNewClick,
  isDeletingId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const term = searchTerm.toLowerCase();
    return products.filter((p) => {
      const title = (p.custom_title || p.title).toLowerCase();
      const brand = (p.brand || '').toLowerCase();
      const domain = p.source_domain.toLowerCase();
      return title.includes(term) || brand.includes(term) || domain.includes(term);
    });
  }, [products, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Top Filter and Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Sản phẩm trong dự án
            </h3>
            <p className="text-[11px] text-slate-500">
              Tổng số <span className="font-semibold text-slate-800">{products.length}</span> tài nguyên sản phẩm đã lưu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {products.length > 0 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên, hãng..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
              />
            </div>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={onAddNewClick}
            className="gap-1.5 text-xs shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Trích xuất sản phẩm mới
          </Button>
        </div>
      </div>

      {/* Grid or Empty State */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((p) => (
            <ProductAssetCard
              key={p.product_id}
              product={p}
              onViewDetails={onViewDetails}
              onDelete={onDelete}
              isDeleting={isDeletingId === p.product_id}
            />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
          <p className="text-xs text-slate-500">
            Không tìm thấy sản phẩm nào phù hợp với từ khóa &ldquo;{searchTerm}&rdquo;.
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-indigo-600 hover:underline font-medium"
          >
            Xóa bộ lọc tìm kiếm
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Dự án chưa có sản phẩm thời trang nào
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Dán link từ cửa hàng trực tuyến (Shopify, WooCommerce, Zara, Shein...) để trích xuất ảnh gốc chất lượng cao và thông tin sản phẩm.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={onAddNewClick}
              className="gap-1.5 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Thêm sản phẩm đầu tiên
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
