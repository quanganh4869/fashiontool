import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { templateService } from '../services/template.service';
import {
  TemplateCategory,
  TemplateListResponse,
  TemplateQueryParams,
  TemplateSortBy,
  AssessmentFilterStatus,
} from '../types/template.types';

export function useTemplates() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state reflection
  const query = searchParams.get('query') || '';
  const category = searchParams.get('category') || 'all';
  const aspectRatio = searchParams.get('aspect_ratio') || 'all';
  const garmentSlot = searchParams.get('garment_slot') || 'all';
  const assessmentStatus = (searchParams.get('assessment_status') || 'ALL') as AssessmentFilterStatus;
  const durationRange = (searchParams.get('duration_range') || '') as TemplateQueryParams['durationRange'];
  const isFavorite = searchParams.get('is_favorite') === 'true' ? true : undefined;
  const sortBy = (searchParams.get('sort_by') || 'updated_at_desc') as TemplateSortBy;
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Search input local state with debounce
  const [searchInput, setSearchInput] = useState(query);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Categories
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);

  // Data list
  const [data, setData] = useState<TemplateListResponse>({
    items: [],
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active filters count
  const hasActiveFilters = Boolean(
    query.trim() ||
    (category && category !== 'all') ||
    (aspectRatio && aspectRatio !== 'all') ||
    (garmentSlot && garmentSlot !== 'all') ||
    (assessmentStatus && assessmentStatus !== 'ALL') ||
    durationRange ||
    isFavorite
  );

  // Load categories once
  useEffect(() => {
    let isMounted = true;
    setIsCategoriesLoading(true);
    templateService
      .listCategories()
      .then((cats) => {
        if (isMounted) setCategories(cats);
      })
      .catch(() => {
        // Fallback default
        if (isMounted) setCategories([{ id: 'all', name: 'Tất cả' }]);
      })
      .finally(() => {
        if (isMounted) setIsCategoriesLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync search input if URL changes externally (e.g. browser back/forward)
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  // Load templates list whenever URL searchParams change
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await templateService.listTemplates({
        query: query.trim() || undefined,
        category: category !== 'all' ? category : undefined,
        aspectRatio: aspectRatio !== 'all' ? aspectRatio : undefined,
        garmentSlot: garmentSlot !== 'all' ? garmentSlot : undefined,
        assessmentStatus: assessmentStatus !== 'ALL' ? assessmentStatus : undefined,
        durationRange: durationRange || undefined,
        isFavorite: isFavorite,
        sortBy,
        page,
        limit: 12,
      });
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải thư viện video mẫu';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [query, category, aspectRatio, garmentSlot, assessmentStatus, durationRange, isFavorite, sortBy, page]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Update URL helper
  const updateParam = useCallback(
    (key: string, value: string | undefined, resetPage = true) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value && value !== 'all' && value !== 'ALL') {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        if (resetPage) {
          next.delete('page');
        }
        return next;
      });
    },
    [setSearchParams]
  );

  // Search input change handler with 350ms debounce
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      updateParam('query', value.trim() || undefined, true);
    }, 350);
  };

  const handleSearchImmediate = (value: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchInput(value);
    updateParam('query', value.trim() || undefined, true);
  };

  const clearSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchInput('');
    updateParam('query', undefined, true);
  };

  const resetAllFilters = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  // Toggle favorite with optimistic update & rollback
  const handleToggleFavorite = async (templateId: string): Promise<boolean> => {
    // Save previous state for rollback
    const originalItems = [...data.items];
    const targetItem = originalItems.find((item) => item.templateId === templateId);
    if (!targetItem) return false;

    const previousFav = targetItem.isFavorite;
    const newFav = !previousFav;

    // Optimistic update
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.templateId === templateId ? { ...item, isFavorite: newFav } : item
      ),
    }));

    try {
      const result = await templateService.toggleFavorite(templateId);
      setData((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.templateId === templateId ? { ...item, isFavorite: result.isFavorite } : item
        ),
      }));
      return result.isFavorite;
    } catch {
      // Rollback
      setData((prev) => ({ ...prev, items: originalItems }));
      throw new Error('Không thể cập nhật trạng thái yêu thích. Vui lòng thử lại.');
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= data.totalPages) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (newPage === 1) {
          next.delete('page');
        } else {
          next.set('page', newPage.toString());
        }
        return next;
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return {
    query,
    searchInput,
    category,
    aspectRatio,
    garmentSlot,
    assessmentStatus,
    durationRange,
    isFavorite,
    sortBy,
    page,
    categories,
    isCategoriesLoading,
    data,
    isLoading,
    error,
    hasActiveFilters,
    setSearchInput,
    handleSearchChange,
    handleSearchImmediate,
    clearSearch,
    updateParam,
    resetAllFilters,
    handleToggleFavorite,
    handlePageChange,
    refetch: fetchTemplates,
  };
}
