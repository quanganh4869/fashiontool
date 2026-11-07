import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OverviewHeader } from './components/OverviewHeader';
import { OverviewSummaryStrip } from './components/OverviewSummaryStrip';
import { RecentProjectsSection } from './components/RecentProjectsSection';
import { ActiveJobsSection } from './components/ActiveJobsSection';
import { CompletedVideosSection } from './components/CompletedVideosSection';
import { SavedProductsSection } from './components/SavedProductsSection';
import { overviewDevFixture } from './fixtures/overview.fixture';

describe('OverviewHeader Component', () => {
  it('renders title and exact description', () => {
    render(
      <OverviewHeader
        timeRange="7d"
        onTimeRangeChange={vi.fn()}
        onRefresh={vi.fn()}
        isRefreshing={false}
      />
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tổng quan');
    expect(
      screen.getByText('Theo dõi hoạt động nghiên cứu sản phẩm và sản xuất video của bạn.')
    ).toBeInTheDocument();
  });

  it('triggers refresh when click Làm mới button', () => {
    const handleRefresh = vi.fn();
    render(
      <OverviewHeader
        timeRange="7d"
        onTimeRangeChange={vi.fn()}
        onRefresh={handleRefresh}
        isRefreshing={false}
      />
    );

    const refreshButton = screen.getByRole('button', { name: /làm mới/i });
    fireEvent.click(refreshButton);
    expect(handleRefresh).toHaveBeenCalledTimes(1);
  });
});

describe('OverviewSummaryStrip Component', () => {
  it('renders all four metric labels', () => {
    render(
      <OverviewSummaryStrip
        summary={overviewDevFixture.summary7d}
        isLoading={false}
        error={null}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText('Sản phẩm đã lưu')).toBeInTheDocument();
    expect(screen.getByText('Kênh đã phân tích')).toBeInTheDocument();
    expect(screen.getByText('Ảnh đã tạo')).toBeInTheDocument();
    expect(screen.getByText('Video đã tạo')).toBeInTheDocument();

    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('renders dash — when metrics data is null (not connected)', () => {
    render(
      <OverviewSummaryStrip
        summary={null}
        isLoading={false}
        error={null}
        onRetry={vi.fn()}
      />
    );

    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBe(4);
  });

  it('renders error state and retry button on failure', () => {
    const handleRetry = vi.fn();
    render(
      <OverviewSummaryStrip
        summary={null}
        isLoading={false}
        error="Network timeout"
        onRetry={handleRetry}
      />
    );

    expect(screen.getByText(/Không thể tải số liệu thống kê/i)).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /thử lại/i });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});

describe('RecentProjectsSection Component', () => {
  it('renders empty state when list is empty', () => {
    render(
      <MemoryRouter>
        <RecentProjectsSection
          projects={[]}
          isLoading={false}
          error={null}
          onRetry={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Chưa có dự án nào')).toBeInTheDocument();
    expect(
      screen.getByText('Các dự án bạn thực hiện trong Studio sẽ xuất hiện tại đây.')
    ).toBeInTheDocument();
  });

  it('renders project list with table headers and row items', () => {
    render(
      <MemoryRouter>
        <RecentProjectsSection
          projects={overviewDevFixture.recentProjects}
          isLoading={false}
          error={null}
          onRetry={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Dự án gần đây')).toBeInTheDocument();
    expect(screen.getByText('Mở Studio')).toBeInTheDocument();
    expect(screen.getByText('Đầm hoa nhí Vintage mùa hè 2026')).toBeInTheDocument();
    expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
  });
});

describe('ActiveJobsSection Component', () => {
  it('renders empty state when no active jobs', () => {
    render(
      <MemoryRouter>
        <ActiveJobsSection
          jobs={[]}
          isLoading={false}
          error={null}
          onRetry={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Không có tác vụ đang xử lý')).toBeInTheDocument();
    expect(
      screen.getByText('Các tác vụ tạo ảnh, tạo video và phân tích đang chạy sẽ xuất hiện tại đây.')
    ).toBeInTheDocument();
  });

  it('renders active jobs list with progress', () => {
    render(
      <MemoryRouter>
        <ActiveJobsSection
          jobs={overviewDevFixture.activeJobs}
          isLoading={false}
          error={null}
          onRetry={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Tác vụ đang xử lý')).toBeInTheDocument();
    expect(screen.getByText('Đang tạo video')).toBeInTheDocument();
    expect(screen.getByText('68%')).toBeInTheDocument();
  });
});

describe('CompletedVideosSection Component', () => {
  it('renders completed videos and link to library', () => {
    render(
      <MemoryRouter>
        <CompletedVideosSection
          videos={overviewDevFixture.completedVideos}
          isLoading={false}
          error={null}
          onRetry={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Video mới hoàn thành')).toBeInTheDocument();
    expect(screen.getByText('Mở thư viện')).toBeInTheDocument();
    expect(
      screen.getByText('Đầm hoa nhí Vintage mùa hè 2026 - Bản Affiliate Viral #1')
    ).toBeInTheDocument();
  });
});

describe('SavedProductsSection Component', () => {
  it('renders saved products list with price and shop name', () => {
    render(
      <MemoryRouter>
        <SavedProductsSection
          products={overviewDevFixture.savedProducts}
          isLoading={false}
          error={null}
          onRetry={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Sản phẩm đã lưu gần đây')).toBeInTheDocument();
    expect(screen.getByText('Nghiên cứu sản phẩm')).toBeInTheDocument();
    expect(screen.getByText('May Fashion Official')).toBeInTheDocument();
    expect(screen.getByText('Chưa có thông tin giá')).toBeInTheDocument(); // prod-004 test case
  });
});
