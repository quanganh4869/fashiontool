import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MoreHorizontal,
  Eye,
  Edit2,
  Archive,
  RotateCcw,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { ModelProfileSummary } from '../types/model-management.types';

export interface ModelActionMenuProps {
  model: ModelProfileSummary;
  onArchive?: (model: ModelProfileSummary) => void;
  onRestore?: (model: ModelProfileSummary) => void;
  onDelete?: (model: ModelProfileSummary) => void;
}

export const ModelActionMenu: React.FC<ModelActionMenuProps> = ({
  model,
  onArchive,
  onRestore,
  onDelete,
}) => {
  const navigate = useNavigate();

  return (
    <DropdownMenu
      align="right"
      trigger={
        <button
          type="button"
          aria-label={`Tùy chọn cho người mẫu ${model.displayName}`}
          className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#242321] shadow-sm flex items-center justify-center transition-colors border border-[#E8E5E0]/60"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      }
    >
      {model.status === 'DRAFT' ? (
        <>
          <DropdownMenuItem
            label="Tiếp tục cài đặt"
            icon={Sparkles}
            onClick={() => navigate(`/models/${model.modelId}/setup/identity`)}
          />
          {onDelete && (
            <DropdownMenuItem
              label="Xóa bản nháp"
              icon={Trash2}
              destructive
              onClick={() => onDelete(model)}
            />
          )}
        </>
      ) : (
        <>
          <DropdownMenuItem
            label="Xem hồ sơ"
            icon={Eye}
            onClick={() => navigate(`/models/${model.modelId}`)}
          />
          <DropdownMenuItem
            label="Chỉnh sửa"
            icon={Edit2}
            onClick={() => navigate(`/models/${model.modelId}/edit`)}
          />
          {model.status === 'READY' && onArchive && (
            <DropdownMenuItem
              label="Lưu trữ"
              icon={Archive}
              onClick={() => onArchive(model)}
            />
          )}
          {model.status === 'ARCHIVED' && onRestore && (
            <DropdownMenuItem
              label="Khôi phục hồ sơ"
              icon={RotateCcw}
              onClick={() => onRestore(model)}
            />
          )}
          {model.usedInProjectsCount === 0 && onDelete && (
            <DropdownMenuItem
              label="Xóa hồ sơ"
              icon={Trash2}
              destructive
              onClick={() => onDelete(model)}
            />
          )}
        </>
      )}
    </DropdownMenu>
  );
};
