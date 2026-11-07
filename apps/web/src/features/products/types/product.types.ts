export type ExtractionStatus =
  | 'PENDING'
  | 'ANALYZING_URL'
  | 'FETCHING_METADATA'
  | 'DOWNLOADING_IMAGES'
  | 'COMPLETED'
  | 'PARTIAL'
  | 'FAILED'
  | 'CANCELLED';

export interface ProductImageSource {
  image_id: string;
  source_url: string;
  storage_path: string;
  view_url: string;
  thumbnail_url?: string | null;
  file_size_bytes: number;
  width?: number | null;
  height?: number | null;
  mime_type: string;
  checksum_sha256: string;
  order_index: number;
  is_primary: boolean;
  created_at: string;
}

export interface ExtractedProductData {
  title: string;
  description?: string | null;
  brand?: string | null;
  category?: string | null;
  price?: number | null;
  currency?: string | null;
  sku?: string | null;
  canonical_url?: string | null;
  source_domain: string;
  variants: Array<Record<string, unknown>>;
  images: ProductImageSource[];
  warnings: string[];
  is_partial: boolean;
  failure_reason?: string | null;
}

export interface CreateExtractionRequest {
  url: string;
  force_reextract?: boolean;
}

export interface ExtractionJobResponse {
  job_id: string;
  project_id: string;
  user_id: string;
  source_url: string;
  status: ExtractionStatus;
  current_step: string;
  progress: number;
  created_at: string;
  completed_at?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  extracted_data?: ExtractedProductData | null;
  existing_product_id?: string | null;
}

export interface SaveProductAssetRequest {
  extraction_job_id: string;
  custom_title?: string | null;
  custom_description?: string | null;
  primary_image_id?: string | null;
  selected_image_ids?: string[] | null;
}

export interface ProductAssetResponse {
  product_id: string;
  project_id: string;
  user_id: string;
  source_url: string;
  canonical_url?: string | null;
  source_domain: string;
  title: string;
  custom_title?: string | null;
  description?: string | null;
  custom_description?: string | null;
  brand?: string | null;
  category?: string | null;
  price?: number | null;
  currency?: string | null;
  sku?: string | null;
  variants: Array<Record<string, unknown>>;
  images: ProductImageSource[];
  primary_image_url?: string | null;
  total_images_count: number;
  extraction_status: ExtractionStatus;
  warnings: string[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductAssetSummaryResponse {
  product_id: string;
  project_id: string;
  source_url: string;
  source_domain: string;
  title: string;
  custom_title?: string | null;
  brand?: string | null;
  price?: number | null;
  currency?: string | null;
  primary_image_url?: string | null;
  total_images_count: number;
  extraction_status: ExtractionStatus;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateProductAssetRequest {
  custom_title?: string | null;
  custom_description?: string | null;
  primary_image_id?: string | null;
  is_archived?: boolean | null;
  customTitle?: string | null;
  customDescription?: string | null;
  primaryImageId?: string | null;
  isArchived?: boolean | null;
}
