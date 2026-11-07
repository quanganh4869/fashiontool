import { useState, useEffect, useCallback } from 'react';
import {
  ModelProfileSummary,
  ModelFilterStatus,
  ModelSortBy,
} from '../types/model-management.types';
import { modelManagementService } from '../services/model-management.service';
import { modelsDevFixture } from '../fixtures/models.fixture';

export function useModels(initialFixtureMode = false) {
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
  const [isFixtureActive, setIsFixtureActive] = useState(initialFixtureMode);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isFixtureActive) {
        let filtered = [...modelsDevFixture.summaries];
        if (status !== 'ALL') {
          filtered = filtered.filter((m) => m.status === status);
        }
        if (query.trim()) {
          const q = query.trim().toLowerCase();
          filtered = filtered.filter(
            (m) =>
              m.displayName.toLowerCase().includes(q) ||
              m.modelCode.toLowerCase().includes(q)
          );
        }
        if (sortBy === 'name_asc') {
          filtered.sort((a, b) => a.displayName.localeCompare(b.displayName));
        } else if (sortBy === 'created_at_desc') {
          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else {
          filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        }
        setItems(filtered);
        setTotal(filtered.length);
        setTotalPages(Math.max(1, Math.ceil(filtered.length / limit)));
      } else {
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
        } catch (apiErr) {
          // If API fails in dev or offline preview, gracefully fallback to fixture
          console.warn('API error, falling back to fixture data:', apiErr);
          let filtered = [...modelsDevFixture.summaries];
          if (status !== 'ALL') {
            filtered = filtered.filter((m) => m.status === status);
          }
          if (query.trim()) {
            const q = query.trim().toLowerCase();
            filtered = filtered.filter(
              (m) =>
                m.displayName.toLowerCase().includes(q) ||
                m.modelCode.toLowerCase().includes(q)
            );
          }
          setItems(filtered);
          setTotal(filtered.length);
          setTotalPages(Math.max(1, Math.ceil(filtered.length / limit)));
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách người mẫu.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [query, status, sortBy, page, limit, isFixtureActive]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const toggleFixture = () => {
    setIsFixtureActive((prev) => !prev);
  };

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
    isFixtureActive,
    toggleFixture,
  };
}
