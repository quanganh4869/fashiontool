import { apiClient } from './client';
import {
  TimeRange,
  OverviewSummary,
  RecentProject,
  ActiveJob,
  CompletedVideo,
  SavedProduct,
} from '@/types/overview';

export const overviewService = {
  /**
   * Fetches the summary metrics for a given time range.
   */
  async getSummary(range: TimeRange = '7d'): Promise<OverviewSummary> {
    const raw = await apiClient<Record<string, unknown>>(`/overview/summary?range=${range}`);
    return {
      savedProductsCount: (raw.saved_products_count ?? raw.savedProductsCount ?? null) as number | null,
      analyzedChannelsCount: (raw.analyzed_channels_count ?? raw.analyzedChannelsCount ?? null) as number | null,
      generatedImagesCount: (raw.generated_images_count ?? raw.generatedImagesCount ?? null) as number | null,
      generatedVideosCount: (raw.generated_videos_count ?? raw.generatedVideosCount ?? null) as number | null,
    };
  },

  /**
   * Fetches recent projects (up to limit).
   */
  async getRecentProjects(limit = 5): Promise<RecentProject[]> {
    const rawList = await apiClient<Array<Record<string, unknown>>>(
      `/overview/recent-projects?limit=${limit}`
    );
    return rawList.map((item) => ({
      projectId: (item.project_id ?? item.projectId) as string,
      projectName: (item.project_name ?? item.projectName) as string,
      productId: (item.product_id ?? item.productId ?? null) as string | null,
      productName: (item.product_name ?? item.productName ?? null) as string | null,
      thumbnailUrl: (item.thumbnail_url ?? item.thumbnailUrl ?? null) as string | null,
      currentStep: (item.current_step ?? item.currentStep) as RecentProject['currentStep'],
      projectStatus: (item.project_status ?? item.projectStatus) as RecentProject['projectStatus'],
      updatedAt: (item.updated_at ?? item.updatedAt) as string,
    }));
  },

  /**
   * Fetches currently active background jobs.
   */
  async getActiveJobs(): Promise<ActiveJob[]> {
    const rawList = await apiClient<Array<Record<string, unknown>>>(
      `/overview/active-jobs`
    );
    return rawList.map((item) => ({
      jobId: (item.job_id ?? item.jobId) as string,
      projectId: (item.project_id ?? item.projectId ?? null) as string | null,
      jobType: (item.job_type ?? item.jobType) as ActiveJob['jobType'],
      displayName: (item.display_name ?? item.displayName) as string,
      relatedResourceName: (item.related_resource_name ?? item.relatedResourceName ?? null) as string | null,
      jobStatus: (item.job_status ?? item.jobStatus) as ActiveJob['jobStatus'],
      progress: (item.progress ?? null) as number | null,
      startedAt: (item.started_at ?? item.startedAt) as string,
      updatedAt: (item.updated_at ?? item.updatedAt) as string,
    }));
  },

  /**
   * Fetches recently completed videos (up to limit).
   */
  async getCompletedVideos(limit = 3): Promise<CompletedVideo[]> {
    const rawList = await apiClient<Array<Record<string, unknown>>>(
      `/overview/completed-videos?limit=${limit}`
    );
    return rawList.map((item) => ({
      videoId: (item.video_id ?? item.videoId) as string,
      projectId: (item.project_id ?? item.projectId) as string,
      title: item.title as string,
      productName: (item.product_name ?? item.productName ?? null) as string | null,
      thumbnailUrl: (item.thumbnail_url ?? item.thumbnailUrl ?? null) as string | null,
      videoUrl: (item.video_url ?? item.videoUrl) as string,
      durationSeconds: (item.duration_seconds ?? item.durationSeconds ?? null) as number | null,
      resolution: (item.resolution ?? null) as string | null,
      completedAt: (item.completed_at ?? item.completedAt) as string,
      status: (item.status ?? 'ready') as 'ready' | 'archived',
    }));
  },

  /**
   * Fetches recently saved products (up to limit).
   */
  async getSavedProducts(limit = 4): Promise<SavedProduct[]> {
    const rawList = await apiClient<Array<Record<string, unknown>>>(
      `/overview/saved-products?limit=${limit}`
    );
    return rawList.map((item) => ({
      productId: (item.product_id ?? item.productId) as string,
      productName: (item.product_name ?? item.productName) as string,
      shopName: (item.shop_name ?? item.shopName ?? null) as string | null,
      imageUrl: (item.image_url ?? item.imageUrl ?? null) as string | null,
      price: (item.price ?? null) as number | null,
      currency: (item.currency ?? 'VND') as string,
      savedAt: (item.saved_at ?? item.savedAt) as string,
    }));
  },
};
