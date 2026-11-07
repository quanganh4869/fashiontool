import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Wallet, Menu, User, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';

export interface TopbarProps {
  onOpenMobileMenu?: () => void;
}

const ROUTE_NAME_MAP: Record<string, string> = {
  '/overview': 'Tổng quan',
  '/products': 'Nghiên cứu sản phẩm',
  '/channels': 'Phân tích kênh',
  '/studio': 'Studio tạo video',
  '/models': 'Người mẫu',
  '/library': 'Thư viện',
  '/wallet': 'Ví credit',
  '/settings': 'Cài đặt',
  '/__design-preview': 'Design System Preview',
};

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname === '/' ? '/overview' : location.pathname;
  const currentTitle = ROUTE_NAME_MAP[currentPath] || 'Trang';

  return (
    <header className="h-16 bg-white border-b border-[#E8E5E0] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
      {/* Left: Mobile Drawer Trigger & Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Mở menu điều hướng"
          className="lg:hidden w-10 h-10 -ml-2 rounded-md flex items-center justify-center text-[#242321] hover:bg-[#F7F6F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
        >
          <Menu className="w-[18px] h-[18px]" />
        </button>

        {/* Current Page Breadcrumb */}
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center text-sm font-medium text-[#242321]">
            <li className="truncate">{currentTitle}</li>
          </ol>
        </nav>
      </div>

      {/* Right: Credit Indicator & Account Dropdown */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Credit Indicator Box */}
        <div className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-lg border border-[#E8E5E0] bg-[#FBFAF8]">
          <div className="flex items-center gap-1.5 text-xs text-[#74716D]">
            <Wallet className="w-4 h-4 text-[#654B7B] shrink-0" />
            <span className="font-medium text-[#242321]">Credit</span>
            <span className="tabular-nums font-semibold text-[#242321] px-1">
              —
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/wallet')}
            className="h-[34px] px-3 text-xs font-semibold text-[#242321] bg-white border border-[#E8E5E0] rounded-md hover:bg-[#F7F6F4] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
          >
            Nạp credit
          </button>
        </div>

        {/* Account Avatar with Dropdown */}
        <DropdownMenu
          align="right"
          trigger={
            <button
              type="button"
              aria-label="Mở menu tài khoản"
              className="w-9 h-9 rounded-full bg-[#EFEEEB] border border-[#E8E5E0] flex items-center justify-center text-xs font-bold text-[#242321] hover:border-[#D8D4CE] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
            >
              U
            </button>
          }
        >
          <div className="px-3 py-2 border-b border-[#E8E5E0] mb-1">
            <p className="text-xs font-semibold text-[#242321]">Tài khoản cá nhân</p>
            <p className="text-[11px] text-[#97938E] mt-0.5">Fashion Commerce</p>
          </div>
          <DropdownMenuItem
            label="Tài khoản"
            icon={User}
            onClick={() => navigate('/settings')}
          />
          <DropdownMenuItem
            label="Cài đặt"
            icon={Settings}
            onClick={() => navigate('/settings')}
          />
        </DropdownMenu>
      </div>
    </header>
  );
};
