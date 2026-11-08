export type GarmentCategory =
  | 'shirt'
  | 't_shirt'
  | 'blouse'
  | 'dress'
  | 'jacket'
  | 'hoodie'
  | 'pants'
  | 'skirt';

export type ReplacementJobStatus =
  | 'PENDING'
  | 'VALIDATING_INPUTS'
  | 'ANALYZING_BASE_VIDEO'
  | 'SEGMENTING_GARMENT'
  | 'TRACKING_GARMENT'
  | 'PREPARING_PRODUCT'
  | 'BUILDING_CONSTRAINTS'
  | 'GENERATING_FRAMES'
  | 'COMPOSITING'
  | 'TEMPORAL_CHECK'
  | 'RENDERING'
  | 'QUALITY_REVIEW'
  | 'COMPLETED'
  | 'NEEDS_REVIEW'
  | 'RETRY_REQUIRED'
  | 'BLOCKED'
  | 'FAILED'
  | 'CANCELLED';

export type UserDecision =
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'RETRY_REQUESTED';

export interface ProductTruthSheetSpec {
  truth_sheet_id: string;
  product_id: string;
  version: number;
  category: string;
  silhouette: string;
  primary_color: string;
  pattern: string;
  collar_type: string;
  sleeve_type: string;
  button_count: number;
  button_placement: string;
  button_color: string;
  has_left_pocket: boolean;
  pocket_placement: string;
  pocket_type: string;
  fabric_type: string;
  cuff_buttons: number;
  status: string;
  verified_image_ids: string[];
}

export interface ReplacementPreflightResponse {
  can_replace: boolean;
  category_compatibility: 'SUPPORTED' | 'LIMITED' | 'UNSUPPORTED';
  target_garment_slot: string;
  detected_base_garment: string;
  truth_sheet: ProductTruthSheetSpec;
  blocking_reasons: string[];
  warnings: string[];
}

export interface ReplacementQualityCriterion {
  key: string;
  name: string;
  status: 'PASS' | 'NEEDS_REVIEW' | 'FAIL';
  description: string;
  notes?: string | null;
}

export interface ReplacementQualityReview {
  overall_status: 'PASS' | 'NEEDS_REVIEW' | 'RETRY_REQUIRED';
  criteria: ReplacementQualityCriterion[];
  assessed_at: string;
  inspector: string;
}

export interface ReplacementJobResponse {
  job_id: string;
  project_id: string;
  user_id: string;
  base_video_asset_id: string;
  product_asset_id: string;
  product_title: string;
  model_name: string;
  status: ReplacementJobStatus;
  current_step: string;
  progress: number;
  created_at: string;
  completed_at?: string | null;
  output_video_asset_id?: string | null;
  output_video_url?: string | null;
  output_thumbnail_url?: string | null;
  output_contact_sheet_url?: string | null;
  output_side_by_side_url?: string | null;
  output_video_sha256?: string | null;
  duration_ms?: number | null;
  width?: number | null;
  height?: number | null;
  fps?: number | null;
  codec?: string | null;
  file_size_bytes?: number | null;
  quality_review?: ReplacementQualityReview | null;
  user_decision: UserDecision;
  user_feedback?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  truth_sheet?: ProductTruthSheetSpec | null;
}
