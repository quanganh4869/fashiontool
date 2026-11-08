import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'trendmotion_sidebar_collapsed';

export const AppShell: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Stop any lingering media playback across the entire app whenever route changes
  useEffect(() => {
    document.querySelectorAll('video, audio').forEach((node) => {
      try {
        const media = node as HTMLMediaElement;
        media.pause();
        media.muted = true;
      } catch {}
    });
  }, [location.pathname]);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // LocalStorage fallback
      }
      return next;
    });
  };

  // Close mobile drawer on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileOpen]);

  return (
    <div
      style={{ '--sidebar-w': isCollapsed ? '72px' : '252px' } as React.CSSProperties}
      className="h-screen w-screen overflow-hidden flex bg-[#F6F5F2] text-[#242321] font-sans antialiased"
    >
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block shrink-0 h-screen">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#242321]/40 backdrop-blur-[1px] transition-opacity animate-in fade-in"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative z-10 w-[260px] h-full shadow-modal animate-in slide-in-from-left duration-200">
            <Sidebar
              isCollapsed={false}
              onToggleCollapse={() => setIsMobileOpen(false)}
              onNavigate={() => setIsMobileOpen(false)}
              className="h-full border-r-0"
            />
          </div>
        </div>
      )}

      {/* Right Column: Topbar + Main Locked Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Topbar onOpenMobileMenu={() => setIsMobileOpen(true)} />

        {/* Main Workspace Area */}
        <main
          className={cn(
            'flex-1 min-h-0 flex flex-col overflow-hidden bg-[#F6F5F2]',
            'transition-[padding] duration-200'
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
