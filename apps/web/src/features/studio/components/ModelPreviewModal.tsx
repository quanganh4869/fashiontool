import React from 'react';
import { X, User, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModelProfileSummary } from '@/features/models';

interface ModelPreviewModalProps {
  model: ModelProfileSummary | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ModelPreviewModal: React.FC<ModelPreviewModalProps> = ({
  model,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !model) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900 text-lg">Chi tiết người mẫu</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex gap-4 items-center">
            <div className="w-20 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
              {model.coverImageUrl ? (
                <img
                  src={model.coverImageUrl}
                  alt={model.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <User className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">{model.displayName}</h4>
              <p className="text-xs font-mono text-slate-500">Mã: {model.modelCode}</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Phiên bản {model.modelVersion}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                  <ImageIcon className="w-3.5 h-3.5" />
                  {model.referenceAssetsCount} ảnh tham chiếu
                </span>
              </div>
            </div>
          </div>

          {model.description && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-sm text-slate-600">
              {model.description}
            </div>
          )}

          <div className="border-t border-slate-100 pt-4 text-xs text-slate-500 space-y-1.5">
            <div className="flex justify-between">
              <span>Trạng thái hồ sơ:</span>
              <span className="font-semibold text-slate-800">{model.status}</span>
            </div>
            <div className="flex justify-between">
              <span>Đã dùng trong dự án:</span>
              <span className="font-semibold text-slate-800">{model.usedInProjectsCount} dự án</span>
            </div>
            <div className="flex justify-between">
              <span>Ngày cập nhật:</span>
              <span>{new Date(model.updatedAt).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
