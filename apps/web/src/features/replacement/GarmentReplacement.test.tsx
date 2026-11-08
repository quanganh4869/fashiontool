import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { replacementService } from './services/replacement.service';
import { ReplacementPreflightModal } from './components/ReplacementPreflightModal';
import { ReplacementProgressStep } from './components/ReplacementProgressStep';
import { FinalProductVideoReview } from './components/FinalProductVideoReview';
import { StudioStepper } from '@/features/studio/components/StudioStepper';
import { mockCompletedGenerationFixture } from '@/features/studio/fixtures/studio.fixture';
import {
  ReplacementJobResponse,
  ReplacementPreflightResponse,
} from './types/replacement.types';
import { ProductAssetSummaryResponse } from '@/features/products/types/product.types';

const mockProductSummary: ProductAssetSummaryResponse = {
  product_id: 'prod_test_001',
  project_id: 'proj_test_001',
  user_id: 'user_001',
  source_url: 'https://example.com/products/white-oxford-shirt',
  source_domain: 'example.com',
  title: 'Classic White Oxford Long Sleeve Shirt',
  custom_title: 'Áo sơ mi trắng Oxford 6 cúc',
  brand: 'TrendMotion Classic',
  price: 650000,
  currency: 'VND',
  primary_image_url: '/api/v1/assets/media/prod_test_001/primary.jpg',
  total_images_count: 5,
  created_at: '2026-11-08T10:00:00Z',
  updated_at: '2026-11-08T10:05:00Z',
};

const mockPreflightResponse: ReplacementPreflightResponse = {
  can_replace: true,
  category_compatibility: 'SUPPORTED',
  target_garment_slot: 'upper_body',
  detected_base_garment: 'black_dress_shirt',
  truth_sheet: {
    truth_sheet_id: 'ts_001',
    product_id: 'prod_test_001',
    version: 1,
    category: 'shirt',
    silhouette: 'regular_fit',
    primary_color: '#FFFFFF',
    pattern: 'solid',
    collar_type: 'pointed',
    sleeve_type: 'long_sleeve',
    button_count: 6,
    button_placement: 'center_front_placket',
    button_color: 'pearly_white',
    has_left_pocket: true,
    pocket_placement: 'left_chest',
    pocket_type: 'patch_pocket',
    fabric_type: 'cotton_oxford',
    cuff_buttons: 2,
    status: 'VERIFIED',
    verified_image_ids: ['img_01', 'img_02'],
  },
  blocking_reasons: [],
  warnings: ['Base video có đoạn xoay 45 độ, engine sẽ neo giữ vị trí 6 cúc theo khối ngực.'],
};

const mockRunningJob: ReplacementJobResponse = {
  job_id: 'rep_job_running_001',
  project_id: 'proj_test_001',
  user_id: 'user_001',
  base_video_asset_id: 'gen_001',
  product_asset_id: 'prod_test_001',
  product_title: 'Áo sơ mi trắng Oxford 6 cúc',
  model_name: 'Minh Anh',
  status: 'GENERATING_FRAMES',
  current_step: 'Đang tổng hợp sắc trắng và họa tiết vải trên frame (65/150)',
  progress: 65,
  created_at: '2026-11-08T11:00:00Z',
  user_decision: 'PENDING_REVIEW',
};

const mockCompletedJob: ReplacementJobResponse = {
  job_id: 'rep_job_completed_001',
  project_id: 'proj_test_001',
  user_id: 'user_001',
  base_video_asset_id: 'gen_001',
  product_asset_id: 'prod_test_001',
  product_title: 'Áo sơ mi trắng Oxford 6 cúc',
  model_name: 'Minh Anh',
  status: 'COMPLETED',
  current_step: 'Hoàn tất quy trình kiểm định chất lượng 10 tiêu chí',
  progress: 100,
  created_at: '2026-11-08T11:00:00Z',
  completed_at: '2026-11-08T11:03:45Z',
  output_video_asset_id: 'asset_rep_video_001',
  output_video_url: '/api/v1/assets/media/rep_job_completed_001/final_product_video.mp4',
  output_thumbnail_url: '/api/v1/assets/media/rep_job_completed_001/thumbnail.jpg',
  output_contact_sheet_url: '/api/v1/assets/media/rep_job_completed_001/contact_sheet.jpg',
  output_side_by_side_url: '/api/v1/assets/media/rep_job_completed_001/comparison_side_by_side.mp4',
  output_video_sha256: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  duration_ms: 5000,
  width: 1080,
  height: 1920,
  fps: 30,
  codec: 'h264',
  file_size_bytes: 3840000,
  quality_review: {
    overall_status: 'PASS',
    inspector: 'LocalEngineQualityGate',
    assessed_at: '2026-11-08T11:03:40Z',
    criteria: [
      {
        key: 'garment_identity_fidelity',
        name: 'Bảo toàn nhận diện trang phục',
        status: 'PASS',
        description: 'Màu trắng chuẩn, vải Oxford không bị biến đổi.',
      },
      {
        key: 'button_count_invariance',
        name: 'Số lượng 6 cúc áo bất biến',
        status: 'PASS',
        description: 'Đúng 6 cúc hiện diện ổn định qua toàn bộ 150 frames.',
      },
      {
        key: 'pocket_presence_stability',
        name: 'Túi ngực bên trái ổn định',
        status: 'PASS',
        description: 'Túi ngực trái bám sát cử động thân trên.',
      },
      {
        key: 'collar_structure_preservation',
        name: 'Cấu trúc cổ nhọn đối xứng',
        status: 'PASS',
        description: 'Dáng ve cổ nhọn sắc nét tự nhiên.',
      },
      {
        key: 'human_identity_preservation',
        name: 'Bảo toàn diện mạo người mẫu',
        status: 'PASS',
        description: 'Khuôn mặt, ánh mắt và biểu cảm nguyên vẹn 100%.',
      },
      {
        key: 'occlusion_boundary_cleanliness',
        name: 'Xử lý che khuất bàn tay & tóc',
        status: 'PASS',
        description: 'Bàn tay vắt qua ngực xếp lớp phía trên áo.',
      },
      {
        key: 'temporal_consistency',
        name: 'Khử nhấp nháy chuyển động liên tục',
        status: 'PASS',
        description: 'Áp dụng bộ lọc thời gian EMA mượt mà.',
      },
      {
        key: 'skin_tone_isolation',
        name: 'Cách ly màu da cổ & tay',
        status: 'PASS',
        description: 'Phân đoạn YCrCb không lẹm vào da người mẫu.',
      },
      {
        key: 'background_preservation',
        name: 'Bảo toàn hậu cảnh video gốc',
        status: 'PASS',
        description: 'Hậu cảnh không bị can thiệp.',
      },
      {
        key: 'audio_stream_sync',
        name: 'Đồng bộ luồng âm thanh gốc',
        status: 'PASS',
        description: 'Âm thanh AAC giữ nguyên trọn vẹn.',
      },
    ],
  },
  user_decision: 'PENDING_REVIEW',
};

describe('Replacement Service Helpers', () => {
  it('resolves relative media URLs', () => {
    const url = replacementService.resolveMediaUrl('/api/v1/assets/media/test.mp4');
    expect(url).toContain('/api/v1/assets/media/test.mp4');
  });

  it('handles null and absolute URLs cleanly', () => {
    expect(replacementService.resolveMediaUrl(null)).toBe('');
    expect(
      replacementService.resolveMediaUrl('https://storage.googleapis.com/test.mp4')
    ).toBe('https://storage.googleapis.com/test.mp4');
  });
});

describe('ReplacementPreflightModal Component', () => {
  it('renders preflight check with 6 buttons and left pocket requirements', () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <ReplacementPreflightModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        generation={mockCompletedGenerationFixture}
        product={mockProductSummary}
        preflight={mockPreflightResponse}
        isLoading={false}
        isStarting={false}
      />
    );

    expect(screen.getByText(/Kiểm tra tương thích trước khi thay trang phục/i)).toBeInTheDocument();
    expect(screen.getByText(/6 cúc tròn/i)).toBeInTheDocument();
    expect(screen.getByText(/1 túi ngực trái/i)).toBeInTheDocument();
    expect(screen.getByText(/Cổ nhọn/i)).toBeInTheDocument();

    // Check warning and checkbox
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    const startBtn = screen.getByRole('button', { name: /Bắt đầu thay trang phục/i });
    expect(startBtn).toBeDisabled();

    // Check the box
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(startBtn).not.toBeDisabled();

    // Click confirm
    fireEvent.click(startBtn);
    expect(handleConfirm).toHaveBeenCalledWith(true);
  });
});

describe('ReplacementProgressStep Component', () => {
  it('displays real-time percentage progress and pipeline stages', () => {
    render(<ReplacementProgressStep job={mockRunningJob} />);

    expect(screen.getByText(/Backend Local AI Processing Engine/i)).toBeInTheDocument();
    expect(screen.getByText(/65%/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Đang tổng hợp sắc trắng và họa tiết vải trên frame \(65\/150\)/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/4\. Thay trang phục & Xử lý che khuất/i)).toBeInTheDocument();
  });
});

describe('FinalProductVideoReview Component', () => {
  it('renders review screen with tabs, 10 criteria PASS badges and decision actions', () => {
    const handleDecision = vi.fn();

    render(
      <FinalProductVideoReview
        job={mockCompletedJob}
        onDecisionSubmitted={handleDecision}
      />
    );

    // Header info
    expect(
      screen.getByText(/Video thành phẩm thay trang phục — Áo sơ mi trắng Oxford 6 cúc/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/10\/10 ĐẠT/i)).toBeInTheDocument();

    // Tabs
    expect(screen.getByRole('button', { name: /Video thành phẩm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /So sánh Song song/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Contact Sheet \(8 Frame\)/i })).toBeInTheDocument();

    // 6 buttons invariance guarantee (appears in truth card and quality review)
    expect(screen.getAllByText(/Số lượng 6 cúc áo bất biến/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Cổ nhọn & Túi ngực bên trái/i)).toBeInTheDocument();

    // Action buttons
    expect(screen.getByRole('button', { name: /Phê duyệt video này/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Yêu cầu tinh chỉnh lại/i })).toBeInTheDocument();
  });
});

describe('StudioStepper Component with Step 7', () => {
  it('includes Step 7 Thay trang phục in navigation stepper', () => {
    const handleStepClick = vi.fn();
    render(
      <StudioStepper
        currentStep="replacement"
        onStepClick={handleStepClick}
        canNavigateToStep={() => true}
      />
    );

    const step7Btn = screen.getByRole('button', { name: /7\. Thay trang phục/i });
    expect(step7Btn).toBeInTheDocument();
  });
});
