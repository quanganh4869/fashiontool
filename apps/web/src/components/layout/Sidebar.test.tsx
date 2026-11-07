import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';

describe('Sidebar Component', () => {
  it('renders brand wordmark trendmotion studio', () => {
    render(
      <MemoryRouter initialEntries={['/overview']}>
        <Sidebar isCollapsed={false} onToggleCollapse={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('trendmotion')).toBeInTheDocument();
    expect(screen.getByText('studio')).toBeInTheDocument();
  });

  it('renders all 4 navigation groups and 8 items', () => {
    render(
      <MemoryRouter initialEntries={['/overview']}>
        <Sidebar isCollapsed={false} onToggleCollapse={vi.fn()} />
      </MemoryRouter>
    );

    // Groups
    expect(screen.getByText('KHÔNG GIAN')).toBeInTheDocument();
    expect(screen.getByText('NGHIÊN CỨU')).toBeInTheDocument();
    expect(screen.getByText('SÁNG TẠO')).toBeInTheDocument();
    expect(screen.getByText('TÀI KHOẢN')).toBeInTheDocument();

    // Items
    expect(screen.getByText('Tổng quan')).toBeInTheDocument();
    expect(screen.getByText('Nghiên cứu sản phẩm')).toBeInTheDocument();
    expect(screen.getByText('Phân tích kênh')).toBeInTheDocument();
    expect(screen.getByText('Studio tạo video')).toBeInTheDocument();
    expect(screen.getByText('Người mẫu')).toBeInTheDocument();
    expect(screen.getByText('Thư viện')).toBeInTheDocument();
    expect(screen.getByText('Ví credit')).toBeInTheDocument();
    expect(screen.getByText('Cài đặt')).toBeInTheDocument();
  });

  it('highlights the active link according to current route', () => {
    render(
      <MemoryRouter initialEntries={['/products']}>
        <Sidebar isCollapsed={false} onToggleCollapse={vi.fn()} />
      </MemoryRouter>
    );

    const productLink = screen.getByRole('link', { name: /nghiên cứu sản phẩm/i });
    expect(productLink).toHaveClass('bg-[#F2EDF5]');
    expect(productLink).toHaveClass('text-[#654B7B]');
  });

  it('calls onToggleCollapse when collapse button is clicked', () => {
    const handleToggle = vi.fn();
    render(
      <MemoryRouter initialEntries={['/overview']}>
        <Sidebar isCollapsed={false} onToggleCollapse={handleToggle} />
      </MemoryRouter>
    );

    const toggleBtn = screen.getByRole('button', { name: /thu gọn thanh bên/i });
    fireEvent.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });
});
