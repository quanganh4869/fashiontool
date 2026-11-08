export type CompatibilityAssessmentStatus =
  | 'SUPPORTED'
  | 'LIMITED'
  | 'UNSUPPORTED'
  | 'NOT_ASSESSED';

export interface CompatibilityCheckItem {
  key: string;
  name: string;
  status: CompatibilityAssessmentStatus;
  message: string;
}

export interface CompatibilityCheckResponse {
  status: CompatibilityAssessmentStatus;
  canGenerate: boolean;
  modelId: string;
  modelName: string;
  modelVersion: number;
  templateId: string;
  templateTitle: string;
  templateCode: string;
  templateVersionId: string;
  checks: CompatibilityCheckItem[];
  warnings: string[];
  blockingReasons: string[];
}

export type GenerationStatus =
  | 'DRAFT'
  | 'QUEUED'
  | 'VALIDATING'
  | 'PROCESSING'
  | 'QUALITY_REVIEW'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type QualityCriterionStatus = 'PASS' | 'NEEDS_REVIEW' | 'NOT_ASSESSED';

export interface QualityCriterion {
  key: string;
  name: string;
  status: QualityCriterionStatus;
  description: string;
  notes?: string | null;
}

export interface QualityReviewReport {
  overallStatus: QualityCriterionStatus;
  criteria: QualityCriterion[];
  assessedAt: string;
  inspector: string;
}

export interface CreateGenerationRequest {
  modelId: string;
  templateId: string;
  projectId?: string | null;
  projectName?: string | null;
  confirmedLimitations?: boolean;
  processingConfig?: Record<string, unknown> | null;
}

export interface ModelTemplateGeneration {
  generationId: string;
  userId: string;
  projectId: string;
  projectName: string;
  modelId: string;
  modelName: string;
  modelVersion: number;
  modelCoverUrl?: string | null;
  templateId: string;
  templateTitle: string;
  templateCode: string;
  templateVersionId: string;
  templatePosterUrl: string;
  status: GenerationStatus;
  currentStep: string;
  progress: number;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  outputVideoAssetId?: string | null;
  outputVideoUrl?: string | null;
  outputThumbnailUrl?: string | null;
  durationMs?: number | null;
  width?: number | null;
  height?: number | null;
  fps?: number | null;
  codec?: string | null;
  qualityReview?: QualityReviewReport | null;
  retryCount: number;
}

export interface ProjectSummary {
  projectId: string;
  name: string;
  description?: string | null;
  modelId: string;
  modelName: string;
  templateId: string;
  templateTitle: string;
  currentGenerationId?: string | null;
  currentGenerationStatus?: GenerationStatus | null;
  outputVideoUrl?: string | null;
  totalGenerations: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends ProjectSummary {
  generations: ModelTemplateGeneration[];
}

export type StudioStep =
  | 'model'
  | 'template'
  | 'confirm'
  | 'processing'
  | 'result'
  | 'products'
  | 'replacement';
