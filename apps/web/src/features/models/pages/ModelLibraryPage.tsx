import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { useModels } from '../hooks/useModels';
import { modelManagementService } from '../services/model-management.service';
import { ModelProfileSummary } from '../types/model-management.types';

import { ModelPageHeader } from '../components/ModelPageHeader';
import { ModelFilters } from '../components/ModelFilters';
import { ModelGrid } from '../components/ModelGrid';
import { ModelArchiveDialog } from '../components/ModelArchiveDialog';
import { ModelDeleteDialog } from '../components/ModelDeleteDialog';

export const ModelLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const {
    items,
    query,
    setQuery,
    status,
    setStatus,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    isLoading,
    error,
    reload,
  } = useModels();

  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [modelToArchive, setModelToArchive] = useState<ModelProfileSummary | null>(null);
  const [modelToDelete, setModelToDelete] = useState<ModelProfileSummary | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleCreateDraft = async () => {
    setIsCreatingDraft(true);
    try {
      const draft = await modelManagementService.createDraft();
      navigate(`/models/${draft.modelId}/setup/identity`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể khởi tạo bản nháp người mẫu.';
      showToast(msg, 'error');
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const handleConfirmArchive = async (modelId: string) => {
    setIsActionLoading(true);
    try {
      await modelManagementService.archiveModel(modelId);
      showToast('Đã lưu trữ hồ sơ người mẫu.', 'success');
      setModelToArchive(null);
      reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu trữ người mẫu.';
      showToast(msg, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmRestore = async (model: ModelProfileSummary) => {
    try {
      await modelManagementService.restoreModel(model.modelId);
      showToast('Đã khôi phục hồ sơ người mẫu thành công.', 'success');
      reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể khôi phục người mẫu.';
      showToast(msg, 'error');
    }
  };

  const handleConfirmDelete = async (modelId: string) => {
    setIsActionLoading(true);
    try {
      await modelManagementService.deleteModel(modelId);
      showToast('Đã xóa hồ sơ người mẫu.', 'success');
      setModelToDelete(null);
      reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa người mẫu.';
      showToast(msg, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const hasFilters = Boolean(query.trim() || (status && status !== 'ALL'));

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 font-sans">
      {/* 1. Page Header */}
      <ModelPageHeader
        onCreateClick={handleCreateDraft}
        isCreating={isCreatingDraft}
      />

      {/* 2. Filter Toolbar */}
      <ModelFilters
        query={query}
        onQueryChange={setQuery}
        status={status}
        onStatusChange={setStatus}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* 3. Main Model Collection */}
      <ModelGrid
        items={items}
        isLoading={isLoading}
        error={error}
        onRetry={reload}
        onCreateClick={handleCreateDraft}
        hasFilters={hasFilters}
        onClearFilters={() => {
          setQuery('');
          setStatus('ALL');
        }}
        viewMode={viewMode}
        onArchive={setModelToArchive}
        onRestore={handleConfirmRestore}
        onDelete={setModelToDelete}
      />

      {/* Archive Modal */}
      <ModelArchiveDialog
        model={modelToArchive}
        isOpen={Boolean(modelToArchive)}
        onClose={() => setModelToArchive(null)}
        onConfirmArchive={handleConfirmArchive}
        isLoading={isActionLoading}
      />

      {/* Delete Modal */}
      <ModelDeleteDialog
        model={modelToDelete}
        isOpen={Boolean(modelToDelete)}
        onClose={() => setModelToDelete(null)}
        onConfirmDelete={handleConfirmDelete}
        isLoading={isActionLoading}
      />
    </div>
  );
};
