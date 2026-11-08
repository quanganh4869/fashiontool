import { useState, useEffect, useCallback } from 'react';
import {
  ModelProfileSummary,
  ModelFilterStatus,
  ModelSortBy,
} from '../types/model-management.types';
import { modelManagementService } from '../services/model-management.service';

export function useModels() {
  const [items, setItems] = useState<ModelProfileSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ModelFilterStatus>('ALL');
  const [sortBy, setSortBy] = useState<ModelSortBy>('updated_at_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await modelManagementService.listModels({
        query,
        status,
        sortBy,
        page,
        limit,
      });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách người mẫu.';
      setError(msg);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, status, sortBy, page, limit]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return {
    items,
    total,
    page,
    limit,
    totalPages,
    query,
    setQuery,
    status,
    setStatus,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    setPage,
    isLoading,
    error,
    reload: fetchModels,
  };
}
