import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface ModelPageHeaderProps {
  onCreateClick: () => void;
  isCreating?: boolean;
}

export const ModelPageHeader: React.FC<ModelPageHeaderProps> = ({
  onCreateClick,
  isCreating = false,
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
