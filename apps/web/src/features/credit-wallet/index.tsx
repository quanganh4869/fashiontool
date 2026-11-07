import React from 'react';
import { Wallet } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmptyState } from '@/components/feedback/EmptyState';

export const CreditWalletPage: React.FC = () => {
  return (
    <PageContainer
      title="Ví credit"
      description="Theo dõi số dư và lịch sử sử dụng credit."
    >
      <EmptyState
        icon={Wallet}
        title="Chức năng đang được phát triển"
        description="Nội dung của khu vực này sẽ được hoàn thiện trong giai đoạn tiếp theo."
      />
    </PageContainer>
  );
};
