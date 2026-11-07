import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium font-sans select-none transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring disabled:pointer-events-none disabled:opacity-50';

    const variantStyles = {
      primary:
        'bg-[#654B7B] text-white hover:bg-[#543C69] active:bg-[#463253] border border-transparent shadow-sm',
      secondary:
        'bg-white text-[#242321] border border-[#E8E5E0] hover:bg-[#F7F6F4] hover:text-[#242321] active:bg-[#EBE8E3] active:border-[#D8D4CE]',
      tertiary:
        'bg-[#F4F2EF] text-[#4B4945] border border-transparent hover:bg-[#EBE8E3] active:bg-[#E2DFD9]',
      ghost:
        'bg-transparent text-[#242321] border border-transparent hover:bg-[#F7F6F4] active:bg-[#EBE8E3]',
    };

    const sizeStyles = {
      sm: 'h-8 px-3 text-[13px] rounded-md gap-1.5',
      md: 'h-10 px-4 text-sm rounded-md gap-2',
      lg: 'h-11 px-5 text-base rounded-md gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <Loader2
            className="w-3.5 h-3.5 animate-spin shrink-0"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
