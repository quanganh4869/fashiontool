import React from 'react';
import { Dialog } from '@/components/ui/Dialog';
export interface ModelDeleteDialogProps {
  model: { modelId: string; displayName: string } | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (modelId: string) => void;
  isLoading?: boolean;
}

export const ModelDeleteDialog: React.FC<ModelDeleteDialogProps> = ({
  model,
  isOpen,
  onClose,
  onConfirmDelete,
  isLoading = false,
}) => {
  if (!model) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Xóa bản nháp người mẫu?"
      description="Hồ sơ nháp và những ảnh chưa được sử dụng trong dự án sẽ được xóa theo chính sách lưu trữ của hệ thống. Thao tác này không thể hoàn tác."
      confirmLabel="Xóa bản nháp"
      cancelLabel="Giữ bản nháp"
      isConfirmLoading={isLoading}
      onConfirm={() => onConfirmDelete(model.modelId)}
    />
  );
};
