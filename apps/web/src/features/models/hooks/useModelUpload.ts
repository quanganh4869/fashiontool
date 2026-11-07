import { useState, useCallback, useRef, useEffect } from 'react';
import { ModelUploadItem } from '../types/model-management.types';
import { validateModelPhotoFile } from '../utils/model-photo-validation';
import { modelManagementService } from '../services/model-management.service';

export interface UseModelUploadOptions {
  modelId: string;
  currentPhotosCount: number;
  onPhotoUploaded: () => void;
  onUploadError?: (message: string) => void;
}

export function useModelUpload({
  modelId,
  currentPhotosCount,
  onPhotoUploaded,
  onUploadError,
}: UseModelUploadOptions) {
  const [queue, setQueue] = useState<ModelUploadItem[]>([]);
  const queueRef = useRef<ModelUploadItem[]>([]);
  queueRef.current = queue;

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      queueRef.current.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<ModelUploadItem>) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const processUploadItem = useCallback(
    async (item: ModelUploadItem) => {
      updateItem(item.id, { status: 'uploading', progress: 5, errorMessage: undefined });
      try {
        // Direct multipart upload to backend local filesystem with real-time progress
        const asset = await modelManagementService.uploadModelPhoto(
          modelId,
          item.file,
          (percent) => {
            updateItem(item.id, { progress: Math.max(5, Math.min(95, percent)) });
          }
        );

        updateItem(item.id, {
          status: 'completed',
          progress: 100,
          assetId: asset.assetId,
        });

        // Notify parent to refresh asset list
        onPhotoUploaded();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Tải lên thất bại';
        updateItem(item.id, { status: 'error', errorMessage: msg });
        onUploadError?.(msg);
      }
    },
    [modelId, updateItem, onPhotoUploaded, onUploadError]
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const newItems: ModelUploadItem[] = [];

      fileArray.forEach((file) => {
        const pendingCount = queue.filter(
          (q) => q.status === 'queued' || q.status === 'uploading'
        ).length;

        const validation = validateModelPhotoFile(file, currentPhotosCount, pendingCount + newItems.length);
        if (!validation.isValid) {
          onUploadError?.(`${file.name}: ${validation.error}`);
          return;
        }

        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const previewUrl = URL.createObjectURL(file);
        const item: ModelUploadItem = {
          id,
          file,
          previewUrl,
          status: 'queued',
          progress: 0,
        };
        newItems.push(item);
      });

      if (newItems.length > 0) {
        setQueue((prev) => [...prev, ...newItems]);
        // Trigger uploads asynchronously
        newItems.forEach((item) => {
          processUploadItem(item);
        });
      }
    },
    [queue, currentPhotosCount, onUploadError, processUploadItem]
  );

  const retryUpload = useCallback(
    (itemId: string) => {
      const item = queue.find((q) => q.id === itemId);
      if (item && item.status === 'error') {
        processUploadItem(item);
      }
    },
    [queue, processUploadItem]
  );

  const removeQueueItem = useCallback((itemId: string) => {
    setQueue((prev) => {
      const item = prev.find((q) => q.id === itemId);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((q) => q.id !== itemId);
    });
  }, []);

  const clearCompleted = useCallback(() => {
    setQueue((prev) => {
      const remaining = prev.filter((q) => q.status !== 'completed');
      return remaining;
    });
  }, []);

  const isUploading = queue.some(
    (q) => q.status === 'queued' || q.status === 'uploading' || q.status === 'verifying'
  );

  return {
    queue,
    addFiles,
    retryUpload,
    removeQueueItem,
    clearCompleted,
    isUploading,
  };
}
