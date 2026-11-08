import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/Tooltip';
import { NAV_GROUPS } from './sidebar.types';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onNavigate,
  className,
}) => {
  const location = useLocation();

  const isRouteActive = (path: string) => {
    if (path === '/overview') {
      return location.pathname === '/overview' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 flex flex-col bg-white border-r border-[#E8E5E0] transition-[width] duration-200 select-none z-30 shrink-0',
        isCollapsed ? 'w-[72px]' : 'w-[252px]',
        className
      )}
    >
      {/* Brand Header */}
      <div className="h-[76px] px-5 flex items-center border-b border-[#E8E5E0] overflow-hidden shrink-0">
        <NavLink
          to="/studio"
          onClick={onNavigate}
          className="flex flex-col text-left focus:outline-none"
        >
          <span className="text-[19px] font-bold leading-tight text-[#242321] tracking-tight">
            {isCollapsed ? 'tm' : 'trendmotion'}
          </span>
          {!isCollapsed && (
            <span className="text-[10px] font-semibold tracking-[0.5px] text-[#74716D] uppercase mt-0.5">
              studio
            </span>
          )}
        </NavLink>
      </div>

      {/* Navigation Groups List */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            {!isCollapsed ? (
              <h4 className="px-3 text-[11px] font-semibold text-[#97938E] tracking-[0.5px] uppercase select-none mb-1.5">
                {group.title}
              </h4>
            ) : (
              <div className="h-2" aria-hidden="true" />
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isRouteActive(item.path);

                const linkContent = (
                  <NavLink
                    to={item.path}
                    onClick={onNavigate}
                    className={cn(
                      'group relative h-[42px] px-3 rounded-lg flex items-center transition-colors duration-fast text-sm font-sans',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring',
                      isCollapsed ? 'justify-center px-0' : 'justify-start',
                      active
                        ? 'bg-[#F2EDF5] text-[#654B7B] font-semibold'
                        : 'text-[#5C5955] hover:bg-[#F7F6F4] hover:text-[#242321]'
                    )}
                  >
                    {/* Active Left Indicator Pill */}
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#654B7B] rounded-r"
                        aria-hidden="true"
                      />
                    )}

                    <Icon
                      className={cn(
                        'w-[18px] h-[18px] shrink-0 transition-colors',
                        active
                          ? 'text-[#654B7B]'
                          : 'text-[#5C5955] group-hover:text-[#242321]'
                      )}
                      aria-hidden="true"
                    />

                    {!isCollapsed && (
                      <span className="ml-[11px] truncate">{item.label}</span>
                    )}
                  </NavLink>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip
                      key={item.path}
                      content={item.label}
                      position="right"
                      delayMs={300}
                    >
                      {linkContent}
                    </Tooltip>
                  );
                }

                return <div key={item.path}>{linkContent}</div>;
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Collapse Toggle Button */}
      <div className="p-3 border-t border-[#E8E5E0] shrink-0">
        {isCollapsed ? (
          <Tooltip
            content="Mở rộng thanh bên"
            position="right"
            delayMs={300}
          >
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Mở rộng thanh bên"
              className="w-full h-10 flex items-center justify-center rounded-lg text-[#74716D] hover:text-[#242321] hover:bg-[#F7F6F4] transition-colors"
            >
              <PanelLeftOpen className="w-[18px] h-[18px]" />
            </button>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Thu gọn thanh bên"
            className="w-full h-10 px-3 flex items-center gap-2.5 rounded-lg text-[#74716D] hover:text-[#242321] hover:bg-[#F7F6F4] transition-colors text-sm font-sans"
          >
            <PanelLeftClose className="w-[18px] h-[18px] shrink-0" />
            <span className="truncate">Thu gọn thanh bên</span>
          </button>
        )}
      </div>
    </aside>
  );
};
