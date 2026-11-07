import React, { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Table = React.forwardRef<
  HTMLTableElement,
  HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-lg border border-[#E8E5E0] bg-white">
    <table
      ref={ref}
      className={cn('w-full caption-bottom text-sm text-left font-sans', className)}
      {...props}
    />
  </div>
));
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn('bg-[#FBFAF8] border-b border-[#E8E5E0]', className)}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0 divide-y divide-[#E8E5E0]', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'h-[52px] border-b border-[#E8E5E0] transition-colors duration-fast hover:bg-[#FAF9F7]',
      className
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-10 px-4 text-xs font-semibold text-[#74716D] uppercase tracking-wider align-middle select-none',
      className
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('px-4 py-3 align-middle text-[13px] text-[#242321]', className)}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

export interface TableStateRowProps {
  colSpan: number;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  errorMessage?: string;
}

export const TableStateRow: React.FC<TableStateRowProps> = ({
  colSpan,
  isLoading,
  isEmpty,
  emptyMessage = 'Không có dữ liệu hiển thị.',
  errorMessage,
}) => {
  return (
    <tr>
      <td colSpan={colSpan} className="h-40 text-center align-middle px-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-2 text-[#74716D]">
            <Loader2 className="w-5 h-5 animate-spin text-[#654B7B]" />
            <span className="text-xs">Đang tải dữ liệu...</span>
          </div>
        )}
        {errorMessage && (
          <div className="text-sm text-[#A94442] font-medium">
            {errorMessage}
          </div>
        )}
        {!isLoading && !errorMessage && isEmpty && (
          <div className="text-sm text-[#74716D]">{emptyMessage}</div>
        )}
      </td>
    </tr>
  );
};
