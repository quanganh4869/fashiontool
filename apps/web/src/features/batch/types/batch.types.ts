import {
  ProductTruthSheetSpec,
  ReplacementJobResponse,
  ReplacementQualityReview,
  UserDecision,
} from '@/features/replacement/types/replacement.types';

export type BatchProductionStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type BatchProductEligibilityStatus = 'ELIGIBLE' | 'WARNINGS' | 'BLOCKED';

export interface BatchPreflightProductItem {
  product_id: string;
  product_title: string;
  variant_id?: string | null;
  primary_image_url?: string | null;
  status: BatchProductEligibilityStatus;
  category_compatibility: string;
  target_garment_slot: string;
  truth_sheet?: ProductTruthSheetSpec | null;
  blocking_reasons: string[];
  warnings: string[];
}

export interface BatchPreflightResponse {
  can_proceed: boolean;
  total_requested: number;
  eligible_count: number;
  warnings_count: number;
  blocked_count: number;
  items: BatchPreflightProductItem[];
}

export interface CreateBatchProductionRequest {
  project_id: string;
  base_video_asset_id: string;
  product_asset_ids: string[];
  batch_name?: string | null;
  confirmed_limitations?: boolean;
  idempotency_key?: string | null;
}

export interface BatchProductionGroup {
  batch_id: string;
  project_id: string;
  user_id: string;
  name: string;
  base_video_asset_id: string;
  base_video_title: string;
  model_name: string;
  status: BatchProductionStatus;
  total_jobs: number;
  queued_jobs: number;
  processing_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  cancelled_jobs: number;
  progress: number;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  job_ids: string[];
  idempotency_key?: string | null;
}

export interface BatchDetailResponse {
  batch: BatchProductionGroup;
  jobs: ReplacementJobResponse[];
}

export interface FinalVideoItem {
  video_id: string;
  project_id: string;
  batch_id?: string | null;
  product_id: string;
  product_title: string;
  variant_title?: string | null;
  model_name: string;
  base_video_asset_id: string;
  video_asset_id: string;
  video_url: string;
  thumbnail_url: string;
  contact_sheet_url?: string | null;
  side_by_side_url?: string | null;
  duration_ms: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  file_size_bytes: number;
  sha256: string;
  quality_review?: ReplacementQualityReview | null;
  user_decision: UserDecision;
  created_at: string;
  is_archived: boolean;
}

export interface FinalVideoLibraryResponse {
  items: FinalVideoItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
