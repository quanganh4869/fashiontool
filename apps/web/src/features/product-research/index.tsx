import React from 'react';
import { useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmptyState } from '@/components/feedback/EmptyState';

export const ProductResearchPage: React.FC = () => {
  const { productId } = useParams<{ productId?: string }>();

  return (
    <PageContainer
      title="Nghiên cứu sản phẩm"
      description="Tìm kiếm và phân tích sản phẩm thời trang tiềm năng từ TikTok Shop."
    >
      <EmptyState
        icon={Search}
        title={productId ? `Chi tiết sản phẩm: ${productId}` : 'Chức năng đang được phát triển'}
        description={
          productId
            ? 'Không gian chi tiết sản phẩm sẽ được triển khai trong Giai đoạn Nghiên cứu sản phẩm.'
            : 'Nội dung của khu vực này sẽ được hoàn thiện trong giai đoạn tiếp theo.'
        }
      />
    </PageContainer>
  );
};
