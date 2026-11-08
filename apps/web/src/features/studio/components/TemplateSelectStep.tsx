import React, { useState } from 'react';
import {
  Clapperboard,
  Search,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Clock,
  Layers,
  AlertCircle,
  UploadCloud,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { TemplateSummary, TemplateCategory } from '@/features/library';
import { templateService } from '@/features/library/services/template.service';
import { TemplatePreviewDialog } from '@/features/library/components/TemplatePreviewDialog';
import { TemplateUploadModal } from '@/features/library/components/TemplateUploadModal';

interface TemplateSelectStepProps {
  templates: TemplateSummary[];
  categories: TemplateCategory[];
  selectedTemplate: TemplateSummary | null;
  onSelectTemplate: (template: TemplateSummary) => void;
  onBack: () => void;
  onNext: () => void;
  isLoading: boolean;
  error?: string | null;
  onRefreshTemplates?: () => void;
}

export const TemplateSelectStep: React.FC<TemplateSelectStepProps> = ({
  templates,
  categories,
  selectedTemplate,
  onSelectTemplate,
  onBack,
  onNext,
  isLoading,
  error,
  onRefreshTemplates,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewingTemplate, setPreviewingTemplate] = useState<TemplateSummary | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.templateCode.toLowerCase().includes(search.toLowerCase()) ||
      t.categoryName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || t.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-28">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">2. Chọn video thời trang mẫu</h2>
          <p className="text-sm text-slate-600">
            Chọn một video mẫu đã được xuất bản (Published) phù hợp với phong cách và tỉ lệ khung hình mong muốn.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="w-full sm:w-64 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none z-10" />
            <Input
              placeholder="Tìm theo tiêu đề, danh mục..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsUploadOpen(true)}
            className="flex-shrink-0"
          >
            <UploadCloud className="w-4 h-4 mr-1.5" />
            Tải lên video mới
          </Button>
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả danh mục
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <Skeleton className="w-full h-56 rounded-lg" />
              <Skeleton className="w-3/4 h-5" />
              <Skeleton className="w-1/2 h-4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-base font-semibold text-rose-900">Không thể tải danh sách video mẫu</h3>
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          <EmptyState
            icon={Clapperboard}
            title="Chưa có video mẫu nào trong thư viện"
            description="Cần có ít nhất một video mẫu đã được xuất bản để thực hiện cá nhân hóa."
          />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <EmptyState
            icon={Search}
            title="Không tìm thấy video mẫu"
            description={`Không có video nào khớp với bộ lọc hiện tại.`}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                }}
              >
                Đặt lại bộ lọc
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTemplates.map((template) => {
            const isSelected = selectedTemplate?.templateId === template.templateId;

            return (
              <div
                key={template.templateId}
                onClick={() => {
                  onSelectTemplate(template);
                  setPreviewingTemplate(template);
                }}
                className={`group relative bg-white rounded-xl border transition-all cursor-pointer overflow-hidden flex flex-col ${
                  isSelected
                    ? 'border-[#654B7B] ring-2 ring-[#654B7B]/20 shadow-md'
                    : 'border-[#E8E5E0] hover:border-[#654B7B]/70 hover:shadow-sm'
                }`}
              >
                {/* Poster & Direct Click Trigger */}
                <div className="relative aspect-[9/16] bg-[#F6F5F2] overflow-hidden">
                  {template.posterUrl ? (
                    <img
                      src={template.posterUrl}
                      alt={template.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                      <Clapperboard className="w-10 h-10 text-[#A19D97]" />
                      <span className="text-xs">Không có ảnh bìa</span>
                    </div>
                  )}

                  {/* Selected badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-[#654B7B] text-white rounded-full p-1 shadow-sm z-10">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}

                  {/* Aspect Ratio Badge */}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[11px] font-mono px-2 py-0.5 rounded">
                    {template.aspectRatio}
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {templateService.formatDuration(template.durationMs)}
                  </div>
                </div>

                {/* Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-[#654B7B] uppercase tracking-wider">
                      {template.categoryName}
                    </span>
                    <h3 className="font-semibold text-[#242321] text-sm line-clamp-2 mt-0.5">
                      {template.title}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#F0EFEA] flex items-center justify-between text-xs text-[#74716D]">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-[#654B7B]" />
                      {template.garmentSlotsSummary.length} vị trí đồ
                    </span>

                    <span className="text-[#654B7B] font-medium text-xs">
                      {isSelected ? 'Đã chọn' : 'Nhấp để xem'}
                    </span>
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
          <Button variant="secondary" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Quay lại: Chọn người mẫu
          </Button>

          <div className="flex items-center gap-4">
            {selectedTemplate ? (
              <p className="text-xs text-slate-700 hidden sm:block">
                Đã chọn video: <span className="font-semibold text-slate-950">{selectedTemplate.title}</span>
              </p>
            ) : (
              <p className="text-xs text-amber-700 font-medium hidden sm:block">
                Vui lòng chọn một video mẫu
              </p>
            )}

            <Button
              variant="primary"
              onClick={onNext}
              disabled={!selectedTemplate}
              className="gap-2 shadow-sm"
            >
              Tiếp tục: Kiểm tra tương thích
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <TemplatePreviewDialog
        template={previewingTemplate}
        isOpen={Boolean(previewingTemplate)}
        onClose={() => setPreviewingTemplate(null)}
        onSelect={onSelectTemplate}
      />

      <TemplateUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={(newTemplate) => {
          onSelectTemplate(newTemplate);
          if (onRefreshTemplates) {
            onRefreshTemplates();
          }
        }}
      />
    </div>
  );
};
