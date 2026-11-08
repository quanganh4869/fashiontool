import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { batchService } from './services/batch.service';
import { BatchSelectionWorkspace } from './components/BatchSelectionWorkspace';
import { BatchReviewModal } from './components/BatchReviewModal';
import { BatchDetailDashboard } from './components/BatchDetailDashboard';
import { SynchronizedVideoComparisonModal } from './components/SynchronizedVideoComparisonModal';
import { mockCompletedGenerationFixture } from '@/features/studio/fixtures/studio.fixture';
import {
  BatchDetailResponse,
  BatchPreflightResponse,
  FinalVideoItem,
} from './types/batch.types';
import { ProductAssetSummaryResponse } from '@/features/products/types/product.types';

const mockProductList: ProductAssetSummaryResponse[] = [
  {
    product_id: 'prod_001',
    project_id: 'proj_001',
    user_id: 'user_001',
    source_url: 'https://example.com/p1',
    source_domain: 'zara.com',
    title: 'Áo Sơ Mi Trắng Oxford Nam 6 Cúc',
    custom_title: 'Sơ mi trắng Oxford',
    brand: 'Zara Man',
    price: 650000,
    currency: 'VND',
    primary_image_url: '/api/v1/assets/media/p1.jpg',
    total_images_count: 5,
    created_at: '2026-11-08T10:00:00Z',
    updated_at: '2026-11-08T10:00:00Z',
  },
  {
    product_id: 'prod_002',
    project_id: 'proj_001',
    user_id: 'user_001',
    source_url: 'https://example.com/p2',
    source_domain: 'mango.com',
    title: 'Áo Cardigan Be Len Dệt Kim',
    custom_title: 'Cardigan dệt kim be',
    brand: 'Mango Man',
    price: 890000,
    currency: 'VND',
    primary_image_url: '/api/v1/assets/media/p2.jpg',
    total_images_count: 4,
    created_at: '2026-11-08T10:00:00Z',
    updated_at: '2026-11-08T10:00:00Z',
  },
];

const mockPreflightData: BatchPreflightResponse = {
  can_proceed: true,
  total_requested: 2,
  eligible_count: 1,
  warnings_count: 1,
  blocked_count: 0,
  items: [
    {
      product_id: 'prod_001',
      product_title: 'Sơ mi trắng Oxford',
      status: 'ELIGIBLE',
      category_compatibility: 'SUPPORTED',
      target_garment_slot: 'upper_body',
      truth_sheet: {
        truth_sheet_id: 'ts_01',
        product_id: 'prod_001',
        version: 1,
        category: 'shirt',
        silhouette: 'regular_fit',
        primary_color: '#FFFFFF',
        pattern: 'solid',
        collar_type: 'pointed',
        sleeve_type: 'long_sleeve',
        button_count: 6,
        button_placement: 'placket',
        button_color: '#FFFFFF',
        has_left_pocket: true,
        pocket_placement: 'left_chest',
        pocket_type: 'patch_pocket',
        fabric_type: 'cotton',
        cuff_buttons: 2,
        status: 'APPROVED',
        verified_image_ids: ['img_1'],
      },
      blocking_reasons: [],
      warnings: [],
    },
    {
      product_id: 'prod_002',
      product_title: 'Cardigan dệt kim be',
      status: 'WARNINGS',
      category_compatibility: 'LIMITED',
      target_garment_slot: 'upper_body',
      truth_sheet: {
        truth_sheet_id: 'ts_02',
        product_id: 'prod_002',
        version: 1,
        category: 'cardigan',
        silhouette: 'regular_fit',
        primary_color: '#E8DFD8',
        pattern: 'knit',
        collar_type: 'v_neck',
        sleeve_type: 'long_sleeve',
        button_count: 5,
        button_placement: 'placket',
        button_color: '#8B5A2B',
        has_left_pocket: false,
        pocket_placement: 'none',
        pocket_type: 'none',
        fabric_type: 'wool',
        cuff_buttons: 0,
        status: 'APPROVED',
        verified_image_ids: ['img_2'],
      },
      blocking_reasons: [],
      warnings: ['Cardigan có 5 cúc v-neck, ve cổ sẽ bám theo chuyển động ngực'],
    },
  ],
};

const mockBatchDetail: BatchDetailResponse = {
  batch: {
    batch_id: 'bpg-test-001',
    project_id: 'proj_001',
    user_id: 'user_001',
    name: 'Đợt sản xuất Lookbook Hè 2026',
    base_video_asset_id: 'gen_001',
    base_video_title: 'Base Video - Linh',
    model_name: 'Linh',
    status: 'PROCESSING',
    total_jobs: 2,
    queued_jobs: 1,
    processing_jobs: 1,
    completed_jobs: 0,
    failed_jobs: 0,
    cancelled_jobs: 0,
    progress: 45,
    created_at: '2026-11-08T11:00:00Z',
    started_at: '2026-11-08T11:00:05Z',
    job_ids: ['job_01', 'job_02'],
  },
  jobs: [
    {
      job_id: 'job_01',
      project_id: 'proj_001',
      user_id: 'user_001',
      base_video_asset_id: 'gen_001',
      product_asset_id: 'prod_001',
      product_title: 'Sơ mi trắng Oxford',
      model_name: 'Linh',
      status: 'GENERATING_FRAMES',
      current_step: 'Đang tổng hợp cấu trúc 6 cúc áo trên frames',
      progress: 75,
      created_at: '2026-11-08T11:00:00Z',
      user_decision: 'PENDING_REVIEW',
    },
    {
      job_id: 'job_02',
      project_id: 'proj_001',
      user_id: 'user_001',
      base_video_asset_id: 'gen_001',
      product_asset_id: 'prod_002',
      product_title: 'Cardigan dệt kim be',
      model_name: 'Linh',
      status: 'PENDING',
      current_step: 'Đang xếp hàng chờ xử lý',
      progress: 0,
      created_at: '2026-11-08T11:00:00Z',
      user_decision: 'PENDING_REVIEW',
    },
  ],
};

const mockFinalVideo: FinalVideoItem = {
  video_id: 'job_comp_01',
  project_id: 'proj_001',
  batch_id: 'bpg-test-001',
  product_id: 'prod_001',
  product_title: 'Áo Sơ Mi Trắng Oxford',
  model_name: 'Linh',
  base_video_asset_id: 'gen_001',
  video_asset_id: 'asset_vid_01',
  video_url: '/api/v1/assets/asset_vid_01/stream',
  thumbnail_url: '/api/v1/assets/asset_vid_01/thumbnail',
  contact_sheet_url: '/api/v1/assets/asset_vid_01/contact_sheet.jpg',
  side_by_side_url: '/api/v1/assets/asset_vid_01/comparison_side_by_side.mp4',
  duration_ms: 5000,
  width: 1080,
  height: 1920,
  fps: 30,
  codec: 'h264',
  file_size_bytes: 3840000,
  sha256: 'a1b2c3d4e5f6',
  user_decision: 'PENDING_REVIEW',
  created_at: '2026-11-08T11:03:00Z',
  is_archived: false,
};

describe('Batch Service Helpers', () => {
  it('resolves media URLs and download URLs cleanly', () => {
    const url = batchService.resolveMediaUrl('/api/v1/assets/media/v.mp4');
    expect(url).toContain('/api/v1/assets/media/v.mp4');

    const downloadUrl = batchService.getDownloadUrl('proj_001', 'job_comp_01');
    expect(downloadUrl).toContain('/api/v1/projects/proj_001/final-videos/job_comp_01/download');
  });
});

describe('BatchSelectionWorkspace Component', () => {
  it('displays base video info, product selection checkboxes and preflight button', () => {
    const handlePreflight = vi.fn();
    render(
      <BatchSelectionWorkspace
        generation={mockCompletedGenerationFixture}
        products={mockProductList}
        onStartPreflight={handlePreflight}
      />
    );

    expect(screen.getByText(/Personalized Base Video \(Nguồn chung\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Sơ mi trắng Oxford/i)).toBeInTheDocument();
    expect(screen.getByText(/Cardigan dệt kim be/i)).toBeInTheDocument();

    // Select all button
    const selectAllBtn = screen.getByRole('button', { name: /Chọn tất cả/i });
    fireEvent.click(selectAllBtn);

    expect(screen.getByText(/Đã chọn:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Kiểm tra đợt sản xuất \(2\)/i })).not.toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Kiểm tra đợt sản xuất \(2\)/i }));
    expect(handlePreflight).toHaveBeenCalledWith(['prod_001', 'prod_002']);
  });
});

describe('BatchReviewModal Component', () => {
  it('renders preflight summary cards, warnings confirmation and triggers creation', () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <BatchReviewModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        preflight={mockPreflightData}
      />
    );

    expect(screen.getByText(/Đánh giá trước khi tạo đợt sản xuất hàng loạt/i)).toBeInTheDocument();
    expect(screen.getAllByText(/1 sản phẩm/i).length).toBe(2);
    expect(screen.getByText(/Cardigan có 5 cúc v-neck/i)).toBeInTheDocument();

    const startBtn = screen.getByRole('button', { name: /Tạo 2 video thành phẩm/i });
    expect(startBtn).toBeDisabled(); // Disabled until warnings confirmed

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(startBtn).not.toBeDisabled();

    fireEvent.click(startBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});

describe('BatchDetailDashboard Component', () => {
  it('displays batch overall progress, status and child jobs table', () => {
    const handleRefresh = vi.fn();
    const handleCancel = vi.fn();
    const handleRetry = vi.fn();

    render(
      <BatchDetailDashboard
        batchDetail={mockBatchDetail}
        onRefresh={handleRefresh}
        onCancelBatch={handleCancel}
        onRetryJob={handleRetry}
      />
    );

    expect(screen.getByText(/Đợt sản xuất Lookbook Hè 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/45%/i)).toBeInTheDocument();
    expect(screen.getByText(/ĐANG XỬ LÝ TUẦN TỰ/i)).toBeInTheDocument();
    expect(screen.getByText(/Đang tổng hợp cấu trúc 6 cúc áo trên frames/i)).toBeInTheDocument();
  });
});

describe('SynchronizedVideoComparisonModal Component', () => {
  it('renders dual video player for Base Video and Final Product Video', () => {
    const handleClose = vi.fn();

    render(
      <SynchronizedVideoComparisonModal
        isOpen={true}
        onClose={handleClose}
        video={mockFinalVideo}
        generation={mockCompletedGenerationFixture}
      />
    );

    expect(
      screen.getByText(/So sánh đồng bộ: Base Video vs Video Thành phẩm/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Personalized Base Video \(Nguồn\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Final Product Video \(Áo Sơ Mi Trắng Oxford\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Bảo toàn người mẫu/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Đúng 6 cúc áo/i)).toBeInTheDocument();
  });
});
