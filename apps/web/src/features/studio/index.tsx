import React from 'react';
import { useParams } from 'react-router-dom';
import { Clapperboard } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmptyState } from '@/components/feedback/EmptyState';

export const StudioPage: React.FC = () => {
  const { projectId, step } = useParams<{ projectId?: string; step?: string }>();

  return (
    <PageContainer
      title="Studio tạo video"
      description="Tạo nội dung video thời trang từ sản phẩm và người mẫu."
    >
      <EmptyState
        icon={Clapperboard}
        title={projectId ? `Dự án: ${projectId} (Bước: ${step || 'sản phẩm'})` : 'Studio tạo video'}
        description={
          projectId
            ? 'Không gian làm việc cho dự án này sẽ được phát triển chi tiết trong Giai đoạn Studio.'
            : 'Nội dung của khu vực này sẽ được hoàn thiện trong giai đoạn tiếp theo.'
        }
      />
    </PageContainer>
  );
};
