import React, { useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  isConfirmLoading?: boolean;
  maxWidth?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = 'Hủy',
  onConfirm,
  isConfirmLoading = false,
  maxWidth = 'max-w-[540px]',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      // Focus modal container
      dialogRef.current?.focus();
      // Lock body scroll gently
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby={description ? 'dialog-description' : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#242321]/40 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cn(
          'relative w-full bg-white rounded-xl border border-[#E8E5E0] shadow-modal z-10 flex flex-col focus:outline-none overflow-hidden animate-in fade-in zoom-in-95 duration-fast',
          maxWidth
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3 border-b border-[#E8E5E0]">
          <div>
            <h2 id="dialog-title" className="text-lg font-semibold text-[#242321]">
              {title}
            </h2>
            {description && (
              <p
                id="dialog-description"
                className="text-sm text-[#74716D] mt-1"
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="w-8 h-8 rounded-md flex items-center justify-center text-[#74716D] hover:text-[#242321] hover:bg-[#F7F6F4] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {children && <div className="p-5 text-sm text-[#242321]">{children}</div>}

        {/* Footer Actions */}
        {(confirmLabel || cancelLabel) && (
          <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-[#FBFAF8] border-t border-[#E8E5E0]">
            {cancelLabel && (
              <Button variant="secondary" size="md" onClick={onClose}>
                {cancelLabel}
              </Button>
            )}
            {confirmLabel && (
              <Button
                variant="primary"
                size="md"
                isLoading={isConfirmLoading}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
