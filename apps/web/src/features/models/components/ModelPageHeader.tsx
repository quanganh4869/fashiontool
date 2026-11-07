import React from 'react';
import { Plus, Database } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface ModelPageHeaderProps {
  onCreateClick: () => void;
  isCreating?: boolean;
  isFixtureActive?: boolean;
  onToggleFixture?: () => void;
}

export const ModelPageHeader: React.FC<ModelPageHeaderProps> = ({
  onCreateClick,
  isCreating = false,
  isFixtureActive = false,
  onToggleFixture,
}) => {
  return (
    <div className="w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
      <div>
        <h1 className="text-[28px] sm:text-[30px] font-bold text-[#242321] tracking-tight leading-[1.3]">
          Người mẫu
        </h1>
        <p className="text-sm font-normal text-[#74716D] mt-2 leading-relaxed max-w-2xl">
          Quản lý hồ sơ người mẫu và hình ảnh tham chiếu để sử dụng trong các dự án video.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {import.meta.env.DEV && onToggleFixture && (
          <button
            type="button"
            onClick={onToggleFixture}
            title="Chế độ preview phát triển: kiểm thử giao diện với fixture"
            className={`h-10 px-2.5 text-xs font-medium rounded-md border flex items-center gap-1.5 transition-colors ${
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

        <Button
          type="button"
          variant="primary"
          onClick={onCreateClick}
          disabled={isCreating}
          isLoading={isCreating}
          className="h-10 px-4 text-sm font-medium gap-2 rounded-md shadow-sm"
        >
          {!isCreating && <Plus className="w-4 h-4 shrink-0" />}
          <span>Tạo người mẫu</span>
        </Button>
      </div>
    </div>
  );
};
