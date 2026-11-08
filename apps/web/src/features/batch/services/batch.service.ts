import { apiClient } from '@/services/api/client';
import { config } from '@/app/config/env';
import {
  BatchDetailResponse,
  BatchPreflightResponse,
  BatchProductionGroup,
  CreateBatchProductionRequest,
  FinalVideoItem,
  FinalVideoLibraryResponse,
} from '../types/batch.types';
import { ReplacementJobResponse } from '@/features/replacement/types/replacement.types';

export const batchService = {
  /**
   * Pre-flight checks multiple product assets against the selected base video.
   */
  async checkBatchPreflight(
    projectId: string,
    baseVideoAssetId: string,
    productAssetIds: string[]
  ): Promise<BatchPreflightResponse> {
    return apiClient<BatchPreflightResponse>(
      `/projects/${projectId}/batches/preflight`,
      {
        method: 'POST',
        body: JSON.stringify({
          base_video_asset_id: baseVideoAssetId,
          product_asset_ids: productAssetIds,
        }),
      }
    );
  },

  /**
   * Creates a batch production group and queues individual child replacement jobs.
   */
  async createBatch(
    projectId: string,
    payload: CreateBatchProductionRequest
  ): Promise<BatchProductionGroup> {
    return apiClient<BatchProductionGroup>(`/projects/${projectId}/batches`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Lists all batches in a project.
   */
  async listBatches(projectId: string): Promise<BatchProductionGroup[]> {
    return apiClient<BatchProductionGroup[]>(`/projects/${projectId}/batches`);
  },

  /**
   * Fetches real-time status and child jobs of a batch.
   */
  async getBatch(projectId: string, batchId: string): Promise<BatchDetailResponse> {
    return apiClient<BatchDetailResponse>(`/projects/${projectId}/batches/${batchId}`);
  },

  /**
   * Cancels remaining queued jobs in a batch.
   */
  async cancelBatch(projectId: string, batchId: string): Promise<BatchProductionGroup> {
    return apiClient<BatchProductionGroup>(`/projects/${projectId}/batches/${batchId}/cancel`, {
      method: 'POST',
    });
  },

  /**
   * Retries an individual failed child job within a batch.
   */
  async retryJob(
    projectId: string,
    batchId: string,
    jobId: string
  ): Promise<ReplacementJobResponse> {
    return apiClient<ReplacementJobResponse>(
      `/projects/${projectId}/batches/${batchId}/jobs/${jobId}/retry`,
      {
        method: 'POST',
      }
    );
  },

  /**
   * Queries, filters, sorts and paginates the project's Final Video Library.
   */
  async getFinalVideos(
    projectId: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      batchId?: string;
      productId?: string;
      qualityStatus?: string;
      sortBy?: string;
      sortDir?: string;
      includeArchived?: boolean;
    } = {}
  ): Promise<FinalVideoLibraryResponse> {
    const q = new URLSearchParams();
    if (params.page) q.append('page', String(params.page));
    if (params.limit) q.append('limit', String(params.limit));
    if (params.search) q.append('search', params.search);
    if (params.batchId) q.append('batch_id', params.batchId);
    if (params.productId) q.append('product_id', params.productId);
    if (params.qualityStatus) q.append('quality_status', params.qualityStatus);
    if (params.sortBy) q.append('sort_by', params.sortBy);
    if (params.sortDir) q.append('sort_dir', params.sortDir);
    if (params.includeArchived) q.append('include_archived', 'true');

    const qs = q.toString();
    return apiClient<FinalVideoLibraryResponse>(
      `/projects/${projectId}/final-videos${qs ? `?${qs}` : ''}`
    );
  },

  /**
   * Fetches full metadata and provenance of a single Final Product Video.
   */
  async getFinalVideo(projectId: string, videoId: string): Promise<FinalVideoItem> {
    return apiClient<FinalVideoItem>(`/projects/${projectId}/final-videos/${videoId}`);
  },

  /**
   * Toggles archive status of a Final Product Video.
   */
  async toggleArchive(
    projectId: string,
    videoId: string
  ): Promise<{ video_id: string; is_archived: boolean }> {
    return apiClient<{ video_id: string; is_archived: boolean }>(
      `/projects/${projectId}/final-videos/${videoId}/archive`,
      { method: 'POST' }
    );
  },

  /**
   * Returns direct MP4 download URL.
   */
  getDownloadUrl(projectId: string, videoId: string): string {
    const base = config.apiUrl.replace(/\/+$/, '');
    return `${base}/projects/${projectId}/final-videos/${videoId}/download`;
  },

  /**
   * Triggers batch ZIP export download for selected or all videos.
   */
  async exportZip(projectId: string, videoIds: string[] = []): Promise<Blob> {
    const res = await fetch(
      `${config.apiUrl}/projects/${projectId}/final-videos/export-zip`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_ids: videoIds }),
      }
    );
    if (!res.ok) {
      throw new Error(`Xuất ZIP thất bại (${res.status}): ${await res.text()}`);
    }
    return res.blob();
  },

  /**
   * Resolves relative media URLs.
   */
  resolveMediaUrl(path?: string | null): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = config.apiUrl.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  },
};
