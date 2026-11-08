import React from 'react';
import {
  Clapperboard,
  UserRound,
  Library,
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
    title: 'SẢN XUẤT VIDEO',
    items: [
      {
        label: 'Studio tạo video',
        path: '/studio',
        icon: Clapperboard,
      },
    ],
  },
  {
    title: 'TÀI NGUYÊN NGUYÊN LIỆU',
    items: [
      {
        label: 'Hồ sơ người mẫu',
        path: '/models',
        icon: UserRound,
      },
      {
        label: 'Kho video mẫu',
        path: '/library',
        icon: Library,
      },
    ],
  },
];
