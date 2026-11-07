import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useModelDetail } from '../hooks/useModelDetail';
import { useModelWizard } from '../hooks/useModelWizard';
import { modelManagementService } from '../services/model-management.service';
import { WizardStepKey } from '../types/model-management.types';

import { ModelSetupStepper } from '../components/ModelSetupStepper';
import { ModelIdentityStep } from '../components/ModelIdentityStep';
import { ModelPhotoStep } from '../components/ModelPhotoStep';
import { ModelReviewStep } from '../components/ModelReviewStep';
import { ModelExitConfirmDialog } from '../components/ModelExitConfirmDialog';
import { Skeleton } from '@/components/feedback/Skeleton';

export const ModelCreateWizardPage: React.FC = () => {
  const { modelId } = useParams<{ modelId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  // Determine current step from URL path
  const currentStepKey: WizardStepKey = location.pathname.endsWith('/photos')
    ? 'photos'
    : location.pathname.endsWith('/review')
      ? 'review'
      : 'identity';

  const { model, setModel, isLoading, error, reload } = useModelDetail(modelId);
  const { steps, canAccessPhotos, canAccessReview } =
    useModelWizard(model, currentStepKey);

  const [isSaving, setIsSaving] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Router Guards: enforce sequential prerequisite rules
  useEffect(() => {
    if (!model || isLoading) return;

    // If model is already finalized as READY, redirect out of setup wizard
    if (model.status === 'READY') {
      navigate(`/models/${model.modelId}`, { replace: true });
      return;
    }

    // Step 2 Guard: Cannot be on photos without completed identity
    if (currentStepKey === 'photos' && !canAccessPhotos) {
      navigate(`/models/${model.modelId}/setup/identity`, { replace: true });
      return;
    }

    // Step 3 Guard: Cannot be on review without completed photos + confirmations
    if (currentStepKey === 'review' && !canAccessReview) {
      navigate(
        canAccessPhotos
          ? `/models/${model.modelId}/setup/photos`
          : `/models/${model.modelId}/setup/identity`,
        { replace: true }
      );
    }
  }, [model, isLoading, currentStepKey, canAccessPhotos, canAccessReview, navigate]);

  // Handle Stepper item click
  const handleStepClick = (stepKey: WizardStepKey) => {
    if (!model) return;
    navigate(`/models/${model.modelId}/setup/${stepKey}`);
  };

  // Step 1: Save identity and proceed to photos
  const handleSaveIdentity = async (data: { displayName: string; description: string }) => {
    if (!modelId) return;
    setIsSaving(true);
    try {
      const updated = await modelManagementService.updateIdentity(modelId, data);
      setModel(updated);
      navigate(`/models/${modelId}/setup/photos`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu thông tin người mẫu.';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Step 2: Save photo confirmations and proceed to review
  const handleSavePhotos = async (confirmations: {
    sameModelConfirmed: boolean;
    usageRightsConfirmed: boolean;
  }) => {
    if (!modelId || !model) return;
    setIsSaving(true);
    try {
      // Update confirmations in model state
      setModel({
        ...model,
        sameModelConfirmed: confirmations.sameModelConfirmed,
        usageRightsConfirmed: confirmations.usageRightsConfirmed,
      });
      navigate(`/models/${modelId}/setup/review`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi chuyển sang bước kiểm tra.';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Step 2 actions: set cover, delete, reorder
  const handleSetCover = async (assetId: string) => {
    if (!modelId || !model) return;
    try {
      const updated = await modelManagementService.updateAssetsOrder(modelId, {
        assetIdsInOrder: model.referenceAssets.map((a) => a.assetId),
        coverAssetId: assetId,
      });
      setModel(updated);
      showToast('Đã đặt làm ảnh đại diện.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể thay đổi ảnh đại diện.';
      showToast(msg, 'error');
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!modelId) return;
    try {
      const updated = await modelManagementService.deleteAsset(modelId, assetId);
      setModel(updated);
      showToast('Đã xóa ảnh khỏi hồ sơ.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa ảnh.';
      showToast(msg, 'error');
    }
  };

  const handleMoveOrder = async (assetId: string, direction: 'left' | 'right') => {
    if (!modelId || !model) return;
    const currentList = [...model.referenceAssets];
    const index = currentList.findIndex((a) => a.assetId === assetId);
    if (index === -1) return;

    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    // Swap items
    const temp = currentList[index];
    currentList[index] = currentList[targetIndex];
    currentList[targetIndex] = temp;

    try {
      const updated = await modelManagementService.updateAssetsOrder(modelId, {
        assetIdsInOrder: currentList.map((a) => a.assetId),
        coverAssetId: model.coverAssetId || undefined,
      });
      setModel(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể đổi thứ tự ảnh.';
      showToast(msg, 'error');
    }
  };

  // Step 3: Finalize model (DRAFT -> READY)
  const handleFinalize = async () => {
    if (!modelId || !model) return;
    setIsSaving(true);
    try {
      const finalized = await modelManagementService.finalizeModel(modelId, {
        sameModelConfirmed: model.sameModelConfirmed,
        usageRightsConfirmed: model.usageRightsConfirmed,
      });
      setModel(finalized);
      showToast('Đã tạo hồ sơ người mẫu', 'success');
      navigate(`/models/${modelId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể hoàn tất hồ sơ người mẫu.';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 p-4">
        <Skeleton className="h-6 w-48 rounded" />
        <Skeleton className="h-10 w-80 rounded" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="w-full max-w-md mx-auto my-12 bg-white border border-[#E8E5E0] rounded-xl p-8 text-center flex flex-col items-center gap-3 shadow-sm">
        <p className="text-base font-semibold text-[#A94442]">Không thể tải hồ sơ người mẫu</p>
        <p className="text-xs text-[#74716D]">{error || 'Hồ sơ không tồn tại.'}</p>
        <Link
          to="/models"
          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#654B7B] rounded-md hover:bg-[#543C69] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay về thư viện người mẫu</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 font-sans pb-12">
      {/* 1. Breadcrumb */}
      <nav aria-label="Điều hướng phân cấp" className="flex items-center gap-1.5 text-xs text-[#74716D]">
        <button
          type="button"
          onClick={() => setShowExitDialog(true)}
          className="hover:text-[#654B7B] transition-colors"
        >
          Người mẫu
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-[#97938E]" />
        <span className="text-[#242321] font-medium">Tạo người mẫu</span>
      </nav>

      {/* 2. Page Title Header */}
      <div>
        <h1 className="text-[26px] sm:text-[28px] font-bold text-[#242321] tracking-tight">
          Tạo hồ sơ người mẫu
        </h1>
        <p className="text-sm text-[#74716D] mt-1.5 leading-relaxed">
          Thêm hình ảnh và thông tin để tạo một hồ sơ người mẫu có thể tái sử dụng.
        </p>
      </div>

      {/* 3. Stepper Navigation */}
      <ModelSetupStepper steps={steps} onStepClick={handleStepClick} />

      {/* 4. Active Step Content */}
      <main className="w-full">
        {currentStepKey === 'identity' && (
          <ModelIdentityStep
            model={model}
            onSaveAndContinue={handleSaveIdentity}
            onCancel={() => setShowExitDialog(true)}
            isSaving={isSaving}
          />
        )}

        {currentStepKey === 'photos' && (
          <ModelPhotoStep
            model={model}
            onBack={() => navigate(`/models/${model.modelId}/setup/identity`)}
            onSaveAndContinue={handleSavePhotos}
            onRefreshModel={reload}
            onSetCover={handleSetCover}
            onDeleteAsset={handleDeleteAsset}
            onMoveOrder={handleMoveOrder}
            isSaving={isSaving}
          />
        )}

        {currentStepKey === 'review' && (
          <ModelReviewStep
            model={model}
            onBack={() => navigate(`/models/${model.modelId}/setup/photos`)}
            onGoToIdentity={() => navigate(`/models/${model.modelId}/setup/identity`)}
            onGoToPhotos={() => navigate(`/models/${model.modelId}/setup/photos`)}
            onFinalize={handleFinalize}
            isFinalizing={isSaving}
          />
        )}
      </main>

      {/* Cancel Exit Confirmation Dialog */}
      <ModelExitConfirmDialog
        isOpen={showExitDialog}
        onClose={() => setShowExitDialog(false)}
        onConfirmExit={() => {
          setShowExitDialog(false);
          navigate('/models');
        }}
      />
    </div>
  );
};
