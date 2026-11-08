import React from 'react';
import { Search, X, Sparkles, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FashionCategory } from '../types/research.types';

export interface ProductSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  categories?: FashionCategory[];
  selectedCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  query,
  onQueryChange,
  categories = [],
  selectedCategory = '',
  onCategoryChange,
  onSearch,
  isLoading = false,
  placeholder = 'Tìm kiếm sản phẩm theo tên, danh mục, từ khóa (ví dụ: áo sơ mi lụa, đầm dạ hội, blazer công sở)...',
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const handleClear = () => {
    onQueryChange('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200/90 p-2 sm:p-2.5 shadow-sm transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100"
    >
      <div className="flex flex-col sm:flex-row items-center gap-2">
        {/* Category Selector if categories provided */}
        {categories.length > 0 && onCategoryChange && (
          <div className="w-full sm:w-48 shrink-0">
            <div className="relative">
              <select
                value={selectedCategory}
                aria-label="Danh mục thời trang"
                onChange={(e) => {
                  onCategoryChange(e.target.value);
                }}
                className="w-full h-10 pl-3 pr-8 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white appearance-none cursor-pointer transition-colors"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Input box */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-10 pl-10 pr-9 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Xóa từ khóa"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search CTA */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto h-10 px-5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 shrink-0 shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Đang tìm kiếm...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Tìm kiếm sản phẩm
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
