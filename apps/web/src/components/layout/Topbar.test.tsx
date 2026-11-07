import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Topbar } from './Topbar';

describe('Topbar Component', () => {
  it('renders breadcrumb matching route', () => {
    render(
      <MemoryRouter initialEntries={['/studio']}>
        <Topbar />
      </MemoryRouter>
    );

    expect(screen.getByText('Studio tạo video')).toBeInTheDocument();
  });

  it('renders credit indicator with dash — and recharge button', () => {
    render(
      <MemoryRouter initialEntries={['/overview']}>
        <Topbar />
      </MemoryRouter>
    );

    expect(screen.getByText('Credit')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nạp credit/i })).toBeInTheDocument();
  });

  it('opens account dropdown when avatar is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/overview']}>
        <Topbar />
      </MemoryRouter>
    );

    const avatarBtn = screen.getByRole('button', { name: /mở menu tài khoản/i });
    fireEvent.click(avatarBtn);

    expect(screen.getByRole('menuitem', { name: /tài khoản/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /cài đặt/i })).toBeInTheDocument();
  });
});
