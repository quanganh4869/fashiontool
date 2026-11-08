import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ModelProfileDetail } from '../types/model-management.types';
import { validateModelName } from '../schemas/model-management.schemas';

export interface ModelIdentityStepProps {
  model: ModelProfileDetail;
  onSaveAndContinue: (data: { displayName: string; description?: string }) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export const ModelIdentityStep: React.FC<ModelIdentityStepProps> = ({
  model,
  onSaveAndContinue,
  onCancel,
  isSaving,
}) => {
  const initialName =
    model.displayName && model.displayName !== 'Bản nháp người mẫu'
      ? model.displayName
      : '';
  const [displayName, setDisplayName] = useState(initialName);
  const [nameError, setNameError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameValidation = validateModelName(displayName);
    if (!nameValidation.isValid) {
      setNameError(nameValidation.error || 'Tên người mẫu không hợp lệ.');
      return;
    }
    setNameError(null);

    await onSaveAndContinue({
      displayName: displayName.trim(),
      description: '',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full bg-white border border-[#E8E5E0] rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 pb-28">
      {/* Header of Step */}
      <div className="border-b border-[#E8E5E0] pb-4">
        <h2 className="text-xl font-bold text-[#242321]">Đặt tên người mẫu</h2>
        <p className="text-sm text-[#74716D] mt-1.5 leading-relaxed">
          Nhập tên đại diện cho hồ sơ người mẫu của bạn để dễ dàng nhận biết khi kết hợp với video mẫu trong các dự án.
        </p>
      </div>

      <div className="flex flex-col gap-5 max-w-2xl">
        {/* Model Display Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="model-name" className="text-sm font-semibold text-[#242321] flex items-center gap-1">
            <span>Tên người mẫu</span>
            <span className="text-[#A94442]">*</span>
          </label>
          <input
            id="model-name"
            type="text"
            required
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder="Ví dụ: Linh, Linh Lookbook, Model 01..."
            className={`w-full h-10 px-3.5 text-sm text-[#242321] placeholder:text-[#97938E] bg-white rounded-md border transition-colors ${
              nameError
                ? 'border-[#A94442] focus:border-[#A94442] focus:ring-2 focus:ring-[#A94442]/20'
                : 'border-[#D8D4CE] focus:border-[#654B7B] focus:ring-2 focus:ring-[#654B7B]/20'
            }`}
          />
          {nameError && (
            <p className="text-xs text-[#A94442] font-medium mt-0.5">{nameError}</p>
          )}
          <p className="text-xs text-[#74716D]">
            Sử dụng từ 2 đến 60 ký tự để nhận diện hồ sơ người mẫu.
          </p>
        </div>

        {/* Readonly Model Code */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#74716D]">
            Mã người mẫu (Tự động)
          </label>
          <div className="h-10 px-3.5 flex items-center bg-[#F6F5F2] border border-[#E8E5E0] rounded-md text-sm font-mono text-[#4B4945] select-all">
            {model.modelCode || 'Đang tạo mã...'}
          </div>
          <p className="text-xs text-[#74716D]">
            Mã định danh duy nhất do hệ thống quản lý, không thể thay đổi.
          </p>
        </div>
      </div>

      {/* Pinned Bottom Navigation */}
      <div className="fixed bottom-0 right-0 left-0 lg:left-[var(--sidebar-w,252px)] z-30 bg-white/95 backdrop-blur-md border-t border-[#E8E5E0] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-[left] duration-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-7 lg:px-8 py-3.5 flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSaving}
            className="text-xs font-medium"
          >
            Hủy tạo
          </Button>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
            disabled={isSaving || !displayName.trim()}
            className="text-xs font-medium px-5 shadow-sm"
          >
            Lưu và tiếp tục
          </Button>
        </div>
      </div>
    </form>
  );
};
