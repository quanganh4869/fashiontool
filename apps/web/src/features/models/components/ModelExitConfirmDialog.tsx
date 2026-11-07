import React from 'react';
import { Dialog } from '@/components/ui/Dialog';

export interface ModelExitConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
}

export const ModelExitConfirmDialog: React.FC<ModelExitConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirmExit,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Thoát quy trình tạo người mẫu?"
      description="Bản nháp của bạn sẽ được lưu lại để có thể tiếp tục sau."
      confirmLabel="Lưu bản nháp và thoát"
      cancelLabel="Ở lại"
      onConfirm={onConfirmExit}
    />
  );
};
