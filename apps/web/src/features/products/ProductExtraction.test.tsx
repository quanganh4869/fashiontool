import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { productService } from './services/product.service';
import { ProjectContextBar } from './components/ProjectContextBar';
import { ProductInputSection } from './components/ProductInputSection';
import { ProductExtractionProgress } from './components/ProductExtractionProgress';
import { ProductExtractionPreview } from './components/ProductExtractionPreview';
import { ProductAssetList } from './components/ProductAssetList';
import { StudioStepper } from '@/features/studio/components/StudioStepper';
import {
  mockExtractionJobRunning,
  mockExtractionJobCompleted,
  mockProductSummaries,
} from './fixtures/product.fixture';
import { mockCompletedGenerationFixture } from '@/features/studio/fixtures/studio.fixture';

describe('Product Service Helpers', () => {
  it('formats byte sizes cleanly', () => {
    expect(productService.formatBytes(0)).toBe('0 B');
    expect(productService.formatBytes(1024)).toBe('1.0 KB');
    expect(productService.formatBytes(5242880)).toBe('5.0 MB');
  });

  it('formats prices with currency symbol', () => {
    expect(productService.formatPrice(890000, 'VND')).toContain('890');
    expect(productService.formatPrice(null)).toBe('Liên hệ');
  });

  it('resolves relative and absolute media urls', () => {
    expect(productService.resolveImageUrl('https://cdn.example.com/img.jpg')).toBe(
      'https://cdn.example.com/img.jpg'
    );
    const resolved = productService.resolveImageUrl('/api/v1/assets/media/prod_1/img.jpg');
    expect(resolved).toContain('/api/v1/assets/media/prod_1/img.jpg');
  });
});

describe('ProjectContextBar', () => {
  it('displays verified Base Video READY badge and model/template info', () => {
    const handleBack = vi.fn();
    render(
      <ProjectContextBar
        generation={mockCompletedGenerationFixture}
        onBackToBaseVideo={handleBack}
      />
    );

    expect(screen.getByText(/Base Video READY/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(mockCompletedGenerationFixture.modelName, 'i'))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(mockCompletedGenerationFixture.templateTitle, 'i'))).toBeInTheDocument();

    const backBtn = screen.getByRole('button', { name: /Xem lại Base Video/i });
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});

describe('ProductInputSection', () => {
  it('rejects localhost and private IP addresses for SSRF protection', () => {
    const handleExtract = vi.fn();
    render(<ProductInputSection onExtract={handleExtract} isLoading={false} />);

    const input = screen.getByPlaceholderText(/Dán link sản phẩm/i);
    const submitBtn = screen.getByRole('button', { name: /Phân tích/i });

    // Try localhost
    fireEvent.change(input, { target: { value: 'http://localhost:8080/admin' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Bảo vệ SSRF/i)).toBeInTheDocument();
    expect(handleExtract).not.toHaveBeenCalled();

    // Try private IP
    fireEvent.change(input, { target: { value: 'http://192.168.1.1/secret' } });
    fireEvent.click(submitBtn);
    expect(screen.getByText(/Bảo vệ SSRF/i)).toBeInTheDocument();
    expect(handleExtract).not.toHaveBeenCalled();
  });

  it('accepts valid public HTTP/HTTPS URL and calls onExtract', () => {
    const handleExtract = vi.fn();
    render(<ProductInputSection onExtract={handleExtract} isLoading={false} />);

    const input = screen.getByPlaceholderText(/Dán link sản phẩm/i);
    const submitBtn = screen.getByRole('button', { name: /Phân tích/i });

    fireEvent.change(input, {
      target: { value: 'https://brand-shop.example.com/products/silk-dress' },
    });
    fireEvent.click(submitBtn);

    expect(handleExtract).toHaveBeenCalledWith(
      'https://brand-shop.example.com/products/silk-dress'
    );
  });
});

describe('ProductExtractionProgress', () => {
  it('renders extraction progress and breakdown steps', () => {
    const handleCancel = vi.fn();
    render(
      <ProductExtractionProgress
        job={mockExtractionJobRunning}
        onCancel={handleCancel}
      />
    );

    expect(screen.getByText(/Đang tiến hành trích xuất dữ liệu/i)).toBeInTheDocument();
    expect(screen.getByText(`${mockExtractionJobRunning.progress}%`)).toBeInTheDocument();
    expect(screen.getByText(/Kiểm tra an toàn liên kết/i)).toBeInTheDocument();
    expect(screen.getByText(/Tải & lưu trữ ảnh gốc/i)).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /Hủy/i });
    fireEvent.click(cancelBtn);
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});

describe('ProductExtractionPreview', () => {
  it('displays extracted metadata, allows custom title, and triggers save', () => {
    const handleSave = vi.fn();
    const handleReset = vi.fn();

    render(
      <ProductExtractionPreview
        job={mockExtractionJobCompleted}
        onSave={handleSave}
        onReset={handleReset}
        isSaving={false}
      />
    );

    expect(
      screen.getByText(/Kiểm tra & Xác nhận thông tin sản phẩm/i)
    ).toBeInTheDocument();
    expect(screen.getByText('ChicStudio')).toBeInTheDocument();
    expect(screen.getByText(/3 ảnh gốc/i)).toBeInTheDocument();

    const titleInput = screen.getByDisplayValue(
      'Đầm Lụa Maxi Họa Tiết Hoa Mùa Hè 2026'
    );
    fireEvent.change(titleInput, { target: { value: 'Đầm Lụa Maxi Vàng VIP' } });

    const saveBtn = screen.getByRole('button', {
      name: /Lưu sản phẩm vào dự án/i,
    });
    fireEvent.click(saveBtn);

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        customTitle: 'Đầm Lụa Maxi Vàng VIP',
      })
    );
  });
});

describe('ProductAssetList & ProductAssetCard', () => {
  it('renders saved products and handles view details and delete actions', () => {
    const handleView = vi.fn();
    const handleDelete = vi.fn();
    const handleAdd = vi.fn();

    // Mock confirm dialog
    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(
      <MemoryRouter>
        <ProductAssetList
          products={mockProductSummaries}
          onViewDetails={handleView}
          onDelete={handleDelete}
          onAddNewClick={handleAdd}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/Sản phẩm trong dự án/i)).toBeInTheDocument();
    expect(
      screen.getByText('Đầm Lụa ChicStudio Vàng Pastel')
    ).toBeInTheDocument();

    const detailBtn = screen.getByRole('button', { name: /Chi tiết/i });
    fireEvent.click(detailBtn);
    expect(handleView).toHaveBeenCalledWith('prod_001');

    const deleteBtn = screen.getByTitle(/Xóa khỏi dự án/i);
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith('prod_001');
  });

  it('renders clean empty state when no products exist', () => {
    const handleAdd = vi.fn();
    render(
      <MemoryRouter>
        <ProductAssetList
          products={[]}
          onViewDetails={vi.fn()}
          onDelete={vi.fn()}
          onAddNewClick={handleAdd}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/Dự án chưa có sản phẩm thời trang nào/i)
    ).toBeInTheDocument();
    const addBtn = screen.getByRole('button', {
      name: /Thêm sản phẩm đầu tiên/i,
    });
    fireEvent.click(addBtn);
    expect(handleAdd).toHaveBeenCalledTimes(1);
  });
});

describe('StudioStepper with Step 6', () => {
  it('includes step 6 Nhập sản phẩm', () => {
    render(
      <StudioStepper
        currentStep="products"
        canNavigateToStep={() => true}
      />
    );

    expect(screen.getByText('6. Nhập sản phẩm')).toBeInTheDocument();
  });
});
