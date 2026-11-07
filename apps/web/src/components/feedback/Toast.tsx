import React, { useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToastContext, ToastMessage, ToastType } from './toast.context';

export type { ToastType, ToastMessage } from './toast.context';

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToasts((prev) => [...prev, { id, type, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => {
          const iconConfig = {
            success: {
              icon: CheckCircle2,
              color: 'text-[#367458]',
              border: 'border-[#367458]/30',
              bg: 'bg-white',
            },
            warning: {
              icon: AlertTriangle,
              color: 'text-[#9A6B26]',
              border: 'border-[#9A6B26]/30',
              bg: 'bg-white',
            },
            error: {
              icon: AlertCircle,
              color: 'text-[#A94442]',
              border: 'border-[#A94442]/30',
              bg: 'bg-white',
            },
            info: {
              icon: Info,
              color: 'text-[#654B7B]',
              border: 'border-[#654B7B]/30',
              bg: 'bg-white',
            },
          }[toast.type];

          const IconComponent = iconConfig.icon;

          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-modal animate-in slide-in-from-bottom-2 duration-fast text-sm font-sans',
                iconConfig.bg,
                iconConfig.border
              )}
            >
              <IconComponent
                className={cn('w-4 h-4 mt-0.5 shrink-0', iconConfig.color)}
              />
              <span className="flex-1 text-[#242321] text-[13px] leading-snug">
                {toast.message}
              </span>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Đóng thông báo"
                className="text-[#74716D] hover:text-[#242321] transition-colors p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
