import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, RotateCcw, Plus, SearchX } from 'lucide-react';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui/Button';
import { ModelProfileSummary } from '../types/model-management.types';
import { formatModelStatus } from '../utils/model-photo-format';
import { ModelCard } from './ModelCard';
import { ModelActionMenu } from './ModelActionMenu';

export interface ModelGridProps {
  items: ModelProfileSummary[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onCreateClick: () => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  viewMode: 'grid' | 'list';
  onArchive?: (model: ModelProfileSummary) => void;
  onRestore?: (model: ModelProfileSummary) => void;
  onDelete?: (model: ModelProfileSummary) => void;
}

export const ModelGrid: React.FC<ModelGridProps> = ({
  items,
  isLoading,
  error,
  onRetry,
  onCreateClick,
  hasFilters,
  onClearFilters,
  viewMode,
  onArchive,
  onRestore,
  onDelete,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="bg-white border border-[#E8E5E0] rounded-xl overflow-hidden p-3 flex flex-col gap-3">
            <Skeleton className="w-full aspect-[4/5] rounded-lg" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white border border-[#E8E5E0] rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3">
        <p className="text-base font-semibold text-[#A94442]">Không thể tải danh sách người mẫu</p>
        <p className="text-sm text-[#74716D] max-w-md">{error}</p>
        <Button
          type="button"
          variant="secondary"
          onClick={onRetry}
          className="mt-2 text-xs gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Thử lại</span>
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    if (hasFilters) {
      return (
        <EmptyState
          icon={SearchX}
          title="Không tìm thấy người mẫu phù hợp"
          description="Thử một tên hoặc mã người mẫu khác, hoặc thay đổi bộ lọc trạng thái."
          action={
            <Button variant="secondary" onClick={onClearFilters}>
              Xóa tìm kiếm
            </Button>
          }
        />
      );
    }

    return (
      <EmptyState
        icon={UserRound}
        title="Chưa có người mẫu nào"
        description="Tạo hồ sơ đầu tiên bằng những hình ảnh người mẫu do bạn cung cấp."
        action={
          <Button variant="primary" onClick={onCreateClick} className="gap-2">
            <Plus className="w-4 h-4" />
            <span>Tạo người mẫu</span>
          </Button>
        }
      />
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="w-full bg-white border border-[#E8E5E0] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-sans border-collapse">
            <thead>
              <tr className="border-b border-[#E8E5E0] bg-[#FBFAF8] text-xs font-medium text-[#74716D]">
                <th className="py-3 px-4 pl-5">Người mẫu</th>
                <th className="py-3 px-4">Mã hồ sơ</th>
                <th className="py-3 px-4">Ảnh tham chiếu</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right pr-5">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E5E0]">
              {items.map((model) => {
                const statusInfo = formatModelStatus(model.status);
                return (
                  <tr
                    key={model.modelId}
                    onClick={() =>
                      navigate(
                        model.status === 'DRAFT'
                          ? `/models/${model.modelId}/setup/identity`
                          : `/models/${model.modelId}`
                      )
                    }
                    className="group cursor-pointer hover:bg-[#FBFAF8] transition-colors"
                  >
                    <td className="py-3 px-4 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 rounded bg-[#F6F5F2] overflow-hidden shrink-0 flex items-center justify-center border border-[#E8E5E0]">
                          {model.coverImageUrl ? (
                            <img
                              src={model.coverImageUrl}
                              alt={model.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserRound className="w-4 h-4 text-[#97938E]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#242321] group-hover:text-[#654B7B] transition-colors truncate">
                            {model.displayName}
                          </p>
                          {model.description && (
                            <p className="text-xs text-[#74716D] truncate max-w-xs">
                              {model.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-[#74716D]">
                      {model.modelCode}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#4B4945]">
                      {model.referenceAssetsCount} ảnh
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium ${statusInfo.textColor}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td
                      className="py-3 px-4 pr-5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ModelActionMenu
                        model={model}
                        onArchive={onArchive}
                        onRestore={onRestore}
                        onDelete={onDelete}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Default Grid View
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {items.map((model) => (
        <ModelCard
          key={model.modelId}
          model={model}
          onArchive={onArchive}
          onRestore={onRestore}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
