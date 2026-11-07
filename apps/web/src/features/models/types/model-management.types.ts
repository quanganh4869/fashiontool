export type ModelStatus = 'DRAFT' | 'READY' | 'ARCHIVED';

export type ModelFilterStatus = 'ALL' | 'READY' | 'DRAFT' | 'ARCHIVED';

export type ModelSortBy = 'updated_at_desc' | 'created_at_desc' | 'name_asc';

export interface ModelAsset {
  assetId: string;
  modelId: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  width?: number | null;
  height?: number | null;
  storagePath: string; // Relative path in LOCAL_STORAGE_ROOT
  viewUrl: string;     // Local backend asset retrieval URL
  thumbnailUrl?: string | null;
  orderIndex: number;
  isCover: boolean;
  createdAt: string;
}

export interface ModelProfileSummary {
  modelId: string;
  modelCode: string;
  displayName: string;
  description?: string | null;
  coverAssetId?: string | null;
  coverImageUrl?: string | null;
  status: ModelStatus;
  modelVersion: number;
  referenceAssetsCount: number;
  usedInProjectsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ModelProfileDetail {
  modelId: string;
  modelCode: string;
  displayName: string;
  description?: string | null;
  coverAssetId?: string | null;
  coverImageUrl?: string | null;
  status: ModelStatus;
  modelVersion: number;
  sameModelConfirmed: boolean;
  usageRightsConfirmed: boolean;
  referenceAssets: ModelAsset[];
  usedInProjectsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ModelListResponse {
  items: ModelProfileSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type UploadItemStatus =
  | 'queued' // Đang chờ
  | 'uploading' // Đang tải lên
  | 'verifying' // Đang kiểm tra
  | 'completed' // Đã tải lên
  | 'error'; // Tải lên thất bại

export interface ModelUploadItem {
  id: string; // client temporary ID
  file: File;
  previewUrl: string;
  status: UploadItemStatus;
  progress: number; // 0 - 100
  errorMessage?: string;
  assetId?: string;
}

export type WizardStepKey = 'identity' | 'photos' | 'review';
