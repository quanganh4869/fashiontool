import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { TemplateSearchToolbar } from '../components/TemplateSearchToolbar';
import { TemplateFilterToolbar } from '../components/TemplateFilterToolbar';
import { TemplateGrid } from '../components/TemplateGrid';
import { TemplatePreviewDialog } from '../components/TemplatePreviewDialog';
import { TemplateUploadModal } from '../components/TemplateUploadModal';
import { useTemplates } from '../hooks/useTemplates';
import { TemplateSummary, TemplateDetail } from '../types/template.types';
import { Button } from '@/components/ui/Button';
import { UploadCloud } from 'lucide-react';

export const TemplateLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    searchInput,
    category,
    aspectRatio,
    garmentSlot,
    assessmentStatus,
    durationRange,
    isFavorite,
    sortBy,
    page,
    categories,
    data,
    isLoading,
    error,
    hasActiveFilters,
    handleSearchChange,
    handleSearchImmediate,
    clearSearch,
    updateParam,
    resetAllFilters,
    handleToggleFavorite,
    handlePageChange,
    refetch,
  } = useTemplates();

  // Preview Dialog State
  const [previewTemplate, setPreviewTemplate] = useState<TemplateSummary | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleOpenPreview = (template: TemplateSummary) => {
    setPreviewTemplate(template);
  };

  const handleClosePreview = () => {
    setPreviewTemplate(null);
  };

  const handleCardClick = (template: TemplateSummary) => {
    navigate(`/library/${template.templateId}`, { state: { from: location.search } });
  };

  return (
    <PageContainer
      title="Video mẫu"
      description="Khám phá các video thời trang mẫu để sử dụng cùng người mẫu của bạn."
      className="space-y-6"
    >
      {/* Search & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <TemplateSearchToolbar
          value={searchInput}
          onChange={handleSearchChange}
          onEnter={handleSearchImmediate}
          onClear={clearSearch}
        />
        <Button
          variant="primary"
          onClick={() => setIsUploadOpen(true)}
          className="flex-shrink-0"
        >
          <UploadCloud className="w-4 h-4 mr-2" />
          Tải lên video mẫu
        </Button>
      </div>

      {/* Filter & Sorting Controls */}
      <TemplateFilterToolbar
        categories={categories}
        activeCategory={category}
        onSelectCategory={(cid) => updateParam('category', cid)}
        aspectRatio={aspectRatio}
        onSelectAspectRatio={(val) => updateParam('aspect_ratio', val)}
        garmentSlot={garmentSlot}
        onSelectGarmentSlot={(val) => updateParam('garment_slot', val)}
        assessmentStatus={assessmentStatus}
        onSelectAssessmentStatus={(val) => updateParam('assessment_status', val)}
        durationRange={durationRange}
        onSelectDurationRange={(val) => updateParam('duration_range', val)}
        isFavorite={isFavorite}
        onToggleFavoriteFilter={(val) => updateParam('is_favorite', val ? 'true' : undefined)}
        sortBy={sortBy}
        onSelectSortBy={(val) => updateParam('sort_by', val)}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetAllFilters}
      />

      {/* Main Grid & Pagination */}
      <TemplateGrid
        items={data.items}
        total={data.total}
        page={page}
        totalPages={data.totalPages}
        isLoading={isLoading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        onPreview={handleOpenPreview}
        onSelect={handleCardClick}
        onToggleFavorite={handleToggleFavorite}
        onResetFilters={resetAllFilters}
        onPageChange={handlePageChange}
        onRetry={refetch}
      />

      {/* Video Preview Dialog */}
      <TemplatePreviewDialog
        template={previewTemplate}
        isOpen={Boolean(previewTemplate)}
        onClose={handleClosePreview}
        onNavigateDetail={(id) => navigate(`/library/${id}`, { state: { from: location.search } })}
      />

      {/* Video Upload Modal */}
      <TemplateUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={(newTemplate: TemplateDetail) => {
          refetch();
          navigate(`/library/${newTemplate.templateId}`, { state: { from: location.search } });
        }}
      />
    </PageContainer>
  );
};
