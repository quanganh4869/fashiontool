import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ModelProfileSummary, modelManagementService } from '@/features/models';
import { TemplateSummary, TemplateCategory } from '@/features/library';
import { templateService } from '@/features/library/services/template.service';
import {
  CompatibilityCheckResponse,
  ModelTemplateGeneration,
  StudioStep,
} from '../types/studio.types';
import { studioService } from '../services/studio.service';

export function useStudio() {
  const { projectId: routeProjectId, step: routeStep } = useParams<{
    projectId?: string;
    step?: string;
  }>();

  // Core navigation state
  const [step, setStep] = useState<StudioStep>('model');

  // Catalogs
  const [models, setModels] = useState<ModelProfileSummary[]>([]);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Selected entities
  const [selectedModel, setSelectedModel] = useState<ModelProfileSummary | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateSummary | null>(null);

  // Compatibility assessment
  const [compatibility, setCompatibility] = useState<CompatibilityCheckResponse | null>(null);
  const [isCheckingCompat, setIsCheckingCompat] = useState(false);
  const [compatError, setCompatError] = useState<string | null>(null);

  // Active Job & Project
  const [generation, setGeneration] = useState<ModelTemplateGeneration | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(routeProjectId || null);
  const [activeProjectName, setActiveProjectName] = useState<string | null>(null);

  // Operation flags
  const [isCreatingGeneration, setIsCreatingGeneration] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Polling ref
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Initial Load of Models & Templates
  const loadCatalogs = useCallback(async () => {
    try {
      setIsLoadingCatalogs(true);
      setCatalogError(null);

      const [modelsRes, templatesRes, categoriesRes] = await Promise.all([
        modelManagementService.listModels({ limit: 50 }).catch(() => ({ items: [] })),
        templateService.listTemplates({ limit: 50 }).catch(() => ({ items: [] })),
        templateService.listCategories().catch(() => []),
      ]);

      setModels(modelsRes.items);
      setTemplates(templatesRes.items);
      setCategories(categoriesRes);
    } catch (err: unknown) {
      setCatalogError(err instanceof Error ? err.message : 'Lỗi khi tải danh mục dữ liệu');
    } finally {
      setIsLoadingCatalogs(false);
    }
  }, []);

  useEffect(() => {
    loadCatalogs();
  }, [loadCatalogs]);

  // Sync route step if provided
  useEffect(() => {
    if (
      routeStep &&
      ['model', 'template', 'confirm', 'processing', 'result', 'products', 'replacement'].includes(
        routeStep
      )
    ) {
      setStep(routeStep as StudioStep);
    }
  }, [routeStep]);

  // 2. Compatibility check whenever model and template are both chosen and user is at confirm step
  const evaluateCompatibility = useCallback(async () => {
    if (!selectedModel || !selectedTemplate) return;

    try {
      setIsCheckingCompat(true);
      setCompatError(null);
      const res = await studioService.checkCompatibility(
        selectedModel.modelId,
        selectedTemplate.templateId
      );
      setCompatibility(res);
    } catch (err: unknown) {
      setCompatError(err instanceof Error ? err.message : 'Không thể đánh giá tương thích');
    } finally {
      setIsCheckingCompat(false);
    }
  }, [selectedModel, selectedTemplate]);

  useEffect(() => {
    if (step === 'confirm' && selectedModel && selectedTemplate) {
      evaluateCompatibility();
    }
  }, [step, selectedModel, selectedTemplate, evaluateCompatibility]);

  // 3. Polling logic for background generation
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (step === 'processing' && generation && !['COMPLETED', 'FAILED', 'CANCELLED'].includes(generation.status)) {
      stopPolling();
      pollingRef.current = setInterval(async () => {
        try {
          const updated = await studioService.getGeneration(generation.generationId);
          setGeneration(updated);

          if (updated.status === 'COMPLETED') {
            stopPolling();
            setStep('result');
          } else if (updated.status === 'FAILED' || updated.status === 'CANCELLED') {
            stopPolling();
          }
        } catch {
          // Keep polling unless explicit cancel
        }
      }, 1500);
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [step, generation, stopPolling]);

  // 4. Actions
  const handleSelectModel = (model: ModelProfileSummary) => {
    setSelectedModel(model);
    setCompatibility(null);
  };

  const handleSelectTemplate = (template: TemplateSummary) => {
    setSelectedTemplate(template);
    setCompatibility(null);
  };

  const handleStartGeneration = async (
    projectName: string,
    confirmedLimitations: boolean
  ) => {
    if (!selectedModel || !selectedTemplate) return;

    try {
      setIsCreatingGeneration(true);
      const gen = await studioService.createGeneration({
        modelId: selectedModel.modelId,
        templateId: selectedTemplate.templateId,
        projectId: activeProjectId,
        projectName: projectName.trim() || undefined,
        confirmedLimitations,
      });

      setGeneration(gen);
      setActiveProjectId(gen.projectId);
      setActiveProjectName(gen.projectName);
      setStep('processing');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể khởi tạo job tạo video');
    } finally {
      setIsCreatingGeneration(false);
    }
  };

  const handleCancelGeneration = async () => {
    if (!generation) return;
    try {
      setIsCancelling(true);
      const updated = await studioService.cancelGeneration(generation.generationId);
      setGeneration(updated);
      stopPolling();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể hủy tiến trình');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRetryGeneration = async () => {
    if (!generation) return;
    try {
      setIsRetrying(true);
      const updated = await studioService.retryGeneration(generation.generationId);
      setGeneration(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể thử lại');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleLoadGeneration = async (genId: string) => {
    try {
      const gen = await studioService.getGeneration(genId);
      setGeneration(gen);
      setActiveProjectId(gen.projectId);
      setActiveProjectName(gen.projectName);

      // Match model and template in memory if present
      const foundModel = models.find((m) => m.modelId === gen.modelId);
      if (foundModel) setSelectedModel(foundModel);

      const foundTemplate = templates.find((t) => t.templateId === gen.templateId);
      if (foundTemplate) setSelectedTemplate(foundTemplate);

      if (gen.status === 'COMPLETED') {
        setStep('result');
      } else {
        setStep('processing');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể tải chi tiết phiên bản');
    }
  };

  const handleResetToNew = () => {
    setSelectedModel(null);
    setSelectedTemplate(null);
    setCompatibility(null);
    setGeneration(null);
    setActiveProjectId(null);
    setActiveProjectName(null);
    setStep('model');
  };

  const canNavigateToStep = (targetStep: StudioStep): boolean => {
    if (targetStep === 'model') return true;
    if (targetStep === 'template') return Boolean(selectedModel);
    if (targetStep === 'confirm') return Boolean(selectedModel && selectedTemplate);
    if (targetStep === 'processing') return Boolean(generation);
    if (targetStep === 'result') return Boolean(generation && generation.status === 'COMPLETED');
    if (targetStep === 'products') return Boolean(generation && generation.status === 'COMPLETED');
    if (targetStep === 'replacement') return Boolean(generation && generation.status === 'COMPLETED');
    return false;
  };

  return {
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
  };
}
