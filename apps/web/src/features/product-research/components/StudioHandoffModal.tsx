import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Video,
  AlertCircle,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { MarketplaceProductItem } from '../types/research.types';
import { researchService } from '../services/research.service';
import { studioService } from '@/features/studio/services/studio.service';
import { ProjectSummary } from '@/features/studio/types/studio.types';

export interface StudioHandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: MarketplaceProductItem | null;
}

export const StudioHandoffModal: React.FC<StudioHandoffModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    } else {
      setSelectedProjectId('');
      setError(null);
    }
  }, [isOpen]);

  const loadProjects = async () => {
    setIsLoadingProjects(true);
    setError(null);
    try {
      const list = await studioService.listProjects();
      setProjects(list);
      // Auto-select first project with completed base video if available
      const readyProj = list.find((p) => p.currentGenerationStatus === 'COMPLETED');
      if (readyProj) {
        setSelectedProjectId(readyProj.projectId);
      }
    } catch {
      // If error or empty, keep list empty
      setProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  if (!product) return null;

  const selectedProject = projects.find((p) => p.projectId === selectedProjectId);
  const hasReadyBaseVideo = selectedProject?.currentGenerationStatus === 'COMPLETED';

  const handleProceed = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await researchService.handoffToStudio(
        product.product_id,
        selectedProjectId || undefined
      );

      onClose();
      // Navigate to destination returned by backend
      navigate(res.target_route);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi chuyển sang Studio';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Đưa sản phẩm vào Fashion Studio"
      maxWidth="max-w-xl"
    >
      <div className="space-y-5 text-xs text-slate-700">
        {/* Product preview summary */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
          {product.primary_image_url ? (
            <img
              src={product.primary_image_url}
              alt={product.title}
              className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-slate-900 line-clamp-1">{product.title}</h4>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
              <span className="font-semibold text-indigo-600">
                {product.pricing.display_price}
              </span>
              <span>•</span>
              <span className="text-emerald-600 font-medium">
                Hoa hồng: {product.commission.rate_percent !== null ? `${product.commission.rate_percent}%` : 'N/A'}
                {product.commission.estimated_amount != null &&
                  ` (≈ ${Math.round(product.commission.estimated_amount || 0).toLocaleString('vi-VN')} đ)`}
              </span>
            </div>
          </div>
        </div>

        {/* Project Selection */}
        <div>
          <label className="block font-semibold text-slate-800 mb-2">
            Chọn Project đích trong Studio:
          </label>

          {isLoadingProjects ? (
            <div className="p-6 text-center text-slate-400">Đang tải danh sách Projects...</div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {/* Option to create a new project */}
              <label
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedProjectId === ''
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="project_selection"
                    checked={selectedProjectId === ''}
                    onChange={() => setSelectedProjectId('')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="font-semibold text-slate-800">Tạo Project mới trong Studio</div>
                      <div className="text-[11px] text-slate-500">
                        Bắt đầu quy trình chọn Model & Video Template để tạo Personalized Base Video
                      </div>
                    </div>
                  </div>
                </div>
              </label>

              {/* Existing projects list */}
              {projects.map((proj) => {
                const isCompleted = proj.currentGenerationStatus === 'COMPLETED';
                const isSelected = selectedProjectId === proj.projectId;

                return (
                  <label
                    key={proj.projectId}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="radio"
                        name="project_selection"
                        checked={isSelected}
                        onChange={() => setSelectedProjectId(proj.projectId)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate">{proj.name}</div>
                        <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                          <span>Người mẫu: {proj.modelName}</span>
                          <span>•</span>
                          <span>Template: {proj.templateTitle}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Base Video Sẵn sàng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <Video className="w-3 h-3" />
                          Chưa có Base Video
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Workflow Guidance according to AGENTS.md rule */}
        {selectedProjectId !== '' && !hasReadyBaseVideo && (
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Lưu ý quy tắc hệ thống:</strong> Project được chọn chưa có Personalized Base Video
              hoàn chỉnh. Theo quy trình AGENTS.md, hệ thống sẽ đưa bạn vào Studio để hoàn thành ghép
              người mẫu trước, sau đó thông tin sản phẩm này sẽ sẵn sàng cho bước Thay trang phục
              (Garment Replacement).
            </div>
          </div>
        )}

        {selectedProjectId !== '' && hasReadyBaseVideo && (
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Sẵn sàng thay trang phục:</strong> Project đã có Personalized Base Video hoàn chỉnh.
              Sản phẩm sẽ được đưa trực tiếp vào giao diện Thay trang phục để trích xuất Product Truth Sheet
              và tạo video thành phẩm.
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={handleProceed}
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm inline-flex items-center gap-1.5"
          >
            {isSubmitting ? (
              'Đang xử lý...'
            ) : (
              <>
                <span>Tiếp tục vào Studio</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
