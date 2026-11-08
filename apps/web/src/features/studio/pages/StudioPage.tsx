import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { useStudio } from '../hooks/useStudio';
import { StudioHeader } from '../components/StudioHeader';
import { StudioStepper } from '../components/StudioStepper';
import { ModelSelectStep } from '../components/ModelSelectStep';
import { TemplateSelectStep } from '../components/TemplateSelectStep';
import { CompatibilityStep } from '../components/CompatibilityStep';
import { GenerationProgressStep } from '../components/GenerationProgressStep';
import { GenerationResultStep } from '../components/GenerationResultStep';
import { ProjectHistoryDrawer } from '../components/ProjectHistoryDrawer';
import { ProductManagementStep } from '@/features/products';
import { ReplacementWorkspaceStep } from '@/features/replacement';

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
    activeProjectId,
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
    handleLoadGeneration,
    handleResetToNew,
    canNavigateToStep,
  } = useStudio();

  const [isProjectsDrawerOpen, setIsProjectsDrawerOpen] = useState(false);

  return (
    <PageContainer
      title=""
      description=""
      className="max-w-7xl mx-auto space-y-6 pb-16"
    >
      {/* Studio Header */}
      <StudioHeader
        onOpenProjects={() => setIsProjectsDrawerOpen(true)}
        onNewProject={handleResetToNew}
        activeProjectName={activeProjectName}
      />

      {/* Stepper Navigation - Fixed Sticky at Top */}
      <div className="sticky top-16 z-30 bg-[#F6F5F2] pt-2 pb-3 -mx-4 sm:-mx-7 lg:-mx-8 px-4 sm:px-7 lg:px-8 border-b border-[#E8E5E0] shadow-xs">
        <div className="max-w-7xl mx-auto">
          <StudioStepper
            currentStep={step}
            onStepClick={(targetStep) => setStep(targetStep)}
            canNavigateToStep={canNavigateToStep}
          />
        </div>
      </div>

      {/* Main Step Body */}
      <div className="pt-2">
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
            onOpenProjects={() => setIsProjectsDrawerOpen(true)}
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
            <p className="text-sm text-[#74716D]">Vui lòng chọn đủ người mẫu và video mẫu trước khi kiểm tra tương thích.</p>
            <Button variant="primary" onClick={() => setStep(selectedModel ? 'template' : 'model')}>
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

      {/* Projects History Drawer */}
      <ProjectHistoryDrawer
        isOpen={isProjectsDrawerOpen}
        onClose={() => setIsProjectsDrawerOpen(false)}
        onSelectProject={() => {}}
        onSelectGeneration={handleLoadGeneration}
        currentProjectId={activeProjectId}
      />
    </PageContainer>
  );
};
