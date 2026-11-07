import React, { useEffect, useState, useCallback } from 'react';
import {
  X,
  FolderKanban,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProjectDetail, ProjectSummary } from '../types/studio.types';
import { studioService } from '../services/studio.service';

interface ProjectHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (projectId: string) => void;
  onSelectGeneration: (generationId: string) => void;
  currentProjectId?: string | null;
}

export const ProjectHistoryDrawer: React.FC<ProjectHistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectProject,
  onSelectGeneration,
  currentProjectId,
}) => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async (projectId: string) => {
    try {
      setIsLoading(true);
      const detail = await studioService.getProjectDetail(projectId);
      setSelectedProjectDetail(detail);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải chi tiết dự án');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await studioService.listProjects();
      setProjects(list);

      // If currentProjectId is passed, load its details
      if (currentProjectId) {
        loadDetail(currentProjectId);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách dự án');
    } finally {
      setIsLoading(false);
    }
  }, [currentProjectId, loadDetail]);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen, loadProjects]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">
              {selectedProjectDetail ? selectedProjectDetail.name : 'Dự án video của bạn'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
              <p className="text-xs">Đang tải dữ liệu dự án...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          ) : selectedProjectDetail ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setSelectedProjectDetail(null)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                ← Quay lại danh sách tất cả dự án
              </button>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                <p className="font-semibold text-slate-800">{selectedProjectDetail.name}</p>
                <p className="text-slate-500">
                  Người mẫu: {selectedProjectDetail.modelName} • Video mẫu: {selectedProjectDetail.templateTitle}
                </p>
                <p className="text-slate-400 text-[11px]">
                  Tổng số phiên bản: {selectedProjectDetail.generations.length}
                </p>
              </div>

              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pt-2">
                Lịch sử các phiên bản sinh video
              </h4>

              <div className="space-y-2.5">
                {selectedProjectDetail.generations.map((gen, idx) => {
                  const statusConfig = studioService.getGenerationStatusConfig(gen.status);

                  return (
                    <div
                      key={gen.generationId}
                      onClick={() => {
                        onSelectGeneration(gen.generationId);
                        onClose();
                      }}
                      className="p-3 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          v{selectedProjectDetail.generations.length - idx}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-xs truncate">
                            {gen.currentStep || 'Tạo video cá nhân hóa'}
                          </p>
                          <span
                            className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.2 rounded ${statusConfig.bgClass} ${statusConfig.textClass}`}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <FolderKanban className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">Chưa có dự án nào</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Bắt đầu quy trình chọn người mẫu và video mẫu để tạo dự án đầu tiên.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((proj) => (
                <div
                  key={proj.projectId}
                  onClick={() => {
                    loadDetail(proj.projectId);
                    onSelectProject(proj.projectId);
                  }}
                  className="p-4 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl cursor-pointer transition-all space-y-2 shadow-xs group"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                      {proj.name}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">
                      {proj.totalGenerations} bản
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-1">
                    {proj.modelName} • {proj.templateTitle}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{new Date(proj.updatedAt).toLocaleDateString('vi-VN')}</span>
                    <span className="text-indigo-600 font-medium group-hover:underline flex items-center gap-0.5">
                      Xem chi tiết <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <Button variant="secondary" size="sm" onClick={onClose} className="w-full">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
