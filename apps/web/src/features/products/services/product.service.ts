import { apiClient } from '@/services/api/client';
import { config } from '@/app/config/env';
import {
  CreateExtractionRequest,
  ExtractedProductData,
  ExtractionJobResponse,
  ExtractionStatus,
  ProductAssetResponse,
  ProductAssetSummaryResponse,
  ProductImageSource,
  SaveProductAssetRequest,
  UpdateProductAssetRequest,
} from '../types/product.types';

function mapImageSource(raw: Record<string, unknown>): ProductImageSource {
  return {
    image_id: (raw.image_id ?? raw.imageId ?? '') as string,
    source_url: (raw.source_url ?? raw.sourceUrl ?? '') as string,
    storage_path: (raw.storage_path ?? raw.storagePath ?? '') as string,
    view_url: (raw.view_url ?? raw.viewUrl ?? '') as string,
    thumbnail_url: (raw.thumbnail_url ?? raw.thumbnailUrl ?? null) as string | null,
    file_size_bytes: (raw.file_size_bytes ?? raw.fileSizeBytes ?? 0) as number,
    width: (raw.width ?? null) as number | null,
    height: (raw.height ?? null) as number | null,
    mime_type: (raw.mime_type ?? raw.mimeType ?? 'image/jpeg') as string,
    checksum_sha256: (raw.checksum_sha256 ?? raw.checksumSha256 ?? '') as string,
    order_index: (raw.order_index ?? raw.orderIndex ?? 0) as number,
    is_primary: Boolean(raw.is_primary ?? raw.isPrimary ?? false),
    created_at: (raw.created_at ?? raw.createdAt ?? '') as string,
  };
}

function mapExtractedData(
  raw: Record<string, unknown> | null | undefined
): ExtractedProductData | null {
  if (!raw) return null;
  const rawImages = (raw.images ?? []) as Array<Record<string, unknown>>;
  return {
    title: (raw.title ?? '') as string,
    description: (raw.description ?? null) as string | null,
    brand: (raw.brand ?? null) as string | null,
    category: (raw.category ?? null) as string | null,
    price: (raw.price ?? null) as number | null,
    currency: (raw.currency ?? null) as string | null,
    sku: (raw.sku ?? null) as string | null,
    canonical_url: (raw.canonical_url ?? raw.canonicalUrl ?? null) as string | null,
    source_domain: (raw.source_domain ?? raw.sourceDomain ?? '') as string,
    variants: (raw.variants ?? []) as Array<Record<string, unknown>>,
    images: rawImages.map(mapImageSource),
    warnings: ((raw.warnings ?? []) as string[]),
    is_partial: Boolean(raw.is_partial ?? raw.isPartial ?? false),
    failure_reason: (raw.failure_reason ?? raw.failureReason ?? null) as string | null,
  };
}

function mapExtractionJob(raw: Record<string, unknown>): ExtractionJobResponse {
  return {
    job_id: (raw.job_id ?? raw.jobId ?? '') as string,
    project_id: (raw.project_id ?? raw.projectId ?? '') as string,
    user_id: (raw.user_id ?? raw.userId ?? 'default_user') as string,
    source_url: (raw.source_url ?? raw.sourceUrl ?? '') as string,
    status: (raw.status ?? 'PENDING') as ExtractionStatus,
    current_step: (raw.current_step ?? raw.currentStep ?? '') as string,
    progress: (raw.progress ?? 0) as number,
    created_at: (raw.created_at ?? raw.createdAt ?? '') as string,
    completed_at: (raw.completed_at ?? raw.completedAt ?? null) as string | null,
    error_code: (raw.error_code ?? raw.errorCode ?? null) as string | null,
    error_message: (raw.error_message ?? raw.errorMessage ?? null) as string | null,
    extracted_data: mapExtractedData(
      raw.extracted_data as Record<string, unknown> | null | undefined
    ),
    existing_product_id: (raw.existing_product_id ?? raw.existingProductId ?? null) as
      | string
      | null,
  };
}

function mapProductAsset(raw: Record<string, unknown>): ProductAssetResponse {
  const rawImages = (raw.images ?? []) as Array<Record<string, unknown>>;
  return {
    product_id: (raw.product_id ?? raw.productId ?? '') as string,
    project_id: (raw.project_id ?? raw.projectId ?? '') as string,
    user_id: (raw.user_id ?? raw.userId ?? 'default_user') as string,
    source_url: (raw.source_url ?? raw.sourceUrl ?? '') as string,
    canonical_url: (raw.canonical_url ?? raw.canonicalUrl ?? null) as string | null,
    source_domain: (raw.source_domain ?? raw.sourceDomain ?? '') as string,
    title: (raw.title ?? '') as string,
    custom_title: (raw.custom_title ?? raw.customTitle ?? null) as string | null,
    description: (raw.description ?? null) as string | null,
    custom_description: (raw.custom_description ?? raw.customDescription ?? null) as
      | string
      | null,
    brand: (raw.brand ?? null) as string | null,
    category: (raw.category ?? null) as string | null,
    price: (raw.price ?? null) as number | null,
    currency: (raw.currency ?? null) as string | null,
    sku: (raw.sku ?? null) as string | null,
    variants: (raw.variants ?? []) as Array<Record<string, unknown>>,
    images: rawImages.map(mapImageSource),
    primary_image_url: (raw.primary_image_url ?? raw.primaryImageUrl ?? null) as
      | string
      | null,
    total_images_count: (raw.total_images_count ?? raw.totalImagesCount ?? 0) as number,
    extraction_status: (raw.extraction_status ?? raw.extractionStatus ?? 'COMPLETED') as ExtractionStatus,
    warnings: ((raw.warnings ?? []) as string[]),
    is_archived: Boolean(raw.is_archived ?? raw.isArchived ?? false),
    created_at: (raw.created_at ?? raw.createdAt ?? '') as string,
    updated_at: (raw.updated_at ?? raw.updatedAt ?? '') as string,
  };
}

function mapProductSummary(raw: Record<string, unknown>): ProductAssetSummaryResponse {
  return {
    product_id: (raw.product_id ?? raw.productId ?? '') as string,
    project_id: (raw.project_id ?? raw.projectId ?? '') as string,
    source_url: (raw.source_url ?? raw.sourceUrl ?? '') as string,
    source_domain: (raw.source_domain ?? raw.sourceDomain ?? '') as string,
    title: (raw.title ?? '') as string,
    custom_title: (raw.custom_title ?? raw.customTitle ?? null) as string | null,
    brand: (raw.brand ?? null) as string | null,
    price: (raw.price ?? null) as number | null,
    currency: (raw.currency ?? null) as string | null,
    primary_image_url: (raw.primary_image_url ?? raw.primaryImageUrl ?? null) as
      | string
      | null,
    total_images_count: (raw.total_images_count ?? raw.totalImagesCount ?? 0) as number,
    extraction_status: (raw.extraction_status ?? raw.extractionStatus ?? 'COMPLETED') as ExtractionStatus,
    is_archived: Boolean(raw.is_archived ?? raw.isArchived ?? false),
    created_at: (raw.created_at ?? raw.createdAt ?? '') as string,
    updated_at: (raw.updated_at ?? raw.updatedAt ?? '') as string,
  };
}

export const productService = {
  /**
   * Resolve an image media path to a full URL
   */
  resolveImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('blob:') || url.startsWith('data:')) return url;
    const baseUrl = config.apiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanPath}`;
  },

  formatPrice(price?: number | null, currency?: string | null): string {
    if (price === undefined || price === null) return 'Liên hệ';
    const curr = currency || '₫';
    return `${price.toLocaleString('vi-VN')} ${curr}`;
  },

  formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, idx);
    return `${value.toFixed(1)} ${units[idx]}`;
  },

  /**
   * Submit a product URL for SSRF validation, metadata scraping, and image download
   */
  async startExtraction(
    projectId: string,
    payload: CreateExtractionRequest
  ): Promise<ExtractionJobResponse> {
    const raw = await apiClient<Record<string, unknown>>(
      `/projects/${projectId}/products/extractions`,
      {
        method: 'POST',
        body: JSON.stringify({
          url: payload.url,
          force_reextract: Boolean(payload.force_reextract),
        }),
      }
    );
    return mapExtractionJob(raw);
  },

  /**
   * Poll status of an ongoing extraction job
   */
  async getExtractionStatus(
    projectId: string,
    jobId: string
  ): Promise<ExtractionJobResponse> {
    const raw = await apiClient<Record<string, unknown>>(
      `/projects/${projectId}/products/extractions/${jobId}`
    );
    return mapExtractionJob(raw);
  },

  /**
   * Cancel an ongoing extraction job
   */
  async cancelExtraction(
    projectId: string,
    jobId: string
  ): Promise<ExtractionJobResponse> {
    const raw = await apiClient<Record<string, unknown>>(
      `/projects/${projectId}/products/extractions/${jobId}/cancel`,
      {
        method: 'POST',
      }
    );
    return mapExtractionJob(raw);
  },

  /**
   * Save extracted product data as a permanent ProductAsset
   */
  async saveProduct(
    projectId: string,
    payload: SaveProductAssetRequest
  ): Promise<ProductAssetResponse> {
    const raw = await apiClient<Record<string, unknown>>(
      `/projects/${projectId}/products`,
      {
        method: 'POST',
        body: JSON.stringify({
          extraction_job_id: payload.extraction_job_id,
          custom_title: payload.custom_title || null,
          custom_description: payload.custom_description || null,
          primary_image_id: payload.primary_image_id || null,
          selected_image_ids: payload.selected_image_ids || null,
        }),
      }
    );
    return mapProductAsset(raw);
  },

  /**
   * List all Product Assets inside a project
   */
  async listProducts(
    projectId: string,
    search?: string,
    includeArchived = false
  ): Promise<ProductAssetSummaryResponse[]> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (includeArchived) params.set('include_archived', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';

    const rawList = await apiClient<Array<Record<string, unknown>>>(
      `/projects/${projectId}/products${query}`
    );
    return rawList.map(mapProductSummary);
  },

  /**
   * Get single Product Asset detail
   */
  async getProduct(
    projectId: string,
    productId: string
  ): Promise<ProductAssetResponse> {
    const raw = await apiClient<Record<string, unknown>>(
      `/projects/${projectId}/products/${productId}`
    );
    return mapProductAsset(raw);
  },

  /**
   * Update Product Asset (custom title, description, primary image)
   */
  async updateProduct(
    projectId: string,
    productId: string,
    payload: UpdateProductAssetRequest
  ): Promise<ProductAssetResponse> {
    const raw = await apiClient<Record<string, unknown>>(
      `/projects/${projectId}/products/${productId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          custom_title: payload.customTitle ?? payload.custom_title,
          custom_description: payload.customDescription ?? payload.custom_description,
          primary_image_id: payload.primaryImageId ?? payload.primary_image_id,
          is_archived: payload.isArchived ?? payload.is_archived,
        }),
      }
    );
    return mapProductAsset(raw);
  },

  /**
   * Soft-delete / archive a Product Asset
   */
  async deleteProduct(projectId: string, productId: string): Promise<void> {
    await apiClient<void>(`/projects/${projectId}/products/${productId}`, {
      method: 'DELETE',
    });
  },
};
