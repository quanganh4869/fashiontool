import { useMemo } from 'react';
import { ModelProfileDetail, WizardStepKey } from '../types/model-management.types';

export function useModelWizard(model: ModelProfileDetail | null, currentStep: WizardStepKey) {
  // Step completion status
  const isIdentityComplete = useMemo(() => {
    if (!model) return false;
    const name = model.displayName?.trim() || '';
    return name.length >= 2 && name !== 'Bản nháp người mẫu';
  }, [model]);

  const isPhotosComplete = useMemo(() => {
    if (!model) return false;
    return (
      model.referenceAssets.length > 0 &&
      model.sameModelConfirmed &&
      model.usageRightsConfirmed
    );
  }, [model]);

  const canAccessPhotos = isIdentityComplete;
  const canAccessReview = isIdentityComplete && isPhotosComplete;

  const canNavigateTo = (targetStep: WizardStepKey): boolean => {
    if (targetStep === 'identity') return true;
    if (targetStep === 'photos') return canAccessPhotos;
    if (targetStep === 'review') return canAccessReview;
    return false;
  };

  // Stepper definition
  const steps: Array<{
    key: WizardStepKey;
    stepNumber: number;
    title: string;
    isCompleted: boolean;
    isActive: boolean;
    isDisabled: boolean;
  }> = [
    {
      key: 'identity',
      stepNumber: 1,
      title: 'Thông tin người mẫu',
      isCompleted: isIdentityComplete && currentStep !== 'identity',
      isActive: currentStep === 'identity',
      isDisabled: false,
    },
    {
      key: 'photos',
      stepNumber: 2,
      title: 'Hình ảnh tham chiếu',
      isCompleted: isPhotosComplete && currentStep === 'review',
      isActive: currentStep === 'photos',
      isDisabled: !canAccessPhotos,
    },
    {
      key: 'review',
      stepNumber: 3,
      title: 'Kiểm tra và hoàn tất',
      isCompleted: model?.status === 'READY',
      isActive: currentStep === 'review',
      isDisabled: !canAccessReview,
    },
  ];

  return {
    steps,
    isIdentityComplete,
    isPhotosComplete,
    canAccessPhotos,
    canAccessReview,
    canNavigateTo,
  };
}
