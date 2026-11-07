import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { TemplateSearchToolbar } from '../components/TemplateSearchToolbar';
import { TemplateFilterToolbar } from '../components/TemplateFilterToolbar';
import { TemplateGrid } from '../components/TemplateGrid';
import { TemplatePreviewDialog } from '../components/TemplatePreviewDialog';
import { useTemplates } from '../hooks/useTemplates';
import { TemplateSummary } from '../types/template.types';

export const TemplateLibraryPage: React.FC = () => {
  const navigate = useNavigate();
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

  const handleOpenPreview = (template: TemplateSummary) => {
    setPreviewTemplate(template);
  };

  const handleClosePreview = () => {
    setPreviewTemplate(null);
  };

  const handleCardClick = (template: TemplateSummary) => {
    navigate(`/library/${template.templateId}`);
  };

  return (
    <PageContainer
      title="Video mẫu"
      description="Khám phá các video thời trang mẫu để sử dụng cùng người mẫu của bạn."
      className="space-y-6"
    >
      {/* Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <TemplateSearchToolbar
          value={searchInput}
          onChange={handleSearchChange}
          onEnter={handleSearchImmediate}
          onClear={clearSearch}
        />
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
        onNavigateDetail={(id) => navigate(`/library/${id}`)}
      />
    </PageContainer>
  );
};
