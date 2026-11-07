import React from 'react';
import { Search, X } from 'lucide-react';

export interface TemplateSearchToolbarProps {
  value: string;
  onChange: (value: string) => void;
  onEnter: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export const TemplateSearchToolbar: React.FC<TemplateSearchToolbarProps> = ({
  value,
  onChange,
  onEnter,
  onClear,
  placeholder = 'Tìm tên video, mã mẫu hoặc từ khóa...',
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onEnter(value);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A19D97]">
        <Search className="w-4 h-4" aria-hidden="true" />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Tìm kiếm video mẫu"
        className="w-full pl-10 pr-9 py-2 text-sm text-[#242321] placeholder-[#A19D97] bg-white border border-[#D8D4CE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#242321] focus:border-transparent transition-all shadow-xs"
      />

      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Xóa nội dung tìm kiếm"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A19D97] hover:text-[#242321] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
