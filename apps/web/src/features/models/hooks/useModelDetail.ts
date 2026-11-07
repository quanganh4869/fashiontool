import { useState, useEffect, useCallback } from 'react';
import { ModelProfileDetail } from '../types/model-management.types';
import { modelManagementService } from '../services/model-management.service';
import { modelsDevFixture } from '../fixtures/models.fixture';

export function useModelDetail(modelId?: string, isFixture = false) {
  const [model, setModel] = useState<ModelProfileDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!modelId) {
      setError('Mã người mẫu không hợp lệ.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const useFixture =
      isFixture ||
      (typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('preview') === 'fixture');

    try {
      if (useFixture && modelsDevFixture.details[modelId]) {
        setModel(modelsDevFixture.details[modelId]);
      } else {
        try {
          const data = await modelManagementService.getModelDetail(modelId);
          setModel(data);
        } catch (apiErr) {
          if (modelsDevFixture.details[modelId]) {
            setModel(modelsDevFixture.details[modelId]);
          } else {
            throw apiErr;
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tải thông tin người mẫu.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [modelId, isFixture]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    model,
    setModel,
    isLoading,
    error,
    reload: fetchDetail,
  };
}
