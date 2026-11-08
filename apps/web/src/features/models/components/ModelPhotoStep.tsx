import React, { useState } from 'react';
import { Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModelProfileDetail } from '../types/model-management.types';
import { useModelUpload } from '../hooks/useModelUpload';
import { ModelPhotoUploader } from './ModelPhotoUploader';
import { ModelPhotoItem } from './ModelPhotoItem';
import { ModelPhotoGallery } from './ModelPhotoGallery';

export interface ModelPhotoStepProps {
  model: ModelProfileDetail;
  onBack: () => void;
  onSaveAndContinue: (confirmations: {
    sameModelConfirmed: boolean;
    usageRightsConfirmed: boolean;
  }) => Promise<void>;
  onRefreshModel: () => void;
  onSetCover: (assetId: string) => void;
  onDeleteAsset: (assetId: string) => void;
  onMoveOrder: (assetId: string, direction: 'left' | 'right') => void;
  isSaving: boolean;
}

export const ModelPhotoStep: React.FC<ModelPhotoStepProps> = ({
  model,
  onBack,
  onSaveAndContinue,
  onRefreshModel,
  onSetCover,
  onDeleteAsset,
  onMoveOrder,
  isSaving,
}) => {
  const [sameModelConfirmed, setSameModelConfirmed] = useState(
    model.sameModelConfirmed || false
  );
  const [usageRightsConfirmed, setUsageRightsConfirmed] = useState(
    model.usageRightsConfirmed || false
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    queue,
    addFiles,
    retryUpload,
    removeQueueItem,
    isUploading,
  } = useModelUpload({
    modelId: model.modelId,
    currentPhotosCount: model.referenceAssets.length,
    onPhotoUploaded: onRefreshModel,
    onUploadError: (msg) => setValidationError(msg),
  });

  const totalAssetsCount = model.referenceAssets.length;
  const isContinueEnabled =
    totalAssetsCount >= 1 &&
    !isUploading &&
    sameModelConfirmed &&
    usageRightsConfirmed;

  const handleContinue = async () => {
    if (totalAssetsCount === 0) {
      setValidationError('Vui lòng tải lên ít nhất một ảnh người mẫu.');
      return;
    }
    if (isUploading) {
      setValidationError('Vui lòng chờ ảnh tải lên hoàn tất trước khi tiếp tục.');
      return;
    }
    if (!sameModelConfirmed) {
      setValidationError(
        'Vui lòng xác nhận tất cả ảnh trong hồ sơ này đều thuộc cùng một người mẫu.'
      );
      return;
    }
    if (!usageRightsConfirmed) {
      setValidationError(
        'Vui lòng xác nhận bạn có quyền sử dụng những hình ảnh này.'
      );
      return;
    }

    setValidationError(null);
    await onSaveAndContinue({
      sameModelConfirmed,
      usageRightsConfirmed,
    });
  };

  return (
    <div className="w-full bg-white border border-[#E8E5E0] rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 pb-28">
      {/* Header of Step */}
      <div className="border-b border-[#E8E5E0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-[#242321]">Hình ảnh tham chiếu</h2>
          <p className="text-sm text-[#74716D] mt-1.5 leading-relaxed">
            Tải lên những hình ảnh của cùng một người mẫu để hệ thống lưu thành một hồ sơ thống nhất.
          </p>
        </div>
        <div className="text-xs font-medium text-[#654B7B] bg-[#F2EDF5] px-3 py-1 rounded-full shrink-0 self-start sm:self-auto">
          {totalAssetsCount} / 20 ảnh đã tải
        </div>
      </div>

      {/* Upload Dropzone */}
      <ModelPhotoUploader
        onFilesSelected={addFiles}
        disabled={isSaving || totalAssetsCount >= 20}
      />

      {/* Upload Queue Section */}
      {queue.length > 0 && (
        <div className="flex flex-col gap-2 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#74716D]">
            Hàng đợi tải lên ({queue.length})
          </h4>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
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

      {/* Reference Photos Gallery */}
      {model.referenceAssets.length > 0 && (
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[#242321]">
              Ảnh tham chiếu trong hồ sơ ({model.referenceAssets.length})
            </h4>
            <span className="text-xs text-[#74716D]">
              Click vào menu trên ảnh để chọn ảnh đại diện hoặc xóa
            </span>
          </div>
          <ModelPhotoGallery
            assets={model.referenceAssets}
            coverAssetId={model.coverAssetId}
            onSetCover={onSetCover}
            onDeleteAsset={onDeleteAsset}
            onMoveOrder={onMoveOrder}
          />
        </div>
      )}

      {/* Guidance Callout */}
      <div className="p-3.5 bg-[#FAF9F7] border border-[#E8E5E0] rounded-lg flex items-start gap-3 text-xs text-[#4B4945]">
        <Info className="w-4 h-4 text-[#654B7B] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-[#242321]">Gợi ý: </span>
          Để sử dụng trong các video thời trang, nên cung cấp ảnh chân dung, ảnh toàn thân và thêm các góc nhìn khác nếu có.
        </div>
      </div>

      {/* Single Photo Warning if only 1 photo uploaded */}
      {totalAssetsCount === 1 && (
        <div className="p-3.5 bg-[#FDF6EB] border border-[#E5D7B7] rounded-lg flex items-start gap-3 text-xs text-[#9A6B26]">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            Hồ sơ hiện chỉ có 1 ảnh tham chiếu. Việc tái tạo người mẫu ở các góc quay hoặc dáng chuyển động khác nhau có thể bị giới hạn. Bạn có thể bổ sung thêm ảnh bất cứ lúc nào.
          </div>
        </div>
      )}

      {/* Mandatory Checkboxes */}
      <div className="pt-4 border-t border-[#E8E5E0] flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-[#242321]">
          Xác nhận bắt buộc <span className="text-[#A94442]">*</span>
        </h4>

        {/* Checkbox 1 */}
        <label className="flex items-start gap-3 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={sameModelConfirmed}
            onChange={(e) => {
              setSameModelConfirmed(e.target.checked);
              if (validationError) setValidationError(null);
            }}
            className="mt-1 w-4 h-4 rounded border-[#D8D4CE] text-[#654B7B] focus:ring-[#654B7B]/20 transition-colors"
          />
          <span className="text-xs sm:text-sm text-[#4B4945] leading-relaxed group-hover:text-[#242321]">
            Tôi xác nhận tất cả ảnh trong hồ sơ này đều thuộc cùng một người mẫu.
          </span>
        </label>

        {/* Checkbox 2 */}
        <label className="flex items-start gap-3 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={usageRightsConfirmed}
            onChange={(e) => {
              setUsageRightsConfirmed(e.target.checked);
              if (validationError) setValidationError(null);
            }}
            className="mt-1 w-4 h-4 rounded border-[#D8D4CE] text-[#654B7B] focus:ring-[#654B7B]/20 transition-colors"
          />
          <span className="text-xs sm:text-sm text-[#4B4945] leading-relaxed group-hover:text-[#242321]">
            Tôi có quyền sử dụng những hình ảnh này cho mục đích tạo nội dung trong TrendMotion Studio.
          </span>
        </label>

        {validationError && (
          <p className="text-xs text-[#A94442] font-medium mt-1">{validationError}</p>
        )}
      </div>

      {/* Pinned Bottom Navigation */}
      <div className="fixed bottom-0 right-0 left-0 lg:left-[var(--sidebar-w,252px)] z-30 bg-white/95 backdrop-blur-md border-t border-[#E8E5E0] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-[left] duration-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-7 lg:px-8 py-3.5 flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            disabled={isSaving}
            className="text-xs font-medium"
          >
            Quay lại
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleContinue}
            isLoading={isSaving}
            disabled={!isContinueEnabled || isSaving}
            className="text-xs font-medium px-5 shadow-sm"
          >
            Lưu và tiếp tục
          </Button>
        </div>
      </div>
    </div>
  );
};
