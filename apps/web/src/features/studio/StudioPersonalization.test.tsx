import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StudioStepper } from './components/StudioStepper';
import { ModelSelectStep } from './components/ModelSelectStep';
import { TemplateSelectStep } from './components/TemplateSelectStep';
import { CompatibilityStep } from './components/CompatibilityStep';
import { GenerationProgressStep } from './components/GenerationProgressStep';
import { GenerationResultStep } from './components/GenerationResultStep';
import { studioService } from './services/studio.service';
import {
  mockCompatibilitySupportedFixture,
  mockCompatibilityLimitedFixture,
  mockCompatibilityUnsupportedFixture,
  mockCompletedGenerationFixture,
} from './fixtures/studio.fixture';
import { ModelProfileSummary } from '@/features/models';
import { TemplateSummary, TemplateCategory } from '@/features/library';

const mockModel: ModelProfileSummary = {
  modelId: 'mod-linh-001',
  modelCode: 'MOD-LINH',
  displayName: 'Phương Linh AI Lookbook',
  description: 'Người mẫu phong cách thời trang trẻ trung',
  coverAssetId: 'ast-cover-1',
  coverImageUrl: 'http://localhost/cover.jpg',
  status: 'READY',
  modelVersion: 1,
  referenceAssetsCount: 8,
  usedInProjectsCount: 2,
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-05T00:00:00Z',
};

const mockTemplate: TemplateSummary = {
  templateId: 'vtp-streetwear-001',
  templateCode: 'STREET-001',
  title: 'Năng động dạo phố hè',
  description: 'Video thời trang dạo phố',
  categoryId: 'cat-streetwear',
  categoryName: 'Streetwear',
  tags: ['streetwear', 'summer'],
  posterUrl: 'http://localhost/poster.jpg',
  previewUrl: 'http://localhost/preview.mp4',
  durationMs: 14200,
  width: 1080,
  height: 1920,
  aspectRatio: '9:16',
  status: 'PUBLISHED',
  isFavorite: false,
  usageCount: 15,
  garmentSlotsSummary: ['Áo thân trên', 'Quần / chân váy'],
  publishedAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-05T00:00:00Z',
};

const mockCategories: TemplateCategory[] = [
  { id: 'cat-streetwear', name: 'Streetwear', count: 5 },
  { id: 'cat-lookbook', name: 'Lookbook', count: 3 },
];

describe('Studio Service Helpers', () => {
  it('formats duration in milliseconds to mm:ss', () => {
    expect(studioService.formatDuration(0)).toBe('0:00');
    expect(studioService.formatDuration(5000)).toBe('0:05');
    expect(studioService.formatDuration(14200)).toBe('0:14');
    expect(studioService.formatDuration(75000)).toBe('1:15');
  });

  it('provides correct badge configs for compatibility statuses', () => {
    const supported = studioService.getCompatibilityBadgeConfig('SUPPORTED');
    expect(supported.label).toBe('Tương thích hoàn toàn');
    expect(supported.bgClass).toContain('emerald');

    const limited = studioService.getCompatibilityBadgeConfig('LIMITED');
    expect(limited.label).toBe('Tương thích có giới hạn');
    expect(limited.bgClass).toContain('amber');

    const unsupported = studioService.getCompatibilityBadgeConfig('UNSUPPORTED');
    expect(unsupported.label).toBe('Không tương thích');
    expect(unsupported.bgClass).toContain('rose');
  });

  it('provides correct labels for generation statuses', () => {
    expect(studioService.getGenerationStatusConfig('VALIDATING').label).toBe('Đang kiểm tra dữ liệu');
    expect(studioService.getGenerationStatusConfig('PROCESSING').label).toBe('Đang xử lý video');
    expect(studioService.getGenerationStatusConfig('QUALITY_REVIEW').label).toBe('Đang kiểm tra chất lượng');
    expect(studioService.getGenerationStatusConfig('COMPLETED').label).toBe('Hoàn tất');
    expect(studioService.getGenerationStatusConfig('FAILED').label).toBe('Thất bại');
  });
});

describe('Studio Stepper Component', () => {
  it('renders all 5 steps of the personalization flow', () => {
    render(
      <StudioStepper
        currentStep="model"
        canNavigateToStep={() => true}
      />
    );

    expect(screen.getByText('1. Chọn người mẫu')).toBeInTheDocument();
    expect(screen.getByText('2. Chọn video mẫu')).toBeInTheDocument();
    expect(screen.getByText('3. Kiểm tra tương thích')).toBeInTheDocument();
    expect(screen.getByText('4. Xử lý video')).toBeInTheDocument();
    expect(screen.getByText('5. Kết quả & Kiểm định')).toBeInTheDocument();
  });

  it('calls onStepClick when an allowed step is clicked', () => {
    const handleStepClick = vi.fn();
    render(
      <StudioStepper
        currentStep="template"
        onStepClick={handleStepClick}
        canNavigateToStep={() => true}
      />
    );

    fireEvent.click(screen.getByText('1. Chọn người mẫu'));
    expect(handleStepClick).toHaveBeenCalledWith('model');
  });
});

describe('Model Select Step', () => {
  it('renders empty state with navigation CTA when no models exist', () => {
    render(
      <MemoryRouter>
        <ModelSelectStep
          models={[]}
          selectedModel={null}
          onSelectModel={vi.fn()}
          onNext={vi.fn()}
          isLoading={false}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Chưa có hồ sơ người mẫu nào')).toBeInTheDocument();
    expect(screen.getByText('Đến Quản lý người mẫu')).toBeInTheDocument();
  });

  it('renders model card and allows selecting', () => {
    const handleSelect = vi.fn();
    render(
      <MemoryRouter>
        <ModelSelectStep
          models={[mockModel]}
          selectedModel={null}
          onSelectModel={handleSelect}
          onNext={vi.fn()}
          isLoading={false}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Phương Linh AI Lookbook')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
    expect(screen.getByText(/8 ảnh/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Phương Linh AI Lookbook'));
    expect(handleSelect).toHaveBeenCalledWith(mockModel);
  });
});

describe('Template Select Step', () => {
  it('renders template list and category pills', () => {
    const handleSelect = vi.fn();
    render(
      <TemplateSelectStep
        templates={[mockTemplate]}
        categories={mockCategories}
        selectedTemplate={null}
        onSelectTemplate={handleSelect}
        onBack={vi.fn()}
        onNext={vi.fn()}
        isLoading={false}
      />
    );

    expect(screen.getByText('Năng động dạo phố hè')).toBeInTheDocument();
    expect(screen.getByText('Tất cả danh mục')).toBeInTheDocument();
    expect(screen.getAllByText('Streetwear')[0]).toBeInTheDocument();

    fireEvent.click(screen.getByText('Năng động dạo phố hè'));
    expect(handleSelect).toHaveBeenCalledWith(mockTemplate);
  });
});

describe('Compatibility Step', () => {
  it('renders SUPPORTED status and enables generation button', () => {
    const handleStart = vi.fn();
    render(
      <CompatibilityStep
        model={mockModel}
        template={mockTemplate}
        compatibility={mockCompatibilitySupportedFixture}
        isLoading={false}
        onRetryCheck={vi.fn()}
        onChangeModel={vi.fn()}
        onChangeTemplate={vi.fn()}
        onBack={vi.fn()}
        onStartGeneration={handleStart}
        isCreating={false}
      />
    );

    expect(screen.getAllByText('Tương thích hoàn toàn')[0]).toBeInTheDocument();
    const startButton = screen.getByRole('button', { name: /Bắt đầu tạo video cá nhân hóa/i });
    expect(startButton).toBeEnabled();

    fireEvent.click(startButton);
    expect(handleStart).toHaveBeenCalled();
  });

  it('requires checkbox confirmation for LIMITED compatibility before enabling creation', () => {
    const handleStart = vi.fn();
    render(
      <CompatibilityStep
        model={mockModel}
        template={mockTemplate}
        compatibility={mockCompatibilityLimitedFixture}
        isLoading={false}
        onRetryCheck={vi.fn()}
        onChangeModel={vi.fn()}
        onChangeTemplate={vi.fn()}
        onBack={vi.fn()}
        onStartGeneration={handleStart}
        isCreating={false}
      />
    );

    expect(screen.getAllByText('Tương thích có giới hạn')[0]).toBeInTheDocument();
    const startButton = screen.getByRole('button', { name: /Bắt đầu tạo video cá nhân hóa/i });
    expect(startButton).toBeDisabled();

    // Check the confirmation checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(startButton).toBeEnabled();

    fireEvent.click(startButton);
    expect(handleStart).toHaveBeenCalled();
  });

  it('disables creation and shows blocking reasons for UNSUPPORTED combination', () => {
    render(
      <CompatibilityStep
        model={mockModel}
        template={mockTemplate}
        compatibility={mockCompatibilityUnsupportedFixture}
        isLoading={false}
        onRetryCheck={vi.fn()}
        onChangeModel={vi.fn()}
        onChangeTemplate={vi.fn()}
        onBack={vi.fn()}
        onStartGeneration={vi.fn()}
        isCreating={false}
      />
    );

    expect(screen.getAllByText('Không tương thích')[0]).toBeInTheDocument();
    expect(
      screen.getByText('Hồ sơ người mẫu thiếu ảnh góc nghiêng cần thiết cho video mẫu này.')
    ).toBeInTheDocument();

    const startButton = screen.getByRole('button', { name: /Bắt đầu tạo video cá nhân hóa/i });
    expect(startButton).toBeDisabled();
  });
});

describe('Generation Progress Step', () => {
  it('displays real progress percentage and current step phase', () => {
    const inProgressGen = {
      ...mockCompletedGenerationFixture,
      status: 'PROCESSING' as const,
      currentStep: 'Đang tổng hợp video bằng FFmpeg',
      progress: 65,
    };

    render(
      <GenerationProgressStep
        generation={inProgressGen}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
        onViewResult={vi.fn()}
        isCancelling={false}
        isRetrying={false}
      />
    );

    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('Đang tổng hợp video bằng FFmpeg')).toBeInTheDocument();
    expect(screen.getByText('Hủy tiến trình')).toBeInTheDocument();
  });

  it('displays error message and Retry button when status is FAILED', () => {
    const handleRetry = vi.fn();
    const failedGen = {
      ...mockCompletedGenerationFixture,
      status: 'FAILED' as const,
      currentStep: 'Thất bại khi xử lý video',
      errorMessage: 'FFmpeg filter synthesis error: input file corrupted',
      errorCode: 'SYNTHESIS_FAILED',
      progress: 40,
    };

    render(
      <GenerationProgressStep
        generation={failedGen}
        onCancel={vi.fn()}
        onRetry={handleRetry}
        onViewResult={vi.fn()}
        isCancelling={false}
        isRetrying={false}
      />
    );

    expect(screen.getByText('Quá trình tổng hợp gặp sự cố')).toBeInTheDocument();
    expect(
      screen.getByText('FFmpeg filter synthesis error: input file corrupted')
    ).toBeInTheDocument();

    const retryButton = screen.getByText('Thử lại bước này');
    fireEvent.click(retryButton);
    expect(handleRetry).toHaveBeenCalled();
  });
});

describe('Generation Result Step & Quality Review', () => {
  it('renders video specifications and Quality Review report', () => {
    render(
      <GenerationResultStep
        generation={mockCompletedGenerationFixture}
        onCreateNewVersion={vi.fn()}
        onOpenProjects={vi.fn()}
      />
    );

    expect(screen.getByText('Personalized Base Video đã sẵn sàng')).toBeInTheDocument();
    expect(screen.getByText('1080 × 1920')).toBeInTheDocument();
    expect(screen.getByText('0:14')).toBeInTheDocument();
    expect(screen.getByText('h264 / aac')).toBeInTheDocument();
    expect(screen.getByText('ĐẠT TIÊU CHUẨN')).toBeInTheDocument();
    expect(screen.getByText('Độ sắc nét khuôn mặt')).toBeInTheDocument();
    expect(screen.getByText('Ranh giới trang phục gốc')).toBeInTheDocument();
  });
});
