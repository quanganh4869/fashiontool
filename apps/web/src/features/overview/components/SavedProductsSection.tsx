import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RotateCcw, Package } from 'lucide-react';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SavedProduct } from '@/types/overview';
import { formatCurrency } from '@/utils/formatters';

export interface SavedProductsSectionProps {
  products: SavedProduct[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const SavedProductsSection: React.FC<SavedProductsSectionProps> = ({
  products,
  isLoading,
  error,
  onRetry,
}) => {
  const navigate = useNavigate();

  return (
    <section className="w-full bg-white border border-[#E8E5E0] rounded-xl flex flex-col overflow-hidden shadow-sm">
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-[#E8E5E0] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#242321]">Sản phẩm đã lưu gần đây</h2>
        <Link
          to="/products"
          className="text-sm font-medium text-[#74716D] hover:text-[#654B7B] focus:text-[#654B7B] transition-colors"
        >
          Nghiên cứu sản phẩm
        </Link>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 min-h-[260px] flex flex-col justify-center">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex items-center gap-3 p-2.5 rounded-lg border border-[#E8E5E0]">
                <Skeleton className="w-[52px] h-[52px] rounded-md shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center flex flex-col items-center justify-center gap-2">
            <p className="text-sm text-[#A94442] font-medium">Không thể tải danh sách sản phẩm đã lưu</p>
            <p className="text-xs text-[#74716D] max-w-sm">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#242321] bg-[#F6F5F2] hover:bg-[#EBE8E3] rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="Chưa lưu sản phẩm nào"
            description="Những sản phẩm bạn lưu trong khu vực nghiên cứu sẽ xuất hiện tại đây."
            className="border-none bg-transparent p-4 sm:p-6"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {products.slice(0, 4).map((product) => (
              <div
                key={product.productId}
                onClick={() => navigate(`/products/${product.productId}`)}
                className="group flex items-center gap-3 p-3 rounded-lg border border-[#E8E5E0] bg-[#FAF9F7] hover:bg-[#F2EDF5]/40 hover:border-[#D1C2DC] transition-all cursor-pointer"
              >
                {/* 52x52px Product Image */}
                <div className="w-[52px] h-[52px] rounded-md bg-white border border-[#E8E5E0] overflow-hidden shrink-0 flex items-center justify-center">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.productName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Package className="w-5 h-5 text-[#97938E]" />
                  )}
                </div>

                {/* Product Info */}
                <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                  <h3
                    className="text-xs sm:text-[13px] font-medium text-[#242321] line-clamp-2 leading-snug group-hover:text-[#654B7B] transition-colors"
                    title={product.productName}
                  >
                    {product.productName}
                  </h3>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-xs text-[#74716D] truncate max-w-[50%]">
                      {product.shopName || 'Cửa hàng TikTok'}
                    </span>
                    <span className="text-xs font-semibold text-[#242321] tabular-nums whitespace-nowrap">
                      {formatCurrency(product.price, product.currency || 'VND')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
