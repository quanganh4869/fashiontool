import { apiClient } from '@/services/api/client';
import { config } from '@/app/config/env';
import {
  CompatibilityAssessmentStatus,
  CompatibilityCheckItem,
  CompatibilityCheckResponse,
  CreateGenerationRequest,
  GenerationStatus,
  ModelTemplateGeneration,
  ProjectDetail,
  ProjectSummary,
  QualityCriterion,
  QualityReviewReport,
} from '../types/studio.types';

function mapCheckItem(raw: Record<string, unknown>): CompatibilityCheckItem {
  return {
    key: (raw.key ?? '') as string,
    name: (raw.name ?? '') as string,
    status: (raw.status ?? 'NOT_ASSESSED') as CompatibilityAssessmentStatus,
    message: (raw.message ?? '') as string,
  };
}

function mapCompatibilityResponse(raw: Record<string, unknown>): CompatibilityCheckResponse {
  const checksRaw = (raw.checks ?? []) as Array<Record<string, unknown>>;
  return {
    status: (raw.status ?? 'NOT_ASSESSED') as CompatibilityAssessmentStatus,
    canGenerate: Boolean(raw.can_generate ?? raw.canGenerate),
    modelId: (raw.model_id ?? raw.modelId ?? '') as string,
    modelName: (raw.model_name ?? raw.modelName ?? '') as string,
    modelVersion: (raw.model_version ?? raw.modelVersion ?? 1) as number,
    templateId: (raw.template_id ?? raw.templateId ?? '') as string,
    templateTitle: (raw.template_title ?? raw.templateTitle ?? '') as string,
    templateCode: (raw.template_code ?? raw.templateCode ?? '') as string,
    templateVersionId: (raw.template_version_id ?? raw.templateVersionId ?? '') as string,
    checks: checksRaw.map(mapCheckItem),
    warnings: ((raw.warnings ?? []) as string[]),
    blockingReasons: ((raw.blocking_reasons ?? raw.blockingReasons ?? []) as string[]),
  };
}

function mapQualityCriterion(raw: Record<string, unknown>): QualityCriterion {
  return {
    key: (raw.key ?? '') as string,
    name: (raw.name ?? '') as string,
    status: (raw.status ?? 'NOT_ASSESSED') as QualityCriterion['status'],
    description: (raw.description ?? '') as string,
    notes: (raw.notes ?? null) as string | null,
  };
}

function mapQualityReviewReport(raw: Record<string, unknown> | null | undefined): QualityReviewReport | null {
  if (!raw) return null;
  const criteriaRaw = (raw.criteria ?? []) as Array<Record<string, unknown>>;
  return {
    overallStatus: (raw.overall_status ?? raw.overallStatus ?? 'NOT_ASSESSED') as QualityReviewReport['overallStatus'],
    criteria: criteriaRaw.map(mapQualityCriterion),
    assessedAt: (raw.assessed_at ?? raw.assessedAt ?? '') as string,
    inspector: (raw.inspector ?? '') as string,
  };
}

function mapGeneration(raw: Record<string, unknown>): ModelTemplateGeneration {
  return {
    generationId: (raw.generation_id ?? raw.generationId) as string,
    userId: (raw.user_id ?? raw.userId ?? 'default_user') as string,
    projectId: (raw.project_id ?? raw.projectId) as string,
    projectName: (raw.project_name ?? raw.projectName ?? '') as string,
    modelId: (raw.model_id ?? raw.modelId) as string,
    modelName: (raw.model_name ?? raw.modelName ?? '') as string,
    modelVersion: (raw.model_version ?? raw.modelVersion ?? 1) as number,
    modelCoverUrl: (raw.model_cover_url ?? raw.modelCoverUrl ?? null) as string | null,
    templateId: (raw.template_id ?? raw.templateId) as string,
    templateTitle: (raw.template_title ?? raw.templateTitle ?? '') as string,
    templateCode: (raw.template_code ?? raw.templateCode ?? '') as string,
    templateVersionId: (raw.template_version_id ?? raw.templateVersionId ?? '') as string,
    templatePosterUrl: (raw.template_poster_url ?? raw.templatePosterUrl ?? '') as string,
    status: (raw.status ?? 'DRAFT') as GenerationStatus,
    currentStep: (raw.current_step ?? raw.currentStep ?? '') as string,
    progress: (raw.progress ?? 0) as number,
    createdAt: (raw.created_at ?? raw.createdAt ?? '') as string,
    startedAt: (raw.started_at ?? raw.startedAt ?? null) as string | null,
    completedAt: (raw.completed_at ?? raw.completedAt ?? null) as string | null,
    errorCode: (raw.error_code ?? raw.errorCode ?? null) as string | null,
    errorMessage: (raw.error_message ?? raw.errorMessage ?? null) as string | null,
    outputVideoAssetId: (raw.output_video_asset_id ?? raw.outputVideoAssetId ?? null) as string | null,
    outputVideoUrl: (raw.output_video_url ?? raw.outputVideoUrl ?? null) as string | null,
    outputThumbnailUrl: (raw.output_thumbnail_url ?? raw.outputThumbnailUrl ?? null) as string | null,
    durationMs: (raw.duration_ms ?? raw.durationMs ?? null) as number | null,
    width: (raw.width ?? null) as number | null,
    height: (raw.height ?? null) as number | null,
    fps: (raw.fps ?? null) as number | null,
    codec: (raw.codec ?? null) as string | null,
    qualityReview: mapQualityReviewReport(raw.quality_review as Record<string, unknown> | null | undefined),
    retryCount: (raw.retry_count ?? raw.retryCount ?? 0) as number,
  };
}

function mapProjectSummary(raw: Record<string, unknown>): ProjectSummary {
  return {
    projectId: (raw.project_id ?? raw.projectId) as string,
    name: (raw.name ?? '') as string,
    description: (raw.description ?? null) as string | null,
    modelId: (raw.model_id ?? raw.modelId) as string,
    modelName: (raw.model_name ?? raw.modelName ?? '') as string,
    templateId: (raw.template_id ?? raw.templateId) as string,
    templateTitle: (raw.template_title ?? raw.templateTitle ?? '') as string,
    currentGenerationId: (raw.current_generation_id ?? raw.currentGenerationId ?? null) as string | null,
    currentGenerationStatus: (raw.current_generation_status ?? raw.currentGenerationStatus ?? null) as GenerationStatus | null,
    outputVideoUrl: (raw.output_video_url ?? raw.outputVideoUrl ?? null) as string | null,
    totalGenerations: (raw.total_generations ?? raw.totalGenerations ?? 0) as number,
    createdAt: (raw.created_at ?? raw.createdAt ?? '') as string,
    updatedAt: (raw.updated_at ?? raw.updatedAt ?? '') as string,
  };
}

export const studioService = {
  /**
   * Check compatibility between a model and a video template
   */
  async checkCompatibility(modelId: string, templateId: string): Promise<CompatibilityCheckResponse> {
    const raw = await apiClient<Record<string, unknown>>('/personalization/compatibility', {
      method: 'POST',
      body: JSON.stringify({
        model_id: modelId,
        template_id: templateId,
      }),
    });
    return mapCompatibilityResponse(raw);
  },

  /**
   * Create an independent ModelTemplateGeneration job
   */
  async createGeneration(payload: CreateGenerationRequest): Promise<ModelTemplateGeneration> {
    const raw = await apiClient<Record<string, unknown>>('/personalization/generations', {
      method: 'POST',
      body: JSON.stringify({
        model_id: payload.modelId,
        template_id: payload.templateId,
        project_id: payload.projectId || null,
        project_name: payload.projectName || null,
        confirmed_limitations: Boolean(payload.confirmedLimitations),
        processing_config: payload.processingConfig || null,
      }),
    });
    return mapGeneration(raw);
  },

  /**
   * Poll generation status by ID
   */
  async getGeneration(generationId: string): Promise<ModelTemplateGeneration> {
    const raw = await apiClient<Record<string, unknown>>(`/personalization/generations/${generationId}`);
    return mapGeneration(raw);
  },

  /**
   * Cancel an active generation job
   */
  async cancelGeneration(generationId: string): Promise<ModelTemplateGeneration> {
    const raw = await apiClient<Record<string, unknown>>(`/personalization/generations/${generationId}/cancel`, {
      method: 'POST',
    });
    return mapGeneration(raw);
  },

  /**
   * Retry a failed generation job
   */
  async retryGeneration(generationId: string): Promise<ModelTemplateGeneration> {
    const raw = await apiClient<Record<string, unknown>>(`/personalization/generations/${generationId}/retry`, {
      method: 'POST',
    });
    return mapGeneration(raw);
  },

  /**
   * List all user projects
   */
  async listProjects(): Promise<ProjectSummary[]> {
    const raw = await apiClient<Array<Record<string, unknown>>>('/personalization/projects');
    return raw.map(mapProjectSummary);
  },

  /**
   * Get single project detail with its generations history
   */
  async getProjectDetail(projectId: string): Promise<ProjectDetail> {
    const raw = await apiClient<Record<string, unknown>>(`/personalization/projects/${projectId}`);
    const summary = mapProjectSummary(raw);
    const rawGenerations = (raw.generations ?? []) as Array<Record<string, unknown>>;
    return {
      ...summary,
      generations: rawGenerations.map(mapGeneration),
    };
  },

  async deleteProject(projectId: string): Promise<void> {
    await apiClient(`/personalization/projects/${projectId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Build absolute URL for video stream or view
   */
  resolveMediaUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    const base = config.apiUrl.replace(/\/+$/, '');
    if (cleanUrl.startsWith('/api/v1')) {
      const host = base.replace(/\/api\/v1\/?$/, '');
      return `${host}${cleanUrl}`;
    }
    return `${base}${cleanUrl}`;
  },

  /**
   * Helper formatting
   */
  formatDuration(ms: number | null | undefined): string {
    if (!ms || ms <= 0) return '0:00';
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  getCompatibilityBadgeConfig(status: CompatibilityAssessmentStatus): {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
  } {
    switch (status) {
      case 'SUPPORTED':
        return {
          label: 'Tương thích hoàn toàn',
          bgClass: 'bg-emerald-50',
          textClass: 'text-emerald-700',
          borderClass: 'border-emerald-200',
        };
      case 'LIMITED':
        return {
          label: 'Tương thích có giới hạn',
          bgClass: 'bg-amber-50',
          textClass: 'text-amber-700',
          borderClass: 'border-amber-200',
        };
      case 'UNSUPPORTED':
        return {
          label: 'Không tương thích',
          bgClass: 'bg-rose-50',
          textClass: 'text-rose-700',
          borderClass: 'border-rose-200',
        };
      case 'NOT_ASSESSED':
      default:
        return {
          label: 'Chưa đánh giá',
          bgClass: 'bg-slate-50',
          textClass: 'text-slate-600',
          borderClass: 'border-slate-200',
        };
    }
  },

  getGenerationStatusConfig(status: GenerationStatus): {
    label: string;
    bgClass: string;
    textClass: string;
  } {
    switch (status) {
      case 'DRAFT':
        return { label: 'Bản nháp', bgClass: 'bg-slate-100', textClass: 'text-slate-700' };
      case 'QUEUED':
        return { label: 'Đang chờ hàng đợi', bgClass: 'bg-blue-50', textClass: 'text-blue-700' };
      case 'VALIDATING':
        return { label: 'Đang kiểm tra dữ liệu', bgClass: 'bg-amber-50', textClass: 'text-amber-700' };
      case 'PROCESSING':
        return { label: 'Đang xử lý video', bgClass: 'bg-indigo-50', textClass: 'text-indigo-700' };
      case 'QUALITY_REVIEW':
        return { label: 'Đang kiểm tra chất lượng', bgClass: 'bg-purple-50', textClass: 'text-purple-700' };
      case 'COMPLETED':
        return { label: 'Hoàn tất', bgClass: 'bg-emerald-50', textClass: 'text-emerald-700' };
      case 'FAILED':
        return { label: 'Thất bại', bgClass: 'bg-rose-50', textClass: 'text-rose-700' };
      case 'CANCELLED':
        return { label: 'Đã hủy', bgClass: 'bg-slate-100', textClass: 'text-slate-500' };
      default:
        return { label: status, bgClass: 'bg-slate-100', textClass: 'text-slate-700' };
    }
  },
};
