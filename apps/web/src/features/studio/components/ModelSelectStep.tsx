import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Search,
  CheckCircle2,
  Eye,
  PlusCircle,
  Image as ImageIcon,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ModelProfileSummary } from '@/features/models';
import { ModelPreviewModal } from './ModelPreviewModal';

interface ModelSelectStepProps {
  models: ModelProfileSummary[];
  selectedModel: ModelProfileSummary | null;
  onSelectModel: (model: ModelProfileSummary) => void;
  onNext: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const ModelSelectStep: React.FC<ModelSelectStepProps> = ({
  models,
  selectedModel,
  onSelectModel,
  onNext,
  isLoading,
  error,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [previewingModel, setPreviewingModel] = useState<ModelProfileSummary | null>(null);

  const filteredModels = models.filter((m) =>
    m.displayName.toLowerCase().includes(search.toLowerCase()) ||
    m.modelCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-28">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">1. Chọn hồ sơ người mẫu</h2>
          <p className="text-sm text-slate-600">
            Chọn một hồ sơ người mẫu đã lưu để đưa vào video mẫu. Bạn có thể kiểm tra ảnh tham chiếu trước khi xác nhận.
          </p>
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none z-10" />
          <Input
            placeholder="Tìm theo tên hoặc mã người mẫu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <Skeleton className="w-full h-48 rounded-lg" />
              <Skeleton className="w-3/4 h-5" />
              <Skeleton className="w-1/2 h-4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-base font-semibold text-rose-900">Không thể tải danh sách người mẫu</h3>
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      ) : models.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          <EmptyState
            icon={User}
            title="Chưa có hồ sơ người mẫu nào"
            description="Bạn cần có ít nhất một hồ sơ người mẫu đã hoàn thiện để thực hiện cá nhân hóa video."
            action={
              <Button
                variant="primary"
                onClick={() => navigate('/models')}
                className="gap-2 mt-2"
              >
                <PlusCircle className="w-4 h-4" />
                Đến Quản lý người mẫu
              </Button>
            }
          />
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <EmptyState
            icon={Search}
            title="Không tìm thấy người mẫu"
            description={`Không có kết quả nào khớp với "${search}". Vui lòng thử từ khóa khác.`}
            action={
              <Button variant="secondary" size="sm" onClick={() => setSearch('')}>
                Xóa tìm kiếm
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredModels.map((model) => {
            const isSelected = selectedModel?.modelId === model.modelId;

            return (
              <div
                key={model.modelId}
                onClick={() => onSelectModel(model)}
                className={`group relative bg-white rounded-xl border transition-all cursor-pointer overflow-hidden flex flex-col ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {/* Image Cover */}
                <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                  {model.coverImageUrl ? (
                    <img
                      src={model.coverImageUrl}
                      alt={model.displayName}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                      <User className="w-12 h-12" />
                      <span className="text-xs">Chưa có ảnh bìa</span>
                    </div>
                  )}

                  {/* Selected check badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1 shadow-sm">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}

                  {/* Version tag */}
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded">
                    v{model.modelVersion}
                  </div>

                  {/* Reference count */}
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    {model.referenceAssetsCount} ảnh
                  </div>
                </div>

                {/* Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {model.displayName}
                    </h3>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">
                      {model.modelCode}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span
                      className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                        model.status === 'READY'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {model.status === 'READY' ? 'Sẵn sàng' : model.status}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewingModel(model);
                      }}
                      className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 p-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pinned Bottom Navigation */}
      <div className="fixed bottom-0 right-0 left-0 lg:left-[var(--sidebar-w,252px)] z-30 bg-white/95 backdrop-blur-md border-t border-[#E8E5E0] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-[left] duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-7 lg:px-8 py-3.5 flex items-center justify-between">
          <div>
            {selectedModel ? (
              <p className="text-xs text-slate-700">
                Đã chọn người mẫu: <span className="font-semibold text-slate-950">{selectedModel.displayName}</span>
              </p>
            ) : (
              <p className="text-xs text-amber-700 font-medium">
                Vui lòng chọn một người mẫu để tiếp tục
              </p>
            )}
          </div>

          <Button
            variant="primary"
            onClick={onNext}
            disabled={!selectedModel}
            className="gap-2 shadow-sm"
          >
            Tiếp tục: Chọn video mẫu
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ModelPreviewModal
        model={previewingModel}
        isOpen={Boolean(previewingModel)}
        onClose={() => setPreviewingModel(null)}
      />
    </div>
  );
};
