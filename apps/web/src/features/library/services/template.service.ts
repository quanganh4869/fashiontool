import { apiClient } from '@/services/api/client';
import { config } from '@/app/config/env';
import {
  TemplateCategory,
  TemplateSummary,
  TemplateDetail,
  TemplateListResponse,
  TemplateQueryParams,
  ToggleFavoriteResult,
  TemplateScene,
  TemplateGarmentSlot,
  TemplateCompatibility,
} from '../types/template.types';

function mapScene(raw: Record<string, unknown>): TemplateScene {
  return {
    sceneId: (raw.scene_id ?? raw.sceneId) as string,
    templateId: (raw.template_id ?? raw.templateId) as string,
    sceneOrder: (raw.scene_order ?? raw.sceneOrder) as number,
    startTimeMs: (raw.start_time_ms ?? raw.startTimeMs) as number,
    endTimeMs: (raw.end_time_ms ?? raw.endTimeMs) as number,
    actionDescription: (raw.action_description ?? raw.actionDescription ?? '') as string,
    cameraMovement: (raw.camera_movement ?? raw.cameraMovement ?? '') as string,
    framing: (raw.framing ?? '') as string,
    subjectVisibility: (raw.subject_visibility ?? raw.subjectVisibility ?? '') as string,
  };
}

function mapGarmentSlot(raw: Record<string, unknown>): TemplateGarmentSlot {
  return {
    slotId: (raw.slot_id ?? raw.slotId) as string,
    templateId: (raw.template_id ?? raw.templateId) as string,
    slotType: (raw.slot_type ?? raw.slotType) as string,
    slotName: (raw.slot_name ?? raw.slotName) as string,
    assessmentStatus: (raw.assessment_status ?? raw.assessmentStatus ?? 'NOT_ASSESSED') as TemplateGarmentSlot['assessmentStatus'],
    visibilityLevel: (raw.visibility_level ?? raw.visibilityLevel ?? '') as string,
    occlusionStatus: (raw.occlusion_status ?? raw.occlusionStatus ?? '') as string,
    notes: (raw.notes ?? null) as string | null,
  };
}

function mapCompatibility(raw: Record<string, unknown>): TemplateCompatibility {
  return {
    templateId: (raw.template_id ?? raw.templateId) as string,
    supportedAspectRatios: ((raw.supported_aspect_ratios ?? raw.supportedAspectRatios ?? []) as string[]),
    supportedModelFramings: ((raw.supported_model_framings ?? raw.supportedModelFramings ?? []) as string[]),
    supportedSubjectCount: (raw.supported_subject_count ?? raw.supportedSubjectCount ?? 1) as number,
    supportedMotionTypes: ((raw.supported_motion_types ?? raw.supportedMotionTypes ?? []) as string[]),
    faceVisibilityRequirement: (raw.face_visibility_requirement ?? raw.faceVisibilityRequirement ?? '') as string,
    bodyVisibilityRequirement: (raw.body_visibility_requirement ?? raw.bodyVisibilityRequirement ?? '') as string,
    occlusionLevel: (raw.occlusion_level ?? raw.occlusionLevel ?? '') as string,
    limitations: ((raw.limitations ?? []) as string[]),
  };
}

function mapSummary(raw: Record<string, unknown>): TemplateSummary {
  return {
    templateId: (raw.template_id ?? raw.templateId) as string,
    templateCode: (raw.template_code ?? raw.templateCode) as string,
    title: (raw.title ?? '') as string,
    description: (raw.description ?? '') as string,
    categoryId: (raw.category_id ?? raw.categoryId) as string,
    categoryName: (raw.category_name ?? raw.categoryName ?? '') as string,
    tags: ((raw.tags ?? []) as string[]),
    posterUrl: (raw.poster_url ?? raw.posterUrl ?? '') as string,
    previewUrl: (raw.preview_url ?? raw.previewUrl ?? null) as string | null,
    durationMs: (raw.duration_ms ?? raw.durationMs ?? 0) as number,
    width: (raw.width ?? 1080) as number,
    height: (raw.height ?? 1920) as number,
    aspectRatio: (raw.aspect_ratio ?? raw.aspectRatio ?? '9:16') as string,
    status: (raw.status ?? 'PUBLISHED') as TemplateSummary['status'],
    isFavorite: Boolean(raw.is_favorite ?? raw.isFavorite),
    usageCount: (raw.usage_count ?? raw.usageCount ?? 0) as number,
    garmentSlotsSummary: ((raw.garment_slots_summary ?? raw.garmentSlotsSummary ?? []) as string[]),
    publishedAt: (raw.published_at ?? raw.publishedAt ?? '') as string,
    updatedAt: (raw.updated_at ?? raw.updatedAt ?? '') as string,
  };
}

function mapDetail(raw: Record<string, unknown>): TemplateDetail {
  const summary = mapSummary(raw);
  const rawScenes = (raw.scenes ?? []) as Array<Record<string, unknown>>;
  const rawSlots = (raw.garment_slots ?? raw.garmentSlots ?? []) as Array<Record<string, unknown>>;
  const rawCompat = (raw.compatibility ?? {}) as Record<string, unknown>;

  return {
    ...summary,
    streamUrl: (raw.stream_url ?? raw.streamUrl ?? `/api/v1/templates/${summary.templateId}/stream`) as string,
    frameRate: (raw.frame_rate ?? raw.frameRate ?? 30) as number,
    videoCodec: (raw.video_codec ?? raw.videoCodec ?? 'h264') as string,
    audioCodec: (raw.audio_codec ?? raw.audioCodec ?? null) as string | null,
    templateVersionId: (raw.template_version_id ?? raw.templateVersionId ?? 'v1.0.0') as string,
    scenes: rawScenes.map(mapScene),
    garmentSlots: rawSlots.map(mapGarmentSlot),
    compatibility: mapCompatibility(rawCompat),
  };
}

export const templateService = {
  /**
   * List template categories with counts
   */
  async listCategories(): Promise<TemplateCategory[]> {
    const raw = await apiClient<Array<Record<string, unknown>>>('/templates/categories');
    return raw.map((item) => ({
      id: item.id as string,
      name: item.name as string,
      count: item.count !== undefined ? (item.count as number) : null,
    }));
  },

  /**
   * List video templates with filtering, search, and pagination
   */
  async listTemplates(params: TemplateQueryParams = {}): Promise<TemplateListResponse> {
    const searchParams = new URLSearchParams();

    if (params.query?.trim()) searchParams.set('query', params.query.trim());
    if (params.category && params.category !== 'all') searchParams.set('category', params.category);
    if (params.motionType?.trim()) searchParams.set('motion_type', params.motionType.trim());
    if (params.durationRange) searchParams.set('duration_range', params.durationRange);
    if (params.aspectRatio && params.aspectRatio !== 'all') searchParams.set('aspect_ratio', params.aspectRatio);
    if (params.garmentSlot && params.garmentSlot !== 'all') searchParams.set('garment_slot', params.garmentSlot);
    if (params.assessmentStatus && params.assessmentStatus !== 'ALL') {
      searchParams.set('assessment_status', params.assessmentStatus);
    }
    if (params.isFavorite !== undefined && params.isFavorite !== null) {
      searchParams.set('is_favorite', params.isFavorite ? 'true' : 'false');
    }
    if (params.sortBy) searchParams.set('sort_by', params.sortBy);
    if (params.page && params.page > 1) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = `/templates${queryString ? `?${queryString}` : ''}`;
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
   * Get single video template detail by templateId
   */
  async getTemplateDetail(templateId: string): Promise<TemplateDetail> {
    const raw = await apiClient<Record<string, unknown>>(`/templates/${templateId}`);
    return mapDetail(raw);
  },

  /**
   * Toggle template favorite status
   */
  async toggleFavorite(templateId: string): Promise<ToggleFavoriteResult> {
    const raw = await apiClient<Record<string, unknown>>(`/templates/${templateId}/favorite`, {
      method: 'POST',
    });
    return {
      templateId: (raw.template_id ?? raw.templateId) as string,
      isFavorite: Boolean(raw.is_favorite ?? raw.isFavorite),
      message: (raw.message ?? '') as string,
    };
  },

  /**
   * Get direct stream URL for HTML5 video player from Local Filesystem Backend
   */
  getVideoStreamUrl(templateId: string): string {
    const base = config.apiUrl.replace(/\/+$/, '');
    return `${base}/templates/${templateId}/stream`;
  },

  /**
   * Format display duration helper (milliseconds -> mm:ss or s)
   */
  formatDuration(durationMs: number): string {
    if (!durationMs || durationMs <= 0) return '0:00';
    const totalSeconds = Math.round(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  },

  /**
   * Format garment slot label to Vietnamese
   */
  formatSlotName(slotType: string): string {
    switch (slotType) {
      case 'upper_body':
        return 'Áo thân trên';
      case 'lower_body':
        return 'Quần / chân váy';
      case 'dress_full_body':
        return 'Váy liền thân';
      case 'outerwear':
        return 'Áo khoác ngoài';
      default:
        return slotType;
    }
  },
};
