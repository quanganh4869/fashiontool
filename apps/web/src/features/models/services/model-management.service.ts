import { apiClient } from '@/services/api/client';
import { config } from '@/app/config/env';
import {
  ModelProfileSummary,
  ModelProfileDetail,
  ModelAsset,
  ModelListResponse,
  ModelSortBy,
  ModelFilterStatus,
} from '../types/model-management.types';

function mapAsset(item: Record<string, unknown>): ModelAsset {
  return {
    assetId: (item.asset_id ?? item.assetId) as string,
    modelId: (item.model_id ?? item.modelId) as string,
    originalFilename: (item.original_filename ?? item.originalFilename) as string,
    mimeType: (item.mime_type ?? item.mimeType) as string,
    fileSizeBytes: (item.file_size_bytes ?? item.fileSizeBytes) as number,
    width: (item.width ?? null) as number | null,
    height: (item.height ?? null) as number | null,
    storagePath: (item.storage_path ?? item.storagePath ?? '') as string,
    viewUrl: (item.view_url ?? item.viewUrl) as string,
    thumbnailUrl: (item.thumbnail_url ?? item.thumbnailUrl ?? null) as string | null,
    orderIndex: (item.order_index ?? item.orderIndex ?? 0) as number,
    isCover: Boolean(item.is_cover ?? item.isCover),
    createdAt: (item.created_at ?? item.createdAt) as string,
  };
}

function mapSummary(item: Record<string, unknown>): ModelProfileSummary {
  return {
    modelId: (item.model_id ?? item.modelId) as string,
    modelCode: (item.model_code ?? item.modelCode) as string,
    displayName: (item.display_name ?? item.displayName) as string,
    description: (item.description ?? null) as string | null,
    coverAssetId: (item.cover_asset_id ?? item.coverAssetId ?? null) as string | null,
    coverImageUrl: (item.cover_image_url ?? item.coverImageUrl ?? null) as string | null,
    status: (item.status ?? 'DRAFT') as ModelProfileSummary['status'],
    modelVersion: (item.model_version ?? item.modelVersion ?? 1) as number,
    referenceAssetsCount: (item.reference_assets_count ?? item.referenceAssetsCount ?? 0) as number,
    usedInProjectsCount: (item.used_in_projects_count ?? item.usedInProjectsCount ?? 0) as number,
    createdAt: (item.created_at ?? item.createdAt) as string,
    updatedAt: (item.updated_at ?? item.updatedAt) as string,
  };
}

function mapDetail(item: Record<string, unknown>): ModelProfileDetail {
  const rawAssets = (item.reference_assets ?? item.referenceAssets ?? []) as Array<Record<string, unknown>>;
  return {
    modelId: (item.model_id ?? item.modelId) as string,
    modelCode: (item.model_code ?? item.modelCode) as string,
    displayName: (item.display_name ?? item.displayName) as string,
    description: (item.description ?? null) as string | null,
    coverAssetId: (item.cover_asset_id ?? item.coverAssetId ?? null) as string | null,
    coverImageUrl: (item.cover_image_url ?? item.coverImageUrl ?? null) as string | null,
    status: (item.status ?? 'DRAFT') as ModelProfileDetail['status'],
    modelVersion: (item.model_version ?? item.modelVersion ?? 1) as number,
    sameModelConfirmed: Boolean(item.same_model_confirmed ?? item.sameModelConfirmed),
    usageRightsConfirmed: Boolean(item.usage_rights_confirmed ?? item.usageRightsConfirmed),
    referenceAssets: rawAssets.map(mapAsset),
    usedInProjectsCount: (item.used_in_projects_count ?? item.usedInProjectsCount ?? 0) as number,
    createdAt: (item.created_at ?? item.createdAt) as string,
    updatedAt: (item.updated_at ?? item.updatedAt) as string,
  };
}

export const modelManagementService = {
  /**
   * List Model Profiles with query, status, sort, pagination
   */
  async listModels(params: {
    query?: string;
    status?: ModelFilterStatus;
    sortBy?: ModelSortBy;
    page?: number;
    limit?: number;
  }): Promise<ModelListResponse> {
    const searchParams = new URLSearchParams();
    if (params.query?.trim()) searchParams.set('query', params.query.trim());
    if (params.status && params.status !== 'ALL') searchParams.set('status', params.status);
    if (params.sortBy) searchParams.set('sort_by', params.sortBy);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = `/models${queryString ? `?${queryString}` : ''}`;
    const raw = await apiClient<Record<string, unknown>>(endpoint);

    const rawItems = (raw.items ?? []) as Array<Record<string, unknown>>;
    return {
      items: rawItems.map(mapSummary),
      total: (raw.total ?? rawItems.length) as number,
      page: (raw.page ?? 1) as number,
      limit: (raw.limit ?? 12) as number,
      totalPages: (raw.total_pages ?? raw.totalPages ?? 1) as number,
    };
  },

  /**
   * Create a new DRAFT model profile
   */
  async createDraft(): Promise<ModelProfileDetail> {
    const raw = await apiClient<Record<string, unknown>>('/models/draft', {
      method: 'POST',
    });
    return mapDetail(raw);
  },

  /**
   * Get single model detail by modelId
   */
  async getModelDetail(modelId: string): Promise<ModelProfileDetail> {
    const raw = await apiClient<Record<string, unknown>>(`/models/${modelId}`);
    return mapDetail(raw);
  },

  /**
   * Update step 1 identity info
   */
  async updateIdentity(
    modelId: string,
    data: { displayName: string; description?: string }
  ): Promise<ModelProfileDetail> {
    const raw = await apiClient<Record<string, unknown>>(`/models/${modelId}/identity`, {
      method: 'PATCH',
      body: JSON.stringify({
        display_name: data.displayName,
        description: data.description,
      }),
    });
    return mapDetail(raw);
  },

  /**
   * Upload a reference photo via multipart/form-data to Local Filesystem Backend.
   * Tracks upload progress in real-time using XMLHttpRequest.
   */
  async uploadModelPhoto(
    modelId: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<ModelAsset> {
    const url = `${config.apiUrl}/models/${modelId}/assets/upload`;
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.open('POST', url);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            resolve(mapAsset(res));
          } catch {
            reject(new Error('Phản hồi từ máy chủ không hợp lệ.'));
          }
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            reject(new Error(errRes.detail || `Tải file thất bại (HTTP ${xhr.status})`));
          } catch {
            reject(new Error(`Tải file lên máy chủ thất bại: HTTP ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Lỗi kết nối khi tải file lên máy chủ backend.'));
      };

      xhr.send(formData);
    });
  },

  /**
   * Update photo order and/or cover
   */
  async updateAssetsOrder(
    modelId: string,
    data: { assetIdsInOrder: string[]; coverAssetId?: string }
  ): Promise<ModelProfileDetail> {
    const raw = await apiClient<Record<string, unknown>>(`/models/${modelId}/assets/order`, {
      method: 'PATCH',
      body: JSON.stringify({
        asset_ids_in_order: data.assetIdsInOrder,
        cover_asset_id: data.coverAssetId,
      }),
    });
    return mapDetail(raw);
  },

  /**
   * Delete asset from model profile
   */
  async deleteAsset(modelId: string, assetId: string): Promise<ModelProfileDetail> {
    const raw = await apiClient<Record<string, unknown>>(`/models/${modelId}/assets/${assetId}`, {
      method: 'DELETE',
    });
    return mapDetail(raw);
  },

  /**
   * Finalize model: DRAFT -> READY
   */
  async finalizeModel(
    modelId: string,
    confirmations: { sameModelConfirmed: boolean; usageRightsConfirmed: boolean }
  ): Promise<ModelProfileDetail> {
    const raw = await apiClient<Record<string, unknown>>(`/models/${modelId}/finalize`, {
      method: 'POST',
      body: JSON.stringify({
        same_model_confirmed: confirmations.sameModelConfirmed,
        usage_rights_confirmed: confirmations.usageRightsConfirmed,
      }),
    });
    return mapDetail(raw);
  },

  /**
   * Update model profile (name, desc, cover, order)
   */
  async updateModel(
    modelId: string,
    data: {
      displayName?: string;
      description?: string;
      coverAssetId?: string;
      assetIdsInOrder?: string[];
    }
  ): Promise<ModelProfileDetail> {
    const raw = await apiClient<Record<string, unknown>>(`/models/${modelId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        display_name: data.displayName,
        description: data.description,
        cover_asset_id: data.coverAssetId,
        asset_ids_in_order: data.assetIdsInOrder,
      }),
    });
    return mapDetail(raw);
  },

  /**
   * Archive model
   */
  async archiveModel(modelId: string): Promise<ModelProfileDetail> {
    const raw = await apiClient<Record<string, unknown>>(`/models/${modelId}/archive`, {
      method: 'POST',
    });
    return mapDetail(raw);
  },

  /**
   * Restore model
   */
  async restoreModel(modelId: string): Promise<ModelProfileDetail> {
    const raw = await apiClient<Record<string, unknown>>(`/models/${modelId}/restore`, {
      method: 'POST',
    });
    return mapDetail(raw);
  },

  /**
   * Delete model (DRAFT or unused only)
   */
  async deleteModel(modelId: string): Promise<{ message: string; modelId: string }> {
    const raw = await apiClient<Record<string, unknown>>(`/models/${modelId}`, {
      method: 'DELETE',
    });
    return {
      message: (raw.message as string) || 'Đã xóa người mẫu.',
      modelId: (raw.model_id ?? raw.modelId ?? modelId) as string,
    };
  },
};
