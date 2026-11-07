import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TemplateHeader } from './components/TemplateHeader';
import { TemplateSearchToolbar } from './components/TemplateSearchToolbar';
import { TemplateFilterToolbar } from './components/TemplateFilterToolbar';
import { TemplateCard } from './components/TemplateCard';
import { TemplateGrid } from './components/TemplateGrid';
import { TemplatePreviewDialog } from './components/TemplatePreviewDialog';
import { TemplateDetailView } from './components/TemplateDetailView';
import { templateService } from './services/template.service';
import {
  mockCategoriesFixture,
  mockTemplatesFixture,
  mockDetailFixture,
} from './fixtures/templates.fixture';

describe('Template Service Helpers', () => {
  it('formats video duration in milliseconds to mm:ss', () => {
    expect(templateService.formatDuration(0)).toBe('0:00');
    expect(templateService.formatDuration(5000)).toBe('0:05');
    expect(templateService.formatDuration(14200)).toBe('0:14');
    expect(templateService.formatDuration(65000)).toBe('1:05');
  });

  it('translates garment slot types to Vietnamese', () => {
    expect(templateService.formatSlotName('upper_body')).toBe('Áo thân trên');
    expect(templateService.formatSlotName('lower_body')).toBe('Quần / chân váy');
    expect(templateService.formatSlotName('dress_full_body')).toBe('Váy liền thân');
    expect(templateService.formatSlotName('outerwear')).toBe('Áo khoác ngoài');
    expect(templateService.formatSlotName('custom_slot')).toBe('custom_slot');
  });

  it('builds direct local video stream URL', () => {
    const streamUrl = templateService.getVideoStreamUrl('vtp-streetwear-001');
    expect(streamUrl).toContain('/templates/vtp-streetwear-001/stream');
  });
});

describe('Template Header Component', () => {
  it('renders exact title and description as specified in Section 2', () => {
    render(<TemplateHeader />);
    expect(screen.getByText('Video mẫu')).toBeInTheDocument();
    expect(
      screen.getByText('Khám phá các video thời trang mẫu để sử dụng cùng người mẫu của bạn.')
    ).toBeInTheDocument();
  });
});

describe('Template Search Toolbar', () => {
  it('renders search input and triggers changes', () => {
    const handleChange = vi.fn();
    const handleEnter = vi.fn();
    const handleClear = vi.fn();

    render(
      <TemplateSearchToolbar
        value=""
        onChange={handleChange}
        onEnter={handleEnter}
        onClear={handleClear}
      />
    );

    const input = screen.getByPlaceholderText('Tìm tên video, mã mẫu hoặc từ khóa...');
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'streetwear' } });
    expect(handleChange).toHaveBeenCalledWith('streetwear');
  });

  it('calls onEnter on pressing Enter and shows clear button', () => {
    const handleChange = vi.fn();
    const handleEnter = vi.fn();
    const handleClear = vi.fn();

    render(
      <TemplateSearchToolbar
        value="lookbook"
        onChange={handleChange}
        onEnter={handleEnter}
        onClear={handleClear}
      />
    );

    const input = screen.getByPlaceholderText('Tìm tên video, mã mẫu hoặc từ khóa...');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(handleEnter).toHaveBeenCalledWith('lookbook');

    const clearBtn = screen.getByLabelText('Xóa nội dung tìm kiếm');
    expect(clearBtn).toBeInTheDocument();
    fireEvent.click(clearBtn);
    expect(handleClear).toHaveBeenCalled();
  });
});

describe('Template Filter Toolbar', () => {
  it('renders categories with counts and triggers selection', () => {
    const onSelectCat = vi.fn();
    render(
      <TemplateFilterToolbar
        categories={mockCategoriesFixture}
        activeCategory="all"
        onSelectCategory={onSelectCat}
        aspectRatio="all"
        onSelectAspectRatio={vi.fn()}
        garmentSlot="all"
        onSelectGarmentSlot={vi.fn()}
        assessmentStatus="ALL"
        onSelectAssessmentStatus={vi.fn()}
        durationRange=""
        onSelectDurationRange={vi.fn()}
        isFavorite={undefined}
        onToggleFavoriteFilter={vi.fn()}
        sortBy="updated_at_desc"
        onSelectSortBy={vi.fn()}
        hasActiveFilters={false}
        onResetFilters={vi.fn()}
      />
    );

    expect(screen.getByText('Tất cả')).toBeInTheDocument();
    expect(screen.getByText('Fashion Walk')).toBeInTheDocument();
    expect(screen.getByText('Mirror Outfit')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Fashion Walk'));
    expect(onSelectCat).toHaveBeenCalledWith('fashion_walk');
  });

  it('renders active reset filter button when hasActiveFilters is true', () => {
    const onReset = vi.fn();
    render(
      <TemplateFilterToolbar
        categories={mockCategoriesFixture}
        activeCategory="fashion_walk"
        onSelectCategory={vi.fn()}
        aspectRatio="9:16"
        onSelectAspectRatio={vi.fn()}
        garmentSlot="all"
        onSelectGarmentSlot={vi.fn()}
        assessmentStatus="ALL"
        onSelectAssessmentStatus={vi.fn()}
        durationRange=""
        onSelectDurationRange={vi.fn()}
        isFavorite={true}
        onToggleFavoriteFilter={vi.fn()}
        sortBy="updated_at_desc"
        onSelectSortBy={vi.fn()}
        hasActiveFilters={true}
        onResetFilters={onReset}
      />
    );

    const resetBtn = screen.getByText('Xóa bộ lọc');
    expect(resetBtn).toBeInTheDocument();
    fireEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalled();
  });
});

describe('Template Card Component', () => {
  it('renders card with poster, title, category, duration, and aspect ratio', () => {
    const sample = mockTemplatesFixture[0];
    const onPreview = vi.fn();
    const onClick = vi.fn();
    const onToggleFav = vi.fn().mockResolvedValue(true);

    render(
      <TemplateCard
        template={sample}
        onPreview={onPreview}
        onClick={onClick}
        onToggleFavorite={onToggleFav}
      />
    );

    expect(screen.getByText(sample.title)).toBeInTheDocument();
    expect(screen.getByText(sample.categoryName)).toBeInTheDocument();
    expect(screen.getByText(sample.templateCode)).toBeInTheDocument();
    expect(screen.getByText('9:16')).toBeInTheDocument();
    expect(screen.getByText('0:14')).toBeInTheDocument();
  });

  it('clicks card triggers navigation and clicking favorite stops propagation', async () => {
    const sample = mockTemplatesFixture[0];
    const onPreview = vi.fn();
    const onClick = vi.fn();
    const onToggleFav = vi.fn().mockResolvedValue(true);

    render(
      <TemplateCard
        template={sample}
        onPreview={onPreview}
        onClick={onClick}
        onToggleFavorite={onToggleFav}
      />
    );

    // Click favorite button
    const favBtn = screen.getByLabelText('Lưu vào yêu thích');
    fireEvent.click(favBtn);
    expect(onToggleFav).toHaveBeenCalledWith(sample.templateId);
    expect(onClick).not.toHaveBeenCalled();

    // Click card body
    fireEvent.click(screen.getByText(sample.templateCode));
    expect(onClick).toHaveBeenCalledWith(sample);
  });
});

describe('Template Grid Component', () => {
  it('renders skeletons when loading', () => {
    const { container } = render(
      <TemplateGrid
        items={[]}
        total={0}
        page={1}
        totalPages={1}
        isLoading={true}
        error={null}
        hasActiveFilters={false}
        onPreview={vi.fn()}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
        onResetFilters={vi.fn()}
        onPageChange={vi.fn()}
        onRetry={vi.fn()}
      />
    );

    const animatedItems = container.querySelectorAll('.animate-pulse');
    expect(animatedItems.length).toBeGreaterThan(0);
  });

  it('renders empty catalog when no items and no active filters', () => {
    render(
      <TemplateGrid
        items={[]}
        total={0}
        page={1}
        totalPages={1}
        isLoading={false}
        error={null}
        hasActiveFilters={false}
        onPreview={vi.fn()}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
        onResetFilters={vi.fn()}
        onPageChange={vi.fn()}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText('Chưa có video mẫu')).toBeInTheDocument();
  });

  it('renders no search results with reset button when active filters exist', () => {
    const onReset = vi.fn();
    render(
      <TemplateGrid
        items={[]}
        total={0}
        page={1}
        totalPages={1}
        isLoading={false}
        error={null}
        hasActiveFilters={true}
        onPreview={vi.fn()}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
        onResetFilters={onReset}
        onPageChange={vi.fn()}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText('Không tìm thấy video mẫu phù hợp')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Xóa bộ lọc'));
    expect(onReset).toHaveBeenCalled();
  });

  it('renders error state with retry button', () => {
    const onRetry = vi.fn();
    render(
      <TemplateGrid
        items={[]}
        total={0}
        page={1}
        totalPages={1}
        isLoading={false}
        error="Lỗi kết nối máy chủ"
        hasActiveFilters={false}
        onPreview={vi.fn()}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
        onResetFilters={vi.fn()}
        onPageChange={vi.fn()}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Không thể tải thư viện video mẫu')).toBeInTheDocument();
    expect(screen.getByText('Lỗi kết nối máy chủ')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Thử lại'));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('Template Preview Dialog Component', () => {
  it('renders dialog with video player, metadata, and close action', () => {
    const sample = mockTemplatesFixture[0];
    const onClose = vi.fn();
    const onNavDetail = vi.fn();

    render(
      <TemplatePreviewDialog
        template={sample}
        isOpen={true}
        onClose={onClose}
        onNavigateDetail={onNavDetail}
      />
    );

    expect(screen.getByText(sample.title)).toBeInTheDocument();
    expect(screen.getByText(/VTP-000101/)).toBeInTheDocument();
    expect(screen.getByText('Xem chi tiết video mẫu')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Xem chi tiết video mẫu'));
    expect(onClose).toHaveBeenCalled();
    expect(onNavDetail).toHaveBeenCalledWith(sample.templateId);
  });
});

describe('Template Detail View Component', () => {
  it('renders full template breakdown including scenes, garment slots and compatibility', () => {
    const onBack = vi.fn();
    const onToggleFav = vi.fn().mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <TemplateDetailView
          template={mockDetailFixture}
          isFavoriteLoading={false}
          onToggleFavorite={onToggleFav}
          onBack={onBack}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: mockDetailFixture.title })).toBeInTheDocument();
    expect(screen.getByText('Vị trí thay trang phục (Garment Slots)')).toBeInTheDocument();
    expect(screen.getByText('Khả năng tương thích người mẫu (Model Compatibility)')).toBeInTheDocument();
    expect(screen.getByText('Phân cảnh video (1 cảnh)')).toBeInTheDocument();
    expect(screen.getByText('Hạn chế mũ trùm đầu')).toBeInTheDocument();

    const backBtn = screen.getByText('Thư viện video mẫu');
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalled();
  });
});
