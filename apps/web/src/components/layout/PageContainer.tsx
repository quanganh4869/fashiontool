import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageContainerProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  description,
  actions,
  children,
  className,
}) => {
  return (
    <div className="w-full flex-1 min-h-0 overflow-y-auto p-4 sm:p-7 lg:p-8">
      <div className={cn('w-full max-w-7xl mx-auto flex flex-col gap-6 font-sans', className)}>
        {/* Page Header */}
        {(title || description || actions) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
            <div>
              {title && (
                <h1 className="text-[28px] sm:text-[30px] font-bold text-[#242321] tracking-tight leading-tight">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-sm text-[#74716D] mt-1.5 leading-relaxed max-w-2xl">
                  {description}
                </p>
              )}
            </div>
            {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
          </div>
        )}

        {/* Main Page Workspace Content */}
        <div className="w-full flex-1">{children}</div>
      </div>
    </div>
  );
};
