import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DropdownMenuItemProps {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  label,
  icon: Icon,
  onClick,
  destructive = false,
  disabled = false,
  className,
}) => {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-full min-h-[36px] px-3 py-1.5 text-sm text-left flex items-center gap-2.5 rounded-sm transition-colors duration-fast select-none',
        'focus:outline-none focus:bg-[#F7F6F4]',
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        destructive
          ? 'text-[#A94442] hover:bg-[#FAEEEE]'
          : 'text-[#242321] hover:bg-[#F7F6F4]',
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0 text-[#74716D]" />}
      <span className="truncate">{label}</span>
    </button>
  );
};

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  children,
  align = 'right',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <div onClick={() => setIsOpen((prev) => !prev)}>{trigger}</div>

      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 mt-1.5 min-w-[180px] p-1 bg-white border border-[#E8E5E0] rounded-md shadow-dropdown animate-in fade-in-50 zoom-in-95',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
};
