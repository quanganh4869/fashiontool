import React from 'react';
import { RotateCcw, Heart, SlidersHorizontal } from 'lucide-react';
import { TemplateCategory, TemplateSortBy, AssessmentFilterStatus } from '../types/template.types';

export interface TemplateFilterToolbarProps {
  categories: TemplateCategory[];
  activeCategory: string;
  onSelectCategory: (categoryId: string) => void;
  aspectRatio: string;
  onSelectAspectRatio: (val: string) => void;
  garmentSlot: string;
  onSelectGarmentSlot: (val: string) => void;
  assessmentStatus: AssessmentFilterStatus;
  onSelectAssessmentStatus: (val: AssessmentFilterStatus) => void;
  durationRange?: string;
  onSelectDurationRange: (val: string) => void;
  isFavorite?: boolean;
  onToggleFavoriteFilter: (val: boolean | undefined) => void;
  sortBy: TemplateSortBy;
  onSelectSortBy: (val: TemplateSortBy) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export const TemplateFilterToolbar: React.FC<TemplateFilterToolbarProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  aspectRatio,
  onSelectAspectRatio,
  garmentSlot,
  onSelectGarmentSlot,
  assessmentStatus,
  onSelectAssessmentStatus,
  durationRange,
  onSelectDurationRange,
  isFavorite,
  onToggleFavoriteFilter,
  sortBy,
  onSelectSortBy,
  hasActiveFilters,
  onResetFilters,
}) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Category Pills Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id || (!activeCategory && cat.id === 'all');
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#242321] text-white shadow-xs'
                  : 'bg-[#F6F5F2] text-[#55534E] hover:bg-[#ECEAE4] hover:text-[#242321]'
              }`}
            >
              <span>{cat.name}</span>
              {typeof cat.count === 'number' && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-black/5 text-[#74716D]'
                  }`}
                >
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Advanced Filters & Sorting Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#ECEAE4]">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-[#74716D] font-medium mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bộ lọc:</span>
          </div>

          {/* Aspect Ratio Filter */}
          <select
            value={aspectRatio}
            onChange={(e) => onSelectAspectRatio(e.target.value)}
            aria-label="Lọc theo tỷ lệ khung hình"
            className="px-2.5 py-1.5 bg-white border border-[#D8D4CE] rounded-lg text-[#242321] text-xs focus:outline-none focus:ring-1 focus:ring-[#242321] cursor-pointer"
          >
            <option value="all">Tỷ lệ: Tất cả</option>
            <option value="9:16">Dọc 9:16 (TikTok, Reels)</option>
            <option value="16:9">Ngang 16:9</option>
            <option value="1:1">Vuông 1:1</option>
          </select>

          {/* Garment Slot Filter */}
          <select
            value={garmentSlot}
            onChange={(e) => onSelectGarmentSlot(e.target.value)}
            aria-label="Lọc theo loại trang phục có thể thay thế"
            className="px-2.5 py-1.5 bg-white border border-[#D8D4CE] rounded-lg text-[#242321] text-xs focus:outline-none focus:ring-1 focus:ring-[#242321] cursor-pointer"
          >
            <option value="all">Trang phục: Tất cả</option>
            <option value="upper_body">Áo thân trên</option>
            <option value="lower_body">Quần / chân váy</option>
            <option value="dress_full_body">Váy liền thân</option>
            <option value="outerwear">Áo khoác ngoài</option>
          </select>

          {/* Assessment Status Filter */}
          <select
            value={assessmentStatus}
            onChange={(e) => onSelectAssessmentStatus(e.target.value as AssessmentFilterStatus)}
            aria-label="Lọc theo mức độ tương thích"
            className="px-2.5 py-1.5 bg-white border border-[#D8D4CE] rounded-lg text-[#242321] text-xs focus:outline-none focus:ring-1 focus:ring-[#242321] cursor-pointer"
          >
            <option value="ALL">Đánh giá: Tất cả</option>
            <option value="SUPPORTED">Tương thích tốt</option>
            <option value="LIMITED">Tương thích có giới hạn</option>
          </select>

          {/* Duration Range Filter */}
          <select
            value={durationRange || 'all'}
            onChange={(e) => onSelectDurationRange(e.target.value === 'all' ? '' : e.target.value)}
            aria-label="Lọc theo thời lượng video"
            className="px-2.5 py-1.5 bg-white border border-[#D8D4CE] rounded-lg text-[#242321] text-xs focus:outline-none focus:ring-1 focus:ring-[#242321] cursor-pointer"
          >
            <option value="all">Thời lượng: Tất cả</option>
            <option value="under_10s">&lt; 10 giây</option>
            <option value="10_20s">10 – 20 giây</option>
            <option value="20_30s">20 – 30 giây</option>
            <option value="over_30s">&gt; 30 giây</option>
          </select>

          {/* Favorites Filter Button */}
          <button
            type="button"
            onClick={() => onToggleFavoriteFilter(isFavorite ? undefined : true)}
            aria-pressed={Boolean(isFavorite)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              isFavorite
                ? 'bg-[#FFF0F0] border-[#E86060] text-[#D32F2F]'
                : 'bg-white border-[#D8D4CE] text-[#55534E] hover:border-[#242321]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-[#D32F2F]' : ''}`} />
            <span>Đã lưu</span>
          </button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#74716D] hover:text-[#242321] hover:bg-[#F6F5F2] rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          <span className="text-[#74716D] font-medium hidden sm:inline">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={(e) => onSelectSortBy(e.target.value as TemplateSortBy)}
            aria-label="Sắp xếp video mẫu"
            className="px-2.5 py-1.5 bg-white border border-[#D8D4CE] rounded-lg text-[#242321] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#242321] cursor-pointer"
          >
            <option value="updated_at_desc">Mới cập nhật</option>
            <option value="name_asc">Tên A – Z</option>
            <option value="duration_asc">Thời lượng: Ngắn nhất</option>
            <option value="duration_desc">Thời lượng: Dài nhất</option>
            <option value="usage_desc">Được sử dụng nhiều</option>
          </select>
        </div>
      </div>
    </div>
  );
};
