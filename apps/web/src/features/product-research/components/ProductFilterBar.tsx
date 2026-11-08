import React from 'react';
import {
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  History,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  FashionCategory,
  ProductCollaborationStatus,
  ProductResearchSearchRequest,
} from '../types/research.types';

export interface ProductFilterBarProps {
  categories?: FashionCategory[];
  filters: ProductResearchSearchRequest;
  onChange: (updated: Partial<ProductResearchSearchRequest>) => void;
  onReset: () => void;
  viewMode: 'grid' | 'table';
  onToggleViewMode: (mode: 'grid' | 'table') => void;
  onOpenHistory: () => void;
  historyCount?: number;
  totalResults: number;
}

export const ProductFilterBar: React.FC<ProductFilterBarProps> = ({
  categories = [],
  filters,
  onChange,
  onReset,
  viewMode,
  onToggleViewMode,
  onOpenHistory,
  historyCount = 0,
  totalResults,
}) => {
  const selectedCat = categories.find((c) => c.id === filters.category_id);
  const subcategories = selectedCat?.subcategories || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 space-y-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Results Counter & Fast Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-800">
            Tìm thấy{' '}
            <span className="text-indigo-600 font-extrabold">{totalResults}</span>{' '}
            sản phẩm
          </span>

          <span className="text-slate-300">|</span>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-medium">Danh mục:</span>
              <select
                value={filters.category_id || ''}
                aria-label="Danh mục thời trang"
                onChange={(e) => {
                  onChange({
                    category_id: e.target.value || undefined,
                    subcategory_id: undefined,
                    page: 1,
                  });
                }}
                className="h-8 px-2.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white cursor-pointer"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subcategory Filter */}
          {subcategories.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-medium">Chi tiết:</span>
              <select
                value={filters.subcategory_id || ''}
                aria-label="Tiểu danh mục thời trang"
                onChange={(e) => {
                  onChange({
                    subcategory_id: e.target.value || undefined,
                    page: 1,
                  });
                }}
                className="h-8 px-2.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white cursor-pointer"
              >
                <option value="">Tất cả tiểu mục</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Collaboration Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium">Hợp tác:</span>
            <select
              value={filters.collaboration_status || ''}
              aria-label="Tình trạng hợp tác"
              onChange={(e) =>
                onChange({
                  collaboration_status: (e.target.value as ProductCollaborationStatus) || undefined,
                  page: 1,
                })
              }
              className="h-8 px-2.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white cursor-pointer"
            >
              <option value="">Tất cả hình thức</option>
              <option value="OPEN_COLLABORATION">Open Collaboration (Mở tự do)</option>
              <option value="TARGETED_COLLABORATION">Targeted (Lời mời riêng)</option>
            </select>
          </div>

          {/* Min Commission Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium">Hoa hồng:</span>
            <select
              value={filters.commission_min !== undefined ? filters.commission_min : ''}
              aria-label="Tỷ lệ hoa hồng tối thiểu"
              onChange={(e) =>
                onChange({
                  commission_min: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                })
              }
              className="h-8 px-2.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white cursor-pointer"
            >
              <option value="">Tất cả mức hoa hồng</option>
              <option value="10">Từ 10% trở lên</option>
              <option value="15">Từ 15% trở lên</option>
              <option value="20">Từ 20% trở lên (Hấp dẫn)</option>
            </select>
          </div>

          {/* Price Range Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium">Khoảng giá:</span>
            <select
              value={
                filters.price_max === 200000
                  ? 'under_200k'
                  : filters.price_min === 200000 && filters.price_max === 500000
                  ? '200k_500k'
                  : filters.price_min === 500000
                  ? 'over_500k'
                  : ''
              }
              aria-label="Khoảng giá"
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'under_200k') {
                  onChange({ price_min: undefined, price_max: 200000, page: 1 });
                } else if (val === '200k_500k') {
                  onChange({ price_min: 200000, price_max: 500000, page: 1 });
                } else if (val === 'over_500k') {
                  onChange({ price_min: 500000, price_max: undefined, page: 1 });
                } else {
                  onChange({ price_min: undefined, price_max: undefined, page: 1 });
                }
              }}
              className="h-8 px-2.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white cursor-pointer"
            >
              <option value="">Tất cả mức giá</option>
              <option value="under_200k">Dưới 200.000đ</option>
              <option value="200k_500k">200.000đ - 500.000đ</option>
              <option value="over_500k">Trên 500.000đ</option>
            </select>
          </div>
        </div>

        {/* Right side: Sorting, View Mode & Reset */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Sorting */}
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={`${filters.sort_by}_${filters.sort_dir}`}
              aria-label="Sắp xếp kết quả"
              onChange={(e) => {
                const parts = e.target.value.split('_');
                const sort_dir = parts.pop() || 'desc';
                const sort_by = parts.join('_');
                onChange({ sort_by, sort_dir, page: 1 });
              }}
              className="h-8 px-2.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white cursor-pointer"
            >
              <option value="opportunity_score_desc">Điểm cơ hội cao nhất</option>
              <option value="commission_desc">Hoa hồng cao nhất</option>
              <option value="sales_desc">Doanh số cao nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
              <option value="title_asc">Tên sản phẩm (A-Z)</option>
            </select>
          </div>

          {/* Reset Filters */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onReset}
            className="h-8 px-2.5 text-xs text-slate-600 gap-1"
            title="Đặt lại toàn bộ bộ lọc"
          >
            <RotateCcw className="w-3 h-3" />
            Xóa lọc
          </Button>

          {/* History */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenHistory}
            className="h-8 px-2.5 text-xs text-slate-600 gap-1.5"
            title="Xem lịch sử tìm kiếm"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            Lịch sử
            {historyCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                {historyCount}
              </span>
            )}
          </Button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => onToggleViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Dạng lưới thẻ ảnh"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Dạng bảng chi tiết"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
