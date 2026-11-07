import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, RotateCcw, ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { TemplateDetailView } from '../components/TemplateDetailView';
import { useTemplateDetail } from '../hooks/useTemplateDetail';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui/Button';

export const TemplateDetailPage: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    template,
    isLoading,
    error,
    isFavoriteLoading,
    handleToggleFavorite,
    refetch,
  } = useTemplateDetail(templateId);

  const handleBack = () => {
    const fromSearch = (location.state as { from?: string } | undefined)?.from;
    if (fromSearch) {
      navigate(`/library${fromSearch}`);
    } else {
      navigate('/library');
    }
  };

  // 1. Loading Skeleton state
  if (isLoading) {
    return (
      <PageContainer title="Chi tiết video mẫu" description="Đang tải thông tin..." className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
          <div className="lg:col-span-5 aspect-[9/16] bg-[#ECEAE4] rounded-2xl" />
          <div className="lg:col-span-7 space-y-4">
            <div className="h-8 bg-[#ECEAE4] rounded-md w-2/3" />
            <div className="h-4 bg-[#ECEAE4] rounded-md w-full" />
            <div className="h-4 bg-[#ECEAE4] rounded-md w-4/5" />
            <div className="h-32 bg-[#ECEAE4] rounded-xl mt-6" />
            <div className="h-48 bg-[#ECEAE4] rounded-xl mt-4" />
          </div>
        </div>
      </PageContainer>
    );
  }

  // 2. Error / Not Found state
  if (error || !template) {
    return (
      <PageContainer title="Không tìm thấy video mẫu" className="space-y-6">
        <EmptyState
          icon={AlertCircle}
          title="Video mẫu không tồn tại hoặc không khả dụng"
          description={error || 'Video mẫu đã bị gỡ bỏ, lưu trữ hoặc đường dẫn không chính xác.'}
          action={
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại thư viện</span>
              </Button>
              <Button variant="primary" size="sm" onClick={refetch} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                <span>Thử lại</span>
              </Button>
            </div>
          }
        />
      </PageContainer>
    );
  }

  // 3. Render Detail View
  return (
    <TemplateDetailView
      template={template}
      isFavoriteLoading={isFavoriteLoading}
      onToggleFavorite={handleToggleFavorite}
      onBack={handleBack}
    />
  );
};
