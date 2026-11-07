import { useState, useEffect, useCallback } from 'react';
import { templateService } from '../services/template.service';
import { TemplateDetail } from '../types/template.types';

export function useTemplateDetail(templateId?: string) {
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!templateId) {
      setIsLoading(false);
      setError('Mã video mẫu không hợp lệ');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await templateService.getTemplateDetail(templateId);
      setTemplate(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải thông tin video mẫu';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleToggleFavorite = async () => {
    if (!template || isFavoriteLoading) return;

    setIsFavoriteLoading(true);
    const prev = template.isFavorite;
    setTemplate((curr) => (curr ? { ...curr, isFavorite: !prev } : null));

    try {
      const res = await templateService.toggleFavorite(template.templateId);
      setTemplate((curr) => (curr ? { ...curr, isFavorite: res.isFavorite } : null));
    } catch {
      // Rollback
      setTemplate((curr) => (curr ? { ...curr, isFavorite: prev } : null));
      throw new Error('Không thể cập nhật trạng thái yêu thích');
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  return {
    template,
    isLoading,
    error,
    isFavoriteLoading,
    refetch: fetchDetail,
    handleToggleFavorite,
  };
}
