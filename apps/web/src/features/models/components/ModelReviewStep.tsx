import React from 'react';
import { Edit2, CheckCircle2, Star, UserRound, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModelProfileDetail } from '../types/model-management.types';

export interface ModelReviewStepProps {
  model: ModelProfileDetail;
  onBack: () => void;
  onGoToIdentity: () => void;
  onGoToPhotos: () => void;
  onFinalize: () => Promise<void>;
  isFinalizing: boolean;
}

export const ModelReviewStep: React.FC<ModelReviewStepProps> = ({
  model,
  onBack,
  onGoToIdentity,
  onGoToPhotos,
  onFinalize,
  isFinalizing,
}) => {
  const coverAsset =
    model.referenceAssets.find((a) => a.assetId === model.coverAssetId) ||
    model.referenceAssets[0];

  return (
    <div className="w-full bg-white border border-[#E8E5E0] rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
      {/* Header of Step */}
      <div className="border-b border-[#E8E5E0] pb-4">
        <h2 className="text-xl font-bold text-[#242321]">Kiểm tra hồ sơ người mẫu</h2>
        <p className="text-sm text-[#74716D] mt-1.5 leading-relaxed">
          Kiểm tra lại thông tin và ảnh tham chiếu trước khi hoàn tất.
        </p>
      </div>

      {/* Top Profile Summary Card */}
      <div className="p-4 sm:p-5 bg-[#FAF9F7] border border-[#E8E5E0] rounded-xl flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="w-24 h-32 rounded-lg bg-white border border-[#E8E5E0] overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
          {coverAsset ? (
            <img
              src={coverAsset.thumbnailUrl || coverAsset.viewUrl}
              alt={model.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <UserRound className="w-8 h-8 text-[#97938E]" />
          )}
        </div>

        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F2EDF5] text-[#654B7B] mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Đang hoàn tất bản nháp</span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-[#242321] truncate">
            {model.displayName}
          </h3>
          <p className="text-xs font-mono text-[#74716D] mt-0.5">{model.modelCode}</p>

          {model.description && (
            <p className="text-xs text-[#4B4945] mt-2 line-clamp-2 leading-relaxed">
              {model.description}
            </p>
          )}
        </div>
      </div>

      {/* Section 1: Thông tin cơ bản */}
      <div className="pt-2 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[#E8E5E0] pb-2">
          <h4 className="text-sm font-semibold text-[#242321]">Thông tin cơ bản</h4>
          <button
            type="button"
            onClick={onGoToIdentity}
            className="text-xs font-medium text-[#654B7B] hover:text-[#543C69] flex items-center gap-1 transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            <span>Chỉnh sửa thông tin</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[#74716D]">Tên người mẫu:</span>
            <p className="font-semibold text-[#242321] text-sm mt-0.5">
              {model.displayName}
            </p>
          </div>
          <div>
            <span className="text-[#74716D]">Mã hồ sơ:</span>
            <p className="font-mono font-medium text-[#242321] text-sm mt-0.5">
              {model.modelCode}
            </p>
          </div>
          {model.description && (
            <div className="sm:col-span-2">
              <span className="text-[#74716D]">Ghi chú:</span>
              <p className="text-[#4B4945] mt-0.5 leading-relaxed">{model.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Hình ảnh tham chiếu */}
      <div className="pt-2 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[#E8E5E0] pb-2">
          <h4 className="text-sm font-semibold text-[#242321]">
            Hình ảnh tham chiếu ({model.referenceAssets.length})
          </h4>
          <button
            type="button"
            onClick={onGoToPhotos}
            className="text-xs font-medium text-[#654B7B] hover:text-[#543C69] flex items-center gap-1 transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            <span>Chỉnh sửa ảnh</span>
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {model.referenceAssets.map((asset) => {
            const isCover =
              asset.assetId === model.coverAssetId ||
              asset.assetId === coverAsset?.assetId;

            return (
              <div
                key={asset.assetId}
                className={`relative aspect-[3/4] rounded-lg overflow-hidden border bg-[#F6F5F2] ${
                  isCover ? 'border-[#654B7B] ring-2 ring-[#654B7B]/20' : 'border-[#E8E5E0]'
                }`}
              >
                <img
                  src={asset.thumbnailUrl || asset.viewUrl}
                  alt={asset.originalFilename}
                  className="w-full h-full object-cover"
                />
                {isCover && (
                  <div className="absolute top-1.5 left-1.5">
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#654B7B] text-white">
                      <Star className="w-2.5 h-2.5 fill-white" />
                      <span>Cover</span>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Xác nhận sử dụng */}
      <div className="pt-2 flex flex-col gap-2.5">
        <h4 className="text-sm font-semibold text-[#242321]">Xác nhận sử dụng</h4>
        <div className="flex flex-col gap-2 text-xs text-[#367458] bg-[#EBF5F0] p-3.5 rounded-lg border border-[#367458]/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#367458]" />
            <span>Đã xác nhận tất cả ảnh trong hồ sơ thuộc cùng một người mẫu.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#367458]" />
            <span>Đã xác nhận có quyền sử dụng những hình ảnh này trong TrendMotion Studio.</span>
          </div>
        </div>
      </div>

      {/* Note Callout */}
      <p className="text-xs text-[#74716D] italic">
        Sau khi hoàn tất, hồ sơ này sẽ được lưu trong thư viện người mẫu và có thể được tái sử dụng trong nhiều dự án video.
      </p>

      {/* Action Buttons */}
      <div className="pt-6 border-t border-[#E8E5E0] flex items-center justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={isFinalizing}
          className="text-xs font-medium"
        >
          Quay lại
        </Button>

        <Button
          type="button"
          variant="primary"
          onClick={onFinalize}
          isLoading={isFinalizing}
          disabled={isFinalizing}
          className="text-xs font-medium px-5"
        >
          Hoàn tất hồ sơ người mẫu
        </Button>
      </div>
    </div>
  );
};
