import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  placeholder = 'Chọn một tùy chọn...',
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  error,
  disabled = false,
  className,
}) => {
  const [internalValue, setInternalValue] = useState<string>(
    defaultValue || options[0]?.value || ''
  );
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;
  const selectedOption = options.find((opt) => opt.value === currentValue);

  const selectId = useId();

  const handleSelect = (val: string) => {
    if (!isControlled) {
      setInternalValue(val);
    }
    onChange?.(val);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        setIsOpen(true);
        const idx = options.findIndex((opt) => opt.value === currentValue);
        setHighlightedIndex(idx >= 0 ? idx : 0);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < options.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : options.length - 1
      );
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (
        highlightedIndex >= 0 &&
        highlightedIndex < options.length &&
        !options[highlightedIndex].disabled
      ) {
        handleSelect(options[highlightedIndex].value);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn('w-full flex flex-col gap-1.5 text-left font-sans', className)}
    >
      {label && (
        <label
          id={`${selectId}-label`}
          className="text-[13px] font-medium text-[#242321] select-none"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          id={selectId}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={label ? `${selectId}-label ${selectId}` : selectId}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full h-10 px-3 text-sm text-[#242321] bg-white rounded-md border text-left flex items-center justify-between transition-colors duration-fast',
            'focus:outline-none focus:border-[#654B7B] focus:ring-2 focus:ring-[#654B7B]/20',
            disabled &&
              'bg-[#F6F5F2] text-[#97938E] cursor-not-allowed border-[#E8E5E0]',
            error ? 'border-[#A94442]' : 'border-[#D8D4CE]'
          )}
        >
          <span
            className={cn(
              'truncate',
              !selectedOption && 'text-[#97938E]'
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-[#74716D] transition-transform duration-normal shrink-0 ml-2',
              isOpen && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </button>

        {isOpen && (
          <ul
            ref={listboxRef}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={`${selectId}-label`}
            className="absolute z-50 w-full mt-1.5 py-1 bg-white border border-[#E8E5E0] rounded-md shadow-dropdown max-h-60 overflow-auto focus:outline-none"
          >
            {options.map((opt, index) => {
              const isSelected = opt.value === currentValue;
              const isHighlighted = index === highlightedIndex;

              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => !opt.disabled && handleSelect(opt.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    'h-9 px-3 text-sm flex items-center justify-between cursor-pointer select-none transition-colors duration-fast',
                    opt.disabled &&
                      'opacity-40 cursor-not-allowed text-[#97938E]',
                    isSelected && 'font-medium text-[#654B7B] bg-[#F2EDF5]',
                    !isSelected &&
                      isHighlighted &&
                      'bg-[#F7F6F4] text-[#242321]',
                    !isSelected && !isHighlighted && 'text-[#242321]'
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-[#654B7B] shrink-0 ml-2" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {error && <p className="text-xs text-[#A94442] font-medium mt-0.5">{error}</p>}
    </div>
  );
};
