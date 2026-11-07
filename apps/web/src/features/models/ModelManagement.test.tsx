import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { validateModelName, validateModelDescription } from './schemas/model-management.schemas';
import { validateModelPhotoFile } from './utils/model-photo-validation';
import { formatFileSize, formatModelStatus } from './utils/model-photo-format';
import { ModelPageHeader } from './components/ModelPageHeader';
import { ModelFilters } from './components/ModelFilters';
import { ModelCard } from './components/ModelCard';
import { ModelSetupStepper } from './components/ModelSetupStepper';
import { ModelIdentityStep } from './components/ModelIdentityStep';
import { ModelReviewStep } from './components/ModelReviewStep';
import { ModelArchiveDialog } from './components/ModelArchiveDialog';
import { ModelDeleteDialog } from './components/ModelDeleteDialog';
import { modelsDevFixture } from './fixtures/models.fixture';

describe('Model Schemas & Validation', () => {
  it('validates model display name', () => {
    expect(validateModelName('').isValid).toBe(false);
    expect(validateModelName('   ').isValid).toBe(false);
    expect(validateModelName('A').isValid).toBe(false); // < 2 chars
    expect(validateModelName('Linh').isValid).toBe(true);
    expect(validateModelName('Linh Fashion Lookbook 01').isValid).toBe(true);
    expect(validateModelName('A'.repeat(61)).isValid).toBe(false); // > 60 chars
  });

  it('validates model description', () => {
    expect(validateModelDescription('').isValid).toBe(true);
    expect(validateModelDescription(null).isValid).toBe(true);
    expect(validateModelDescription('A'.repeat(501)).isValid).toBe(false);
    expect(validateModelDescription('Valid note').isValid).toBe(true);
  });

  it('validates model photo files', () => {
    const validJpg = new File(['mock content'], 'test.jpg', { type: 'image/jpeg' });
    const validPng = new File(['mock content'], 'test.png', { type: 'image/png' });
    const validWebp = new File(['mock content'], 'test.webp', { type: 'image/webp' });
    const invalidPdf = new File(['mock content'], 'test.pdf', { type: 'application/pdf' });

    expect(validateModelPhotoFile(validJpg, 0).isValid).toBe(true);
    expect(validateModelPhotoFile(validPng, 0).isValid).toBe(true);
    expect(validateModelPhotoFile(validWebp, 0).isValid).toBe(true);
    expect(validateModelPhotoFile(invalidPdf, 0).isValid).toBe(false);

    // Over 20MB limit
    const hugeFile = new File(['content'], 'huge.jpg', { type: 'image/jpeg' });
    Object.defineProperty(hugeFile, 'size', { value: 25 * 1024 * 1024 });
    expect(validateModelPhotoFile(hugeFile, 0).isValid).toBe(false);

    // Over 20 photos quota
    expect(validateModelPhotoFile(validJpg, 20).isValid).toBe(false);
  });

  it('formats file size correctly', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(2048000)).toBe('2 MB');
  });

  it('formats model status correctly', () => {
    expect(formatModelStatus('READY').label).toBe('Sẵn sàng');
    expect(formatModelStatus('DRAFT').label).toBe('Bản nháp');
    expect(formatModelStatus('ARCHIVED').label).toBe('Đã lưu trữ');
  });
});

describe('ModelPageHeader Component', () => {
  it('renders title and description', () => {
    render(<ModelPageHeader onCreateClick={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Người mẫu');
    expect(
      screen.getByText('Quản lý hồ sơ người mẫu và hình ảnh tham chiếu để sử dụng trong các dự án video.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tạo người mẫu/i })).toBeInTheDocument();
  });

  it('triggers onCreateClick when button is clicked', () => {
    const handleCreate = vi.fn();
    render(<ModelPageHeader onCreateClick={handleCreate} />);

    fireEvent.click(screen.getByRole('button', { name: /tạo người mẫu/i }));
    expect(handleCreate).toHaveBeenCalledTimes(1);
  });
});

describe('ModelFilters Component', () => {
  it('renders search input and status filter pills', () => {
    const handleQueryChange = vi.fn();
    const handleStatusChange = vi.fn();

    render(
      <ModelFilters
        query=""
        onQueryChange={handleQueryChange}
        status="ALL"
        onStatusChange={handleStatusChange}
        sortBy="updated_at_desc"
        onSortByChange={vi.fn()}
        viewMode="grid"
        onViewModeChange={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText(/nhập tên hoặc mã người mẫu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tất cả' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sẵn sàng' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bản nháp' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đã lưu trữ' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sẵn sàng' }));
    expect(handleStatusChange).toHaveBeenCalledWith('READY');
  });
});

describe('ModelCard Component', () => {
  it('renders model card with cover, name, code and photo count', () => {
    const model = modelsDevFixture.summaries[0];
    render(
      <MemoryRouter>
        <ModelCard model={model} />
      </MemoryRouter>
    );

    expect(screen.getByText('Linh Fashion')).toBeInTheDocument();
    expect(screen.getByText('MOD-000101')).toBeInTheDocument();
    expect(screen.getByText('05 ảnh tham chiếu')).toBeInTheDocument();
    expect(screen.getByText('Sẵn sàng')).toBeInTheDocument();
  });
});

describe('ModelSetupStepper Component', () => {
  it('renders 3 steps and honors disabled state for future steps', () => {
    const handleStepClick = vi.fn();
    const steps = [
      {
        key: 'identity' as const,
        stepNumber: 1,
        title: 'Thông tin người mẫu',
        isCompleted: true,
        isActive: false,
        isDisabled: false,
      },
      {
        key: 'photos' as const,
        stepNumber: 2,
        title: 'Hình ảnh tham chiếu',
        isCompleted: false,
        isActive: true,
        isDisabled: false,
      },
      {
        key: 'review' as const,
        stepNumber: 3,
        title: 'Kiểm tra và hoàn tất',
        isCompleted: false,
        isActive: false,
        isDisabled: true, // future step
      },
    ];

    render(<ModelSetupStepper steps={steps} onStepClick={handleStepClick} />);

    expect(screen.getAllByText('Thông tin người mẫu')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Hình ảnh tham chiếu')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Kiểm tra và hoàn tất')[0]).toBeInTheDocument();

    // Click step 1 (completed, clickable)
    const step1Btn = screen.getByRole('button', { name: /bước 1: thông tin người mẫu/i });
    fireEvent.click(step1Btn);
    expect(handleStepClick).toHaveBeenCalledWith('identity');

    // Click step 3 (disabled, should not trigger)
    const step3Btn = screen.getByRole('button', { name: /bước 3: kiểm tra và hoàn tất/i });
    expect(step3Btn).toBeDisabled();
    fireEvent.click(step3Btn);
    expect(handleStepClick).not.toHaveBeenCalledWith('review');
  });
});

describe('ModelIdentityStep Component', () => {
  it('prevents submission when model name is empty', async () => {
    const handleSave = vi.fn();
    const model = modelsDevFixture.details['mod-linh-001'];

    render(
      <ModelIdentityStep
        model={{ ...model, displayName: '' }}
        onSaveAndContinue={handleSave}
        onCancel={vi.fn()}
        isSaving={false}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /lưu và tiếp tục/i });
    expect(submitBtn).toBeDisabled();
    expect(handleSave).not.toHaveBeenCalled();
  });
});

describe('ModelReviewStep Component', () => {
  it('renders summary review and calls onFinalize', async () => {
    const handleFinalize = vi.fn();
    const model = modelsDevFixture.details['mod-linh-001'];

    render(
      <ModelReviewStep
        model={model}
        onBack={vi.fn()}
        onGoToIdentity={vi.fn()}
        onGoToPhotos={vi.fn()}
        onFinalize={handleFinalize}
        isFinalizing={false}
      />
    );

    expect(screen.getByText('Kiểm tra hồ sơ người mẫu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hoàn tất hồ sơ người mẫu/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /hoàn tất hồ sơ người mẫu/i }));
    expect(handleFinalize).toHaveBeenCalledTimes(1);
  });
});

describe('Model Dialogs', () => {
  it('renders archive dialog with confirm and cancel buttons', () => {
    const model = modelsDevFixture.summaries[0];
    const handleArchive = vi.fn();

    render(
      <ModelArchiveDialog
        model={model}
        isOpen={true}
        onClose={vi.fn()}
        onConfirmArchive={handleArchive}
      />
    );

    expect(screen.getByText('Lưu trữ người mẫu?')).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: /lưu trữ hồ sơ/i });
    fireEvent.click(confirmBtn);
    expect(handleArchive).toHaveBeenCalledWith(model.modelId);
  });

  it('renders delete dialog with confirm and cancel buttons', () => {
    const model = modelsDevFixture.summaries[2]; // DRAFT
    const handleDelete = vi.fn();

    render(
      <ModelDeleteDialog
        model={model}
        isOpen={true}
        onClose={vi.fn()}
        onConfirmDelete={handleDelete}
      />
    );

    expect(screen.getByText('Xóa bản nháp người mẫu?')).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: /xóa bản nháp/i });
    fireEvent.click(confirmBtn);
    expect(handleDelete).toHaveBeenCalledWith(model.modelId);
  });
});
