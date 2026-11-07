import React from 'react';
import { Settings } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmptyState } from '@/components/feedback/EmptyState';

export const SettingsPage: React.FC = () => {
  return (
    <PageContainer
      title="Cài đặt"
      description="Quản lý thông tin tài khoản và các tùy chọn sử dụng ứng dụng."
    >
      <EmptyState
        icon={Settings}
        title="Chức năng đang được phát triển"
        description="Nội dung của khu vực này sẽ được hoàn thiện trong giai đoạn tiếp theo."
      />
    </PageContainer>
  );
};
