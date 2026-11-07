import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/feedback/Skeleton';
import { OverviewSummary } from '@/types/overview';

export interface OverviewSummaryStripProps {
  summary: OverviewSummary | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

interface MetricItem {
  key: keyof OverviewSummary;
  label: string;
}

const METRIC_ITEMS: MetricItem[] = [
  { key: 'savedProductsCount', label: 'Sản phẩm đã lưu' },
  { key: 'analyzedChannelsCount', label: 'Kênh đã phân tích' },
  { key: 'generatedImagesCount', label: 'Ảnh đã tạo' },
  { key: 'generatedVideosCount', label: 'Video đã tạo' },
];

export const OverviewSummaryStrip: React.FC<OverviewSummaryStripProps> = ({
  summary,
  isLoading,
  error,
  onRetry,
}) => {
  if (error) {
    return (
      <div className="w-full bg-white border border-[#E8E5E0] rounded-xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-[#A94442]">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Không thể tải số liệu thống kê tổng hợp: {error}</span>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#242321] bg-[#F6F5F2] hover:bg-[#EBE8E3] rounded-md transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Thử lại</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-[#E8E5E0] rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#E8E5E0] shadow-sm">
      {METRIC_ITEMS.map((item) => {
        const value = summary ? summary[item.key] : null;

        return (
          <div key={item.key} className="p-5 flex flex-col justify-center min-h-[96px]">
            <span className="text-[13px] font-medium text-[#74716D] select-none tracking-normal">
              {item.label}
            </span>
            <div className="mt-1.5 flex items-baseline">
              {isLoading ? (
                <Skeleton className="h-8 w-20 rounded" />
              ) : (
                <span className="text-[26px] font-bold text-[#242321] tracking-tight tabular-nums leading-none">
                  {value === null || value === undefined ? '—' : value.toLocaleString('vi-VN')}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
