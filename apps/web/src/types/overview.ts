export type TimeRange = '7d' | '30d' | '90d';

export interface OverviewSummary {
  savedProductsCount: number | null;
  analyzedChannelsCount: number | null;
  generatedImagesCount: number | null;
  generatedVideosCount: number | null;
}

export type ProjectStep = 'initial' | 'product' | 'model' | 'image' | 'video';

export type ProjectStatus = 'draft' | 'in_progress' | 'completed' | 'error';

export interface RecentProject {
  projectId: string;
  projectName: string;
  productId?: string | null;
  productName?: string | null;
  thumbnailUrl?: string | null;
  currentStep: ProjectStep;
  projectStatus: ProjectStatus;
  updatedAt: string;
}

export type JobType = 'video_generation' | 'image_generation' | 'channel_analysis';

export type JobStatus = 'pending' | 'processing' | 'verifying' | 'finishing';

export interface ActiveJob {
  jobId: string;
  projectId?: string | null;
  jobType: JobType;
  displayName: string;
  relatedResourceName?: string | null;
  jobStatus: JobStatus;
  progress?: number | null; // Real provider percentage ONLY (0 - 100), null if indeterminate
  startedAt: string;
  updatedAt: string;
}

export interface CompletedVideo {
  videoId: string;
  projectId: string;
  title: string;
  productName?: string | null;
  thumbnailUrl?: string | null;
  videoUrl: string;
  durationSeconds?: number | null;
  resolution?: string | null;
  completedAt: string;
  status: 'ready' | 'archived';
}

export interface SavedProduct {
  productId: string;
  productName: string;
  shopName?: string | null;
  imageUrl?: string | null;
  price?: number | null; // null if missing, 0 if 0
  currency?: string | null;
  savedAt: string;
}
