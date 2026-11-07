import React from 'react';
import { RefreshCw, Database } from 'lucide-react';
import { Select, SelectOption } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { TimeRange } from '@/types/overview';

export interface OverviewHeaderProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isFixtureActive?: boolean;
  onToggleFixture?: () => void;
}

const TIME_RANGE_OPTIONS: SelectOption[] = [
  { value: '7d', label: '7 ngày qua' },
  { value: '30d', label: '30 ngày qua' },
  { value: '90d', label: '90 ngày qua' },
];

export const OverviewHeader: React.FC<OverviewHeaderProps> = ({
  timeRange,
  onTimeRangeChange,
  onRefresh,
  isRefreshing,
  isFixtureActive = false,
  onToggleFixture,
}) => {
  return (
    <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
      {/* Title & Description */}
      <div>
        <h1 className="text-[28px] sm:text-[30px] font-bold text-[#242321] tracking-tight leading-[1.3]">
          Tổng quan
        </h1>
        <p className="text-sm font-normal text-[#74716D] mt-2 leading-relaxed">
          Theo dõi hoạt động nghiên cứu sản phẩm và sản xuất video của bạn.
        </p>
      </div>

      {/* Controls: Time Range Select & Refresh Button */}
      <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
        {/* Development preview fixture switch */}
        {import.meta.env.DEV && onToggleFixture && (
          <button
            type="button"
            onClick={onToggleFixture}
            title="Chế độ preview phát triển: kiểm thử giao diện với fixture"
            className={`h-9 px-2.5 text-xs font-medium rounded-md border flex items-center gap-1.5 transition-colors ${
              isFixtureActive
                ? 'bg-[#F2EDF5] text-[#654B7B] border-[#D1C2DC]'
                : 'bg-white text-[#74716D] border-[#E8E5E0] hover:bg-[#F6F5F2]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isFixtureActive ? 'Preview Fixture' : 'Backend Thực'}
            </span>
          </button>
        )}

        {/* Time Range Select */}
        <div className="w-[150px]">
          <Select
            label="Khoảng thời gian"
            options={TIME_RANGE_OPTIONS}
            value={timeRange}
            onChange={(val) => onTimeRangeChange(val as TimeRange)}
            className="text-xs"
          />
        </div>

        {/* Refresh Button */}
        <div className="pt-5">
          <Button
            type="button"
            variant="secondary"
            onClick={onRefresh}
            disabled={isRefreshing}
            isLoading={isRefreshing}
            className="h-9 px-3.5 text-sm font-medium text-[#242321] bg-white border-[#E8E5E0] hover:bg-[#F7F6F4] shadow-none gap-2 rounded-md transition-colors"
          >
            {!isRefreshing && <RefreshCw className="w-4 h-4 text-[#242321] shrink-0" />}
            <span>Làm mới</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
