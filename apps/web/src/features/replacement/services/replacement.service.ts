import { apiClient } from '@/services/api/client';
import { config } from '@/app/config/env';
import {
  ReplacementJobResponse,
  ReplacementPreflightResponse,
  UserDecision,
} from '../types/replacement.types';

export const replacementService = {
  /**
   * Evaluates pre-flight compatibility between Base Video and Product Asset/Truth Sheet
   */
  async checkPreflight(
    projectId: string,
    baseVideoAssetId: string,
    productAssetId: string
  ): Promise<ReplacementPreflightResponse> {
    return apiClient<ReplacementPreflightResponse>(
      `/projects/${projectId}/replacements/preflight`,
      {
        method: 'POST',
        body: JSON.stringify({
          base_video_asset_id: baseVideoAssetId,
          product_asset_id: productAssetId,
        }),
      }
    );
  },

  /**
   * Initiates a new local Product Replacement Job
   */
  async createJob(
    projectId: string,
    baseVideoAssetId: string,
    productAssetId: string,
    confirmedLimitations: boolean = false
  ): Promise<ReplacementJobResponse> {
    return apiClient<ReplacementJobResponse>(
      `/projects/${projectId}/replacements`,
      {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          base_video_asset_id: baseVideoAssetId,
          product_asset_id: productAssetId,
          confirmed_limitations: confirmedLimitations,
        }),
      }
    );
  },

  /**
   * Fetches status and progress of a replacement job
   */
  async getJob(projectId: string, jobId: string): Promise<ReplacementJobResponse> {
    return apiClient<ReplacementJobResponse>(
      `/projects/${projectId}/replacements/${jobId}`
    );
  },

  /**
   * Lists all replacement jobs in a project
   */
  async listJobs(projectId: string): Promise<ReplacementJobResponse[]> {
    return apiClient<ReplacementJobResponse[]>(
      `/projects/${projectId}/replacements`
    );
  },

  /**
   * Submits user inspection decision (APPROVED, REJECTED, RETRY_REQUESTED)
   */
  async submitDecision(
    projectId: string,
    jobId: string,
    decision: UserDecision,
    feedbackNotes?: string
  ): Promise<ReplacementJobResponse> {
    return apiClient<ReplacementJobResponse>(
      `/projects/${projectId}/replacements/${jobId}/decision`,
      {
        method: 'POST',
        body: JSON.stringify({
          decision,
          feedback_notes: feedbackNotes,
        }),
      }
    );
  },

  /**
   * Helper to resolve local stream URLs
   */
  resolveMediaUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = config.apiUrl.replace(/\/+$/, '');
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${base}${cleanUrl}`;
  },
};
