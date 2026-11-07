import {
  CompatibilityCheckResponse,
  ModelTemplateGeneration,
  ProjectDetail,
  ProjectSummary,
} from '../types/studio.types';

export const mockCompatibilitySupportedFixture: CompatibilityCheckResponse = {
  status: 'SUPPORTED',
  canGenerate: true,
  modelId: 'mod-linh-001',
  modelName: 'Phương Linh AI Lookbook',
  modelVersion: 1,
  templateId: 'vtp-streetwear-001',
  templateTitle: 'Năng động dạo phố hè',
  templateCode: 'STREET-001',
  templateVersionId: 'v1.0.0',
  checks: [
    {
      key: 'aspect_ratio',
      name: 'Tỉ lệ khung hình video',
      status: 'SUPPORTED',
      message: 'Khung hình chuẩn 9:16 tương thích với ảnh chân dung của người mẫu.',
    },
    {
      key: 'face_visibility',
      name: 'Khả năng nhận diện khuôn mặt',
      status: 'SUPPORTED',
      message: 'Video mẫu có góc quay chính diện, đủ điều kiện ghép khuôn mặt.',
    },
    {
      key: 'subject_framing',
      name: 'Bố cục toàn thân',
      status: 'SUPPORTED',
      message: 'Bố cục toàn thân tương thích tốt với hồ sơ người mẫu.',
    },
    {
      key: 'occlusion',
      name: 'Mức độ che khuất',
      status: 'SUPPORTED',
      message: 'Độ che khuất thấp, chuyển động rõ ràng.',
    },
  ],
  warnings: [],
  blockingReasons: [],
};

export const mockCompatibilityLimitedFixture: CompatibilityCheckResponse = {
  status: 'LIMITED',
  canGenerate: true,
  modelId: 'mod-linh-001',
  modelName: 'Phương Linh AI Lookbook',
  modelVersion: 1,
  templateId: 'vtp-cinematic-002',
  templateTitle: 'Điện ảnh đường phố đêm',
  templateCode: 'CINE-002',
  templateVersionId: 'v1.0.0',
  checks: [
    {
      key: 'aspect_ratio',
      name: 'Tỉ lệ khung hình video',
      status: 'SUPPORTED',
      message: 'Khung hình 9:16 phù hợp.',
    },
    {
      key: 'occlusion',
      name: 'Mức độ che khuất ánh sáng',
      status: 'LIMITED',
      message: 'Ánh sáng đêm mờ có thể làm giảm độ sắc nét của một số chi tiết viền.',
    },
  ],
  warnings: ['Ánh sáng đêm mờ có thể làm giảm độ sắc nét của một số chi tiết viền.'],
  blockingReasons: [],
};

export const mockCompatibilityUnsupportedFixture: CompatibilityCheckResponse = {
  status: 'UNSUPPORTED',
  canGenerate: false,
  modelId: 'mod-incomplete-003',
  modelName: 'Hồ sơ chưa đủ ảnh',
  modelVersion: 1,
  templateId: 'vtp-fastcut-003',
  templateTitle: 'Chuyển cảnh tốc độ cao',
  templateCode: 'FAST-003',
  templateVersionId: 'v1.0.0',
  checks: [
    {
      key: 'face_visibility',
      name: 'Khả năng nhận diện khuôn mặt',
      status: 'UNSUPPORTED',
      message: 'Video chuyển động xoay lưng 360 độ, yêu cầu ảnh góc nghiêng và góc sau mà hồ sơ người mẫu chưa có.',
    },
  ],
  warnings: [],
  blockingReasons: [
    'Hồ sơ người mẫu thiếu ảnh góc nghiêng cần thiết cho video mẫu này.',
  ],
};

export const mockCompletedGenerationFixture: ModelTemplateGeneration = {
  generationId: 'gen-demo-001',
  userId: 'default_user',
  projectId: 'proj-demo-100',
  projectName: 'Bộ sưu tập Hè 2026 - Phương Linh',
  modelId: 'mod-linh-001',
  modelName: 'Phương Linh AI Lookbook',
  modelVersion: 1,
  modelCoverUrl: '/api/v1/assets/model-linh-cover.jpg',
  templateId: 'vtp-streetwear-001',
  templateTitle: 'Năng động dạo phố hè',
  templateCode: 'STREET-001',
  templateVersionId: 'v1.0.0',
  templatePosterUrl: '/api/v1/assets/template-streetwear-poster.jpg',
  status: 'COMPLETED',
  currentStep: 'Hoàn tất xử lý video nền',
  progress: 100,
  createdAt: '2026-11-07T22:30:00Z',
  startedAt: '2026-11-07T22:30:02Z',
  completedAt: '2026-11-07T22:30:15Z',
  outputVideoAssetId: 'ast-personalized-001',
  outputVideoUrl: '/api/v1/assets/ast-personalized-001/stream',
  outputThumbnailUrl: '/api/v1/assets/ast-personalized-thumb-001.jpg',
  durationMs: 14200,
  width: 1080,
  height: 1920,
  fps: 30,
  codec: 'h264 / aac',
  qualityReview: {
    overallStatus: 'PASS',
    criteria: [
      {
        key: 'face_clarity',
        name: 'Độ sắc nét khuôn mặt',
        status: 'PASS',
        description: 'Khuôn mặt người mẫu giữ được đặc trưng nhận diện và độ phân giải cao.',
        notes: 'SSIM > 0.92 trên các khung hình chính diện.',
      },
      {
        key: 'garment_boundary',
        name: 'Ranh giới trang phục gốc',
        status: 'PASS',
        description: 'Vùng trang phục giữ nguyên ranh giới chuẩn bị cho bước thay thế sản phẩm.',
      },
      {
        key: 'motion_continuity',
        name: 'Tính liền mạch chuyển động',
        status: 'PASS',
        description: 'Không phát hiện hiện tượng giật cục hay bóng mờ bất thường.',
        notes: 'Tốc độ khung hình ổn định 30.0 fps.',
      },
      {
        key: 'compression_artifacts',
        name: 'Kiểm soát nén và giải mã',
        status: 'PASS',
        description: 'Mã hóa H.264 tiêu chuẩn, tương thích với mọi trình phát web.',
      },
    ],
    assessedAt: '2026-11-07T22:30:14Z',
    inspector: 'TrendMotion Automated Quality Review v1.0',
  },
  retryCount: 0,
};

export const mockProjectSummaryFixture: ProjectSummary = {
  projectId: 'proj-demo-100',
  name: 'Bộ sưu tập Hè 2026 - Phương Linh',
  description: 'Dự án tạo video nền thời trang đường phố cùng Phương Linh.',
  modelId: 'mod-linh-001',
  modelName: 'Phương Linh AI Lookbook',
  templateId: 'vtp-streetwear-001',
  templateTitle: 'Năng động dạo phố hè',
  currentGenerationId: 'gen-demo-001',
  currentGenerationStatus: 'COMPLETED',
  outputVideoUrl: '/api/v1/assets/ast-personalized-001/stream',
  totalGenerations: 1,
  createdAt: '2026-11-07T22:30:00Z',
  updatedAt: '2026-11-07T22:30:15Z',
};

export const mockProjectDetailFixture: ProjectDetail = {
  ...mockProjectSummaryFixture,
  generations: [mockCompletedGenerationFixture],
};
