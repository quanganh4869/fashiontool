import { useState, useEffect, useCallback } from 'react';
import { ModelProfileDetail } from '../types/model-management.types';
import { modelManagementService } from '../services/model-management.service';

export function useModelDetail(modelId?: string) {
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

    try {
      const data = await modelManagementService.getModelDetail(modelId);
      setModel(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tải thông tin người mẫu.';
      setError(msg);
      setModel(null);
    } finally {
      setIsLoading(false);
    }
  }, [modelId]);

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
