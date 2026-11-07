import React from 'react';
import { Film, AlertCircle, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { TemplateSummary } from '../types/template.types';
import { TemplateCard } from './TemplateCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui/Button';

export interface TemplateGridProps {
  items: TemplateSummary[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onPreview: (template: TemplateSummary) => void;
  onSelect: (template: TemplateSummary) => void;
  onToggleFavorite: (templateId: string) => Promise<boolean>;
  onResetFilters: () => void;
  onPageChange: (newPage: number) => void;
  onRetry: () => void;
}

export const TemplateGrid: React.FC<TemplateGridProps> = ({
  items,
  total,
  page,
  totalPages,
  isLoading,
  error,
  hasActiveFilters,
  onPreview,
  onSelect,
  onToggleFavorite,
  onResetFilters,
  onPageChange,
  onRetry,
}) => {
  // 1. Error state
  if (error && !isLoading) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Không thể tải thư viện video mẫu"
        description={error}
        action={
          <Button variant="primary" size="sm" onClick={onRetry} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>Thử lại</span>
          </Button>
        }
      />
    );
  }

  // 2. Loading Skeleton state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 w-full">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col bg-white rounded-xl border border-[#D8D4CE] overflow-hidden animate-pulse"
          >
            <div className="w-full aspect-[9/16] bg-[#ECEAE4]" />
            <div className="p-3.5 space-y-2">
              <div className="h-3 bg-[#ECEAE4] rounded-md w-1/3" />
              <div className="h-4 bg-[#ECEAE4] rounded-md w-3/4" />
              <div className="h-3 bg-[#ECEAE4] rounded-md w-1/2 pt-1" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 3. Empty Results state
  if (items.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          icon={Film}
          title="Không tìm thấy video mẫu phù hợp"
          description="Thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc để xem nhiều kết quả hơn."
          action={
            <Button variant="secondary" size="sm" onClick={onResetFilters} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              <span>Xóa bộ lọc</span>
            </Button>
          }
        />
      );
    }

    return (
      <EmptyState
        icon={Film}
        title="Chưa có video mẫu"
        description="Hệ thống đang chuẩn bị các mẫu video thời trang mới nhất. Vui lòng quay lại sau."
      />
    );
  }

  // 4. Render Grid with pagination
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 w-full">
        {items.map((item) => (
          <TemplateCard
            key={item.templateId}
            template={item}
            onPreview={onPreview}
            onClick={onSelect}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#ECEAE4] text-xs text-[#74716D]">
          <div>
            Hiển thị trang <span className="font-semibold text-[#242321]">{page}</span> /{' '}
            <span className="font-semibold text-[#242321]">{totalPages}</span> (Tổng cộng {total} video mẫu)
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Trang trước"
              className="gap-1 px-3 py-1 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Trước</span>
            </Button>

            <span className="px-2 font-medium text-[#242321]">
              {page} / {totalPages}
            </span>

            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Trang sau"
              className="gap-1 px-3 py-1 text-xs"
            >
              <span>Sau</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
