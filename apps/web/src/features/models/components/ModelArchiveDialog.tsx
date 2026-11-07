import React from 'react';
import { Dialog } from '@/components/ui/Dialog';
export interface ModelArchiveDialogProps {
  model: { modelId: string; displayName: string } | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmArchive: (modelId: string) => void;
  isLoading?: boolean;
}

export const ModelArchiveDialog: React.FC<ModelArchiveDialogProps> = ({
  model,
  isOpen,
  onClose,
  onConfirmArchive,
  isLoading = false,
}) => {
  if (!model) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Lưu trữ người mẫu?"
      description="Hồ sơ sẽ được chuyển sang danh sách Đã lưu trữ và không còn hiển thị trong danh sách người mẫu sẵn sàng. Dữ liệu và những liên kết lịch sử sẽ được giữ lại."
      confirmLabel="Lưu trữ hồ sơ"
      cancelLabel="Hủy"
      isConfirmLoading={isLoading}
      onConfirm={() => onConfirmArchive(model.modelId)}
    />
  );
};
