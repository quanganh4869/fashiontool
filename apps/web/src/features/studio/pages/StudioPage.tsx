import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useStudio } from '../hooks/useStudio';
import { StudioHeader } from '../components/StudioHeader';
import { StudioStepper } from '../components/StudioStepper';
import { ModelSelectStep } from '../components/ModelSelectStep';
import { TemplateSelectStep } from '../components/TemplateSelectStep';
import { CompatibilityStep } from '../components/CompatibilityStep';
import { GenerationProgressStep } from '../components/GenerationProgressStep';
import { GenerationResultStep } from '../components/GenerationResultStep';
import { ProjectsDashboardView } from '../components/ProjectsDashboardView';
import { ProductManagementStep } from '@/features/products';
import { ReplacementWorkspaceStep } from '@/features/replacement';
import { ProjectSummary } from '../types/studio.types';

export const StudioPage: React.FC = () => {
  const {
    step,
    setStep,
    models,
    templates,
    categories,
    isLoadingCatalogs,
    catalogError,
    selectedModel,
    selectedTemplate,
    compatibility,
    isCheckingCompat,
    compatError,
    generation,
    activeProjectName,
    isCreatingGeneration,
    isCancelling,
    isRetrying,
    loadCatalogs,
    evaluateCompatibility,
    handleSelectModel,
    handleSelectTemplate,
    handleStartGeneration,
    handleCancelGeneration,
    handleRetryGeneration,
    handleOpenProject,
    handleResetToNew,
    canNavigateToStep,
  } = useStudio();

  // View mode: 'dashboard' (Danh sách dự án) vs 'wizard' (Các bước trong dự án)
  const [viewMode, setViewMode] = useState<'dashboard' | 'wizard'>('dashboard');

  const handleStartNewProject = () => {
    handleResetToNew();
    setStep('model');
    setViewMode('wizard');
  };

  const handleSelectProjectFromDashboard = async (project: ProjectSummary) => {
    await handleOpenProject(project);
    setViewMode('wizard');
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-[#F6F5F2]">
      {/* VIEW 1: PROJECTS DASHBOARD (DANH SÁCH DỰ ÁN) */}
      {viewMode === 'dashboard' ? (
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-7 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <ProjectsDashboardView
              onCreateNewProject={handleStartNewProject}
              onOpenProject={handleSelectProjectFromDashboard}
            />
          </div>
        </div>
      ) : (
        /* VIEW 2: PROJECT WORKSPACE & WIZARD (CHỈ HIỆN KHI BẤM VÀO DỰ ÁN HOẶC TẠO DỰ ÁN) */
        <>
          {/* 1. TOPBAR & ROUTE STEPPER: 100% LOCKED AT TOP (NEVER SCROLLS) */}
          <div className="shrink-0 bg-white border-b border-[#E8E5E0] z-20 px-4 sm:px-7 lg:px-8 py-3.5 shadow-xs">
            <div className="max-w-7xl mx-auto space-y-3">
              <StudioHeader
                onBackToDashboard={() => setViewMode('dashboard')}
                onNewProject={handleStartNewProject}
                activeProjectName={activeProjectName}
              />
              <StudioStepper
                currentStep={step}
                onStepClick={(targetStep) => setStep(targetStep)}
                canNavigateToStep={canNavigateToStep}
              />
            </div>
          </div>

          {/* 2. SCROLLABLE MIDDLE WORKSPACE (ONLY THIS AREA SCROLLS) */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-7 lg:px-8 py-6">
            <div className="max-w-7xl mx-auto">
              {step === 'model' && (
                <ModelSelectStep
                  models={models}
                  selectedModel={selectedModel}
                  onSelectModel={handleSelectModel}
                  onNext={() => setStep('template')}
                  isLoading={isLoadingCatalogs}
                  error={catalogError}
                />
              )}

              {step === 'template' && (
                <TemplateSelectStep
                  templates={templates}
                  categories={categories}
                  selectedTemplate={selectedTemplate}
                  onSelectTemplate={handleSelectTemplate}
                  onBack={() => setStep('model')}
                  onNext={() => setStep('confirm')}
                  isLoading={isLoadingCatalogs}
                  error={catalogError}
                  onRefreshTemplates={loadCatalogs}
                />
              )}

              {step === 'confirm' && selectedModel && selectedTemplate && (
                <CompatibilityStep
                  model={selectedModel}
                  template={selectedTemplate}
                  compatibility={compatibility}
                  isLoading={isCheckingCompat}
                  error={compatError}
                  onRetryCheck={evaluateCompatibility}
                  onChangeModel={() => setStep('model')}
                  onChangeTemplate={() => setStep('template')}
                  onBack={() => setStep('template')}
                  onStartGeneration={handleStartGeneration}
                  isCreating={isCreatingGeneration}
                />
              )}

              {step === 'processing' && generation && (
                <GenerationProgressStep
                  generation={generation}
                  onCancel={handleCancelGeneration}
                  onRetry={handleRetryGeneration}
                  onViewResult={() => setStep('result')}
                  isCancelling={isCancelling}
                  isRetrying={isRetrying}
                />
              )}

              {step === 'result' && generation && (
                <GenerationResultStep
                  generation={generation}
                  onCreateNewVersion={() => {
                    setStep('confirm');
                  }}
                  onOpenProjects={() => setViewMode('dashboard')}
                  onProceedToProducts={() => setStep('products')}
                />
              )}

              {step === 'products' && generation && (
                <ProductManagementStep
                  generation={generation}
                  onBackToBaseVideo={() => setStep('result')}
                  onProceedToReplacement={() => setStep('replacement')}
                />
              )}

              {step === 'replacement' && generation && (
                <ReplacementWorkspaceStep
                  generation={generation}
                  onBackToProducts={() => setStep('products')}
                />
              )}

              {step === 'confirm' && (!selectedModel || !selectedTemplate) && (
                <div className="text-center py-12 bg-white rounded-xl border border-[#E8E5E0] p-6 space-y-3">
                  <p className="text-sm text-[#74716D]">
                    Vui lòng chọn đủ người mẫu và video mẫu trước khi kiểm tra tương thích.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setStep(selectedModel ? 'template' : 'model')}
                  >
                    Quay lại chọn {selectedModel ? 'video mẫu' : 'người mẫu'}
                  </Button>
                </div>
              )}

              {['processing', 'result', 'products', 'replacement'].includes(step) && !generation && (
                <div className="text-center py-12 bg-white rounded-xl border border-[#E8E5E0] p-6 space-y-3">
                  <p className="text-sm text-[#74716D]">Chưa có dữ liệu tiến trình tạo video.</p>
                  <Button variant="primary" onClick={() => setStep('model')}>
                    Quay lại bước 1: Chọn người mẫu
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
