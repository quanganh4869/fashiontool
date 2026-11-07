import React from 'react';
import {
  LayoutDashboard,
  Search,
  Users,
  Clapperboard,
  UserRound,
  Library,
  Wallet,
  Settings,
} from 'lucide-react';

export interface NavItemConfig {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavGroupConfig {
  title: string;
  items: NavItemConfig[];
}

export const NAV_GROUPS: NavGroupConfig[] = [
  {
    title: 'KHÔNG GIAN',
    items: [
      {
        label: 'Tổng quan',
        path: '/overview',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'NGHIÊN CỨU',
    items: [
      {
        label: 'Nghiên cứu sản phẩm',
        path: '/products',
        icon: Search,
      },
      {
        label: 'Phân tích kênh',
        path: '/channels',
        icon: Users,
      },
    ],
  },
  {
    title: 'SÁNG TẠO',
    items: [
      {
        label: 'Studio tạo video',
        path: '/studio',
        icon: Clapperboard,
      },
      {
        label: 'Người mẫu',
        path: '/models',
        icon: UserRound,
      },
      {
        label: 'Thư viện',
        path: '/library',
        icon: Library,
      },
    ],
  },
  {
    title: 'TÀI KHOẢN',
    items: [
      {
        label: 'Ví credit',
        path: '/wallet',
        icon: Wallet,
      },
      {
        label: 'Cài đặt',
        path: '/settings',
        icon: Settings,
      },
    ],
  },
];
