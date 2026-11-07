import React from 'react';
import { Users } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmptyState } from '@/components/feedback/EmptyState';

export const ChannelAnalysisPage: React.FC = () => {
  return (
    <PageContainer
      title="Phân tích kênh"
      description="Nghiên cứu hoạt động nội dung và sản phẩm trên các kênh TikTok."
    >
      <EmptyState
        icon={Users}
        title="Chức năng đang được phát triển"
        description="Nội dung của khu vực này sẽ được hoàn thiện trong giai đoạn tiếp theo."
      />
    </PageContainer>
  );
};
