import { forwardRef, InputHTMLAttributes, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, id, disabled, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left font-sans">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-medium text-[#242321] select-none"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              'w-full h-10 px-3 text-sm text-[#242321] bg-white rounded-md border transition-colors duration-fast',
              'placeholder:text-[#97938E]',
              'focus:outline-none focus:border-[#654B7B] focus:ring-2 focus:ring-[#654B7B]/20',
              'disabled:bg-[#F6F5F2] disabled:text-[#97938E] disabled:cursor-not-allowed disabled:border-[#E8E5E0]',
              error
                ? 'border-[#A94442] focus:border-[#A94442] focus:ring-[#A94442]/20'
                : 'border-[#D8D4CE]',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="text-xs text-[#A94442] font-medium mt-0.5">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-xs text-[#74716D] mt-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
