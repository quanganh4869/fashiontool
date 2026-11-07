import React from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';
import { ModelFilterStatus, ModelSortBy } from '../types/model-management.types';

export interface ModelFiltersProps {
  query: string;
  onQueryChange: (q: string) => void;
  status: ModelFilterStatus;
  onStatusChange: (status: ModelFilterStatus) => void;
  sortBy: ModelSortBy;
  onSortByChange: (sortBy: ModelSortBy) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const STATUS_OPTIONS: Array<{ value: ModelFilterStatus; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'READY', label: 'Sẵn sàng' },
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'ARCHIVED', label: 'Đã lưu trữ' },
];

export const ModelFilters: React.FC<ModelFiltersProps> = ({
  query,
  onQueryChange,
  status,
  onStatusChange,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="w-full bg-white border border-[#E8E5E0] rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <label htmlFor="model-search" className="sr-only">
          Tìm người mẫu
        </label>
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#74716D] pointer-events-none" />
        <input
          id="model-search"
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Nhập tên hoặc mã người mẫu..."
          className="w-full h-9 pl-9 pr-3 text-sm text-[#242321] placeholder:text-[#97938E] bg-[#FBFAF8] rounded-md border border-[#E8E5E0] focus:bg-white focus:outline-none focus:border-[#654B7B] focus:ring-2 focus:ring-[#654B7B]/20 transition-all"
        />
      </div>

      {/* Status Filter Pills & Sort & View Mode */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* Status Pills */}
        <div className="flex items-center bg-[#F6F5F2] p-1 rounded-lg border border-[#E8E5E0]">
          {STATUS_OPTIONS.map((opt) => {
            const isSelected = status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onStatusChange(opt.value)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  isSelected
                    ? 'bg-white text-[#242321] shadow-sm font-semibold'
                    : 'text-[#74716D] hover:text-[#242321]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Sort Select */}
        <select
          value={sortBy}
          aria-label="Sắp xếp danh sách người mẫu"
          onChange={(e) => onSortByChange(e.target.value as ModelSortBy)}
          className="h-9 px-3 text-xs font-medium text-[#242321] bg-white rounded-md border border-[#E8E5E0] focus:outline-none focus:border-[#654B7B] focus:ring-2 focus:ring-[#654B7B]/20 cursor-pointer"
        >
          <option value="updated_at_desc">Mới cập nhật</option>
          <option value="created_at_desc">Tạo gần đây nhất</option>
          <option value="name_asc">Tên A–Z</option>
        </select>

        {/* Grid/List Toggle */}
        <div className="hidden sm:flex items-center bg-[#F6F5F2] p-1 rounded-lg border border-[#E8E5E0]">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            title="Chế độ lưới"
            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-[#242321] shadow-sm'
                : 'text-[#74716D] hover:text-[#242321]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            title="Chế độ danh sách"
            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-[#242321] shadow-sm'
                : 'text-[#74716D] hover:text-[#242321]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
