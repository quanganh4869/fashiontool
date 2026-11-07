import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dialog } from './Dialog';

describe('Dialog Component', () => {
  it('does not render when isOpen=false', () => {
    render(
      <Dialog isOpen={false} onClose={vi.fn()} title="Test Dialog" />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal title, description and action buttons when open', () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <Dialog
        isOpen={true}
        onClose={handleClose}
        title="Tiêu đề thử nghiệm"
        description="Mô tả hộp thoại thử nghiệm"
        confirmLabel="Xác nhận"
        cancelLabel="Hủy"
        onConfirm={handleConfirm}
      >
        <p>Nội dung thử nghiệm</p>
      </Dialog>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Tiêu đề thử nghiệm')).toBeInTheDocument();
    expect(screen.getByText('Mô tả hộp thoại thử nghiệm')).toBeInTheDocument();
    expect(screen.getByText('Nội dung thử nghiệm')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /hủy/i });
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const confirmBtn = screen.getByRole('button', { name: /xác nhận/i });
    fireEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
