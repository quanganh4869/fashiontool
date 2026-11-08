import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
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

      {/* Stepper Navigation */}
      <StudioStepper
        currentStep={step}
        onStepClick={(targetStep) => setStep(targetStep)}
        canNavigateToStep={canNavigateToStep}
      />

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
          />
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
