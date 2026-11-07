export type TemplateStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export type AssessmentStatus = 'SUPPORTED' | 'LIMITED' | 'UNSUPPORTED' | 'NOT_ASSESSED';

export type AssessmentFilterStatus = AssessmentStatus | 'ALL';

export type TemplateSortBy =
  | 'updated_at_desc'
  | 'duration_asc'
  | 'duration_desc'
  | 'name_asc'
  | 'usage_desc';

export interface TemplateCategory {
  id: string;
  name: string;
  count?: number | null;
}

export interface TemplateScene {
  sceneId: string;
  templateId: string;
  sceneOrder: number;
  startTimeMs: number;
  endTimeMs: number;
  actionDescription: string;
  cameraMovement: string;
  framing: string;
  subjectVisibility: string;
}

export interface TemplateGarmentSlot {
  slotId: string;
  templateId: string;
  slotType: string;
  slotName: string;
  assessmentStatus: AssessmentStatus;
  visibilityLevel: string;
  occlusionStatus: string;
  notes?: string | null;
}

export interface TemplateCompatibility {
  templateId: string;
  supportedAspectRatios: string[];
  supportedModelFramings: string[];
  supportedSubjectCount: number;
  supportedMotionTypes: string[];
  faceVisibilityRequirement: string;
  bodyVisibilityRequirement: string;
  occlusionLevel: string;
  limitations: string[];
}

export interface TemplateSummary {
  templateId: string;
  templateCode: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  tags: string[];
  posterUrl: string;
  previewUrl?: string | null;
  durationMs: number;
  width: number;
  height: number;
  aspectRatio: string;
  status: TemplateStatus;
  isFavorite: boolean;
  usageCount: number;
  garmentSlotsSummary: string[];
  publishedAt: string;
  updatedAt: string;
}

export interface TemplateDetail extends TemplateSummary {
  streamUrl: string;
  frameRate: number;
  videoCodec: string;
  audioCodec?: string | null;
  templateVersionId: string;
  scenes: TemplateScene[];
  garmentSlots: TemplateGarmentSlot[];
  compatibility: TemplateCompatibility;
}

export interface TemplateListResponse {
  items: TemplateSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TemplateQueryParams {
  query?: string;
  category?: string;
  motionType?: string;
  durationRange?: 'under_10s' | '10_20s' | '20_30s' | 'over_30s';
  aspectRatio?: string;
  garmentSlot?: string;
  assessmentStatus?: AssessmentFilterStatus;
  isFavorite?: boolean;
  sortBy?: TemplateSortBy;
  page?: number;
  limit?: number;
}

export interface ToggleFavoriteResult {
  templateId: string;
  isFavorite: boolean;
  message: string;
}
