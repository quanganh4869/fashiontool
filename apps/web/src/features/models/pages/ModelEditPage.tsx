import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useModelDetail } from '../hooks/useModelDetail';
import { useModelUpload } from '../hooks/useModelUpload';
import { modelManagementService } from '../services/model-management.service';
import { validateModelName, validateModelDescription } from '../schemas/model-management.schemas';

import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { ModelPhotoUploader } from '../components/ModelPhotoUploader';
import { ModelPhotoItem } from '../components/ModelPhotoItem';
import { ModelPhotoGallery } from '../components/ModelPhotoGallery';
import { Skeleton } from '@/components/feedback/Skeleton';

export const ModelEditPage: React.FC = () => {
  const { modelId } = useParams<{ modelId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { model, setModel, isLoading, error, reload } = useModelDetail(modelId);

  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  useEffect(() => {
    if (model) {
      setDisplayName(model.displayName);
      setDescription(model.description || '');
    }
  }, [model]);

  const {
    queue,
    addFiles,
    retryUpload,
    removeQueueItem,
    isUploading,
  } = useModelUpload({
    modelId: modelId || '',
    currentPhotosCount: model?.referenceAssets.length || 0,
    onPhotoUploaded: reload,
    onUploadError: (msg) => showToast(msg, 'error'),
  });

  const handleNameChange = (val: string) => {
    setDisplayName(val);
    setHasFormChanges(true);
    if (nameError) setNameError(null);
  };

  const handleDescChange = (val: string) => {
    setDescription(val);
    setHasFormChanges(true);
    if (descError) setDescError(null);
  };

  const handleSetCover = async (assetId: string) => {
    if (!modelId || !model) return;
    try {
      const updated = await modelManagementService.updateAssetsOrder(modelId, {
        assetIdsInOrder: model.referenceAssets.map((a) => a.assetId),
        coverAssetId: assetId,
      });
      setModel(updated);
      showToast('Đã thay đổi ảnh đại diện.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể thay đổi ảnh đại diện.';
      showToast(msg, 'error');
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!modelId || !model) return;
    if (model.status === 'READY' && model.referenceAssets.length <= 1) {
      showToast(
        'Không thể xóa ảnh cuối cùng của hồ sơ đã sẵn sàng. Hãy tải ảnh thay thế trước.',
        'warning'
      );
      return;
    }

    try {
      const updated = await modelManagementService.deleteAsset(modelId, assetId);
      setModel(updated);
      showToast('Đã gỡ ảnh khỏi hồ sơ.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể gỡ ảnh.';
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
      const msg = err instanceof Error ? err.message : 'Không thể thay đổi thứ tự ảnh.';
      showToast(msg, 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelId) return;

    const nameValidation = validateModelName(displayName);
    if (!nameValidation.isValid) {
      setNameError(nameValidation.error || 'Tên người mẫu không hợp lệ.');
      return;
    }

    const descValidation = validateModelDescription(description);
    if (!descValidation.isValid) {
      setDescError(descValidation.error || 'Mô tả không hợp lệ.');
      return;
    }

    setIsSaving(true);
    try {
      await modelManagementService.updateModel(modelId, {
        displayName: displayName.trim(),
        description: description.trim(),
      });
      showToast('Đã cập nhật hồ sơ người mẫu', 'success');
      setHasFormChanges(false);
      navigate(`/models/${modelId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật hồ sơ người mẫu.';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasFormChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate(`/models/${modelId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 p-4">
        <Skeleton className="h-6 w-48 rounded" />
        <Skeleton className="h-10 w-80 rounded" />
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
        <Link to="/models" className="hover:text-[#654B7B] transition-colors">
          Người mẫu
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#97938E]" />
        <Link to={`/models/${model.modelId}`} className="hover:text-[#654B7B] transition-colors truncate max-w-xs">
          {model.displayName}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#97938E]" />
        <span className="text-[#242321] font-medium">Chỉnh sửa</span>
      </nav>

      {/* 2. Header */}
      <div>
        <h1 className="text-[26px] sm:text-[28px] font-bold text-[#242321] tracking-tight">
          Chỉnh sửa người mẫu
        </h1>
        <p className="text-sm text-[#74716D] mt-1.5 leading-relaxed">
          Cập nhật tên và hình ảnh tham chiếu của người mẫu.
        </p>
      </div>

      {/* 3. Edit Form */}
      <form onSubmit={handleSave} className="w-full bg-white border border-[#E8E5E0] rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col gap-5 max-w-2xl">
          {/* Display Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-name" className="text-sm font-semibold text-[#242321] flex items-center gap-1">
              <span>Tên người mẫu</span>
              <span className="text-[#A94442]">*</span>
            </label>
            <input
              id="edit-name"
              type="text"
              required
              value={displayName}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`w-full h-10 px-3.5 text-sm text-[#242321] bg-white rounded-md border transition-colors ${
                nameError
                  ? 'border-[#A94442] focus:border-[#A94442] focus:ring-2 focus:ring-[#A94442]/20'
                  : 'border-[#D8D4CE] focus:border-[#654B7B] focus:ring-2 focus:ring-[#654B7B]/20'
              }`}
            />
            {nameError && (
              <p className="text-xs text-[#A94442] font-medium mt-0.5">{nameError}</p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="edit-desc" className="text-sm font-semibold text-[#242321]">
                Mô tả hoặc ghi chú
              </label>
              <span className="text-xs text-[#74716D] tabular-nums">
                {description.length} / 500
              </span>
            </div>
            <textarea
              id="edit-desc"
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => handleDescChange(e.target.value)}
              className="w-full p-3 text-sm text-[#242321] bg-white rounded-md border border-[#D8D4CE] focus:border-[#654B7B] focus:ring-2 focus:ring-[#654B7B]/20 transition-colors resize-none"
            />
          </div>

          {/* Model Code (Readonly) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#74716D]">
              Mã hồ sơ (Chỉ đọc)
            </label>
            <div className="h-10 px-3.5 flex items-center bg-[#F6F5F2] border border-[#E8E5E0] rounded-md text-sm font-mono text-[#4B4945]">
              {model.modelCode}
            </div>
          </div>
        </div>

        {/* Section 4: Photo Management */}
        <div className="pt-6 border-t border-[#E8E5E0] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#242321]">
                Ảnh tham chiếu ({model.referenceAssets.length} / 20)
              </h3>
              <p className="text-xs text-[#74716D] mt-0.5">
                Thêm ảnh mới hoặc chọn ảnh đại diện. Nhấp vào menu trên ảnh để gỡ bỏ.
              </p>
            </div>
          </div>

          {/* Dropzone */}
          {model.referenceAssets.length < 20 && (
            <ModelPhotoUploader
              onFilesSelected={addFiles}
              disabled={isSaving || isUploading}
            />
          )}

          {/* Queue */}
          {queue.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#74716D]">
                Hàng đợi tải lên ({queue.length})
              </h4>
              <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
                {queue.map((item) => (
                  <ModelPhotoItem
                    key={item.id}
                    item={item}
                    onRetry={retryUpload}
                    onRemove={removeQueueItem}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Uploaded Gallery */}
          <ModelPhotoGallery
            assets={model.referenceAssets}
            coverAssetId={model.coverAssetId}
            onSetCover={handleSetCover}
            onDeleteAsset={handleDeleteAsset}
            onMoveOrder={handleMoveOrder}
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-[#E8E5E0] flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isSaving}
            className="text-xs font-medium"
          >
            Hủy thay đổi
          </Button>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
            disabled={isSaving || !displayName.trim()}
            className="text-xs font-medium px-5"
          >
            Lưu thay đổi
          </Button>
        </div>
      </form>

      {/* Unsaved Changes Guard Dialog */}
      <Dialog
        isOpen={showUnsavedDialog}
        onClose={() => setShowUnsavedDialog(false)}
        title="Bạn có thay đổi chưa được lưu."
        description="Những thay đổi hiện tại sẽ bị mất nếu bạn rời khỏi trang."
        confirmLabel="Rời khỏi trang"
        cancelLabel="Ở lại chỉnh sửa"
        onConfirm={() => {
          setShowUnsavedDialog(false);
          navigate(`/models/${modelId}`);
        }}
      />
    </div>
  );
};
