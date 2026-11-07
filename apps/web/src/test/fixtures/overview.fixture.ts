import {
  OverviewSummary,
  RecentProject,
  ActiveJob,
  CompletedVideo,
  SavedProduct,
} from '@/types/overview';

/**
 * Isolated development-only preview fixture for visual and QA testing.
 * MUST NEVER be used as a fallback in production API calls.
 */
export const overviewDevFixture: {
  summary7d: OverviewSummary;
  summary30d: OverviewSummary;
  summary90d: OverviewSummary;
  recentProjects: RecentProject[];
  activeJobs: ActiveJob[];
  completedVideos: CompletedVideo[];
  savedProducts: SavedProduct[];
} = {
  summary7d: {
    savedProductsCount: 14,
    analyzedChannelsCount: 3,
    generatedImagesCount: 42,
    generatedVideosCount: 8,
  },
  summary30d: {
    savedProductsCount: 58,
    analyzedChannelsCount: 12,
    generatedImagesCount: 165,
    generatedVideosCount: 34,
  },
  summary90d: {
    savedProductsCount: 184,
    analyzedChannelsCount: 36,
    generatedImagesCount: 490,
    generatedVideosCount: 112,
  },
  recentProjects: [
    {
      projectId: 'proj-891',
      projectName: 'Đầm hoa nhí Vintage mùa hè 2026',
      productId: 'prod-001',
      productName: 'Đầm hoa nhí tay bồng dáng xòe vải voan tơ',
      thumbnailUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=200&auto=format&fit=crop&q=80',
      currentStep: 'video',
      projectStatus: 'completed',
      updatedAt: '2026-11-05T01:10:00Z',
    },
    {
      projectId: 'proj-890',
      projectName: 'Áo blazer oversized phong cách Hàn Quốc',
      productId: 'prod-002',
      productName: 'Áo khoác blazer nữ 2 lớp độn vai dáng suông',
      thumbnailUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200&auto=format&fit=crop&q=80',
      currentStep: 'image',
      projectStatus: 'in_progress',
      updatedAt: '2026-11-04T16:45:00Z',
    },
    {
      projectId: 'proj-889',
      projectName: 'Set đồ tập yoga gym năng động',
      productId: 'prod-003',
      productName: 'Bộ quần áo tập gym nữ co giãn 4 chiều thoáng khí',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&auto=format&fit=crop&q=80',
      currentStep: 'model',
      projectStatus: 'draft',
      updatedAt: '2026-11-03T10:15:00Z',
    },
    {
      projectId: 'proj-888',
      projectName: 'Quần jeans ống rộng cạp cao tôn dáng',
      productId: null,
      productName: null,
      thumbnailUrl: null,
      currentStep: 'product',
      projectStatus: 'draft',
      updatedAt: '2026-11-02T14:20:00Z',
    },
    {
      projectId: 'proj-887',
      projectName: 'Chân váy xếp ly tennis trẻ trung',
      productId: 'prod-004',
      productName: 'Chân váy chữ A ngắn có quần bảo hộ',
      thumbnailUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=200&auto=format&fit=crop&q=80',
      currentStep: 'video',
      projectStatus: 'error',
      updatedAt: '2026-11-01T09:00:00Z',
    },
  ],
  activeJobs: [
    {
      jobId: 'job-v-102',
      projectId: 'proj-890',
      jobType: 'video_generation',
      displayName: 'Tạo video TikTok Shop 9:16',
      relatedResourceName: 'Áo blazer oversized phong cách Hàn Quốc',
      jobStatus: 'processing',
      progress: 68, // Real provider progress
      startedAt: '2026-11-05T01:20:00Z',
      updatedAt: '2026-11-05T01:23:40Z',
    },
    {
      jobId: 'job-i-205',
      projectId: 'proj-889',
      jobType: 'image_generation',
      displayName: 'Thay trang phục người mẫu AI',
      relatedResourceName: 'Set đồ tập yoga gym năng động',
      jobStatus: 'processing',
      progress: null, // Indeterminate progress example
      startedAt: '2026-11-05T01:21:10Z',
      updatedAt: '2026-11-05T01:23:15Z',
    },
    {
      jobId: 'job-c-308',
      projectId: null,
      jobType: 'channel_analysis',
      displayName: 'Phân tích kênh TikTok đối thủ',
      relatedResourceName: '@may_boutique_official',
      jobStatus: 'verifying',
      progress: null, // Indeterminate progress
      startedAt: '2026-11-05T01:18:00Z',
      updatedAt: '2026-11-05T01:22:00Z',
    },
  ],
  completedVideos: [
    {
      videoId: 'vid-001',
      projectId: 'proj-891',
      title: 'Đầm hoa nhí Vintage mùa hè 2026 - Bản Affiliate Viral #1',
      productName: 'Đầm hoa nhí tay bồng dáng xòe vải voan tơ',
      thumbnailUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&auto=format&fit=crop&q=80',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      durationSeconds: 28,
      resolution: '1080x1920',
      completedAt: '2026-11-05T01:05:00Z',
      status: 'ready',
    },
    {
      videoId: 'vid-002',
      projectId: 'proj-885',
      title: 'Áo thun basic unisex 100% cotton - Phiên bản phối nhạc trend',
      productName: 'Áo phông nam nữ cổ tròn form rộng thoáng khí',
      thumbnailUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      durationSeconds: 35,
      resolution: '1080x1920',
      completedAt: '2026-11-04T18:30:00Z',
      status: 'ready',
    },
    {
      videoId: 'vid-003',
      projectId: 'proj-880',
      title: 'Túi kẹp nách nữ da PU cao cấp - Đánh giá chi tiết phụ kiện',
      productName: 'Túi xách nữ đeo vai kẹp nách khóa kim loại',
      thumbnailUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&auto=format&fit=crop&q=80',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      durationSeconds: 22,
      resolution: '1080x1920',
      completedAt: '2026-11-03T12:00:00Z',
      status: 'ready',
    },
  ],
  savedProducts: [
    {
      productId: 'prod-001',
      productName: 'Đầm hoa nhí tay bồng dáng xòe vải voan tơ phong cách Pháp thanh lịch',
      shopName: 'May Fashion Official',
      imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=150&auto=format&fit=crop&q=80',
      price: 289000,
      currency: 'VND',
      savedAt: '2026-11-05T00:50:00Z',
    },
    {
      productId: 'prod-002',
      productName: 'Áo khoác blazer nữ 2 lớp độn vai dáng suông chuẩn form thanh lịch công sở',
      shopName: 'ChicStudio Vietnam',
      imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=150&auto=format&fit=crop&q=80',
      price: 450000,
      currency: 'VND',
      savedAt: '2026-11-04T22:15:00Z',
    },
    {
      productId: 'prod-003',
      productName: 'Bộ quần áo tập gym yoga nữ co giãn 4 chiều dệt liền không đường may',
      shopName: 'ActiveWear Store',
      imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=150&auto=format&fit=crop&q=80',
      price: 320000,
      currency: 'VND',
      savedAt: '2026-11-04T15:30:00Z',
    },
    {
      productId: 'prod-004',
      productName: 'Chân váy chữ A ngắn có quần lót bảo hộ chống lộ chất tuyết mưa dày dặn',
      shopName: 'Zara Local Trend',
      imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=150&auto=format&fit=crop&q=80',
      price: null, // Test case: missing price info
      currency: 'VND',
      savedAt: '2026-11-03T18:00:00Z',
    },
  ],
};
