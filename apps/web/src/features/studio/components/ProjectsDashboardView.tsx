import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  User,
  Clapperboard,
  CheckCircle2,
  Loader2,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProjectSummary } from '../types/studio.types';
import { studioService } from '../services/studio.service';

interface ProjectsDashboardViewProps {
  onOpenProject: (project: ProjectSummary) => void;
  onCreateNewProject: () => void;
}

export const ProjectsDashboardView: React.FC<ProjectsDashboardViewProps> = ({
  onOpenProject,
  onCreateNewProject,
}) => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'ready' | 'processing'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await studioService.listProjects();
      setProjects(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách dự án');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc muốn xóa dự án "${projectName}" không?`)) {
      return;
    }

    try {
      setDeletingId(projectId);
      await studioService.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.projectId !== projectId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể xóa dự án');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      project.name.toLowerCase().includes(q) ||
      project.modelName.toLowerCase().includes(q) ||
      project.templateTitle.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    const isReady = Boolean(project.outputVideoUrl || project.currentGenerationStatus === 'COMPLETED');
    const isProcessing = project.currentGenerationStatus === 'PROCESSING';

    if (filterTab === 'ready') return isReady;
    if (filterTab === 'processing') return isProcessing;
    return true;
  });

  const readyCount = projects.filter(
    (p) => Boolean(p.outputVideoUrl) || p.currentGenerationStatus === 'COMPLETED'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Main Action */}
      <div className="bg-white border border-[#E8E5E0] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#654B7B]/10 border border-[#654B7B]/20 text-[#654B7B] flex items-center justify-center shrink-0">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-[#242321] tracking-tight">
              Studio Dự án Video
            </h1>
            <p className="text-sm text-[#74716D] max-w-2xl leading-relaxed">
              Chọn một dự án để xem lại Base Video, nhập sản phẩm thời trang, hoặc bấm tạo dự án mới để ghép người mẫu AI vào video mẫu.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="md"
            onClick={loadProjects}
            disabled={isLoading}
            className="gap-2"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#654B7B]' : 'text-[#74716D]'}`} />
            Làm mới
          </Button>

          <button
            type="button"
            onClick={onCreateNewProject}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#654B7B] hover:bg-[#523b65] shadow-sm transition-all hover:shadow active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo dự án mới
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A3A09B]" />
          <input
            type="text"
            placeholder="Tìm theo tên dự án, người mẫu, video..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#E8E5E0] rounded-xl text-sm text-[#242321] placeholder-[#A3A09B] focus:outline-none focus:ring-2 focus:ring-[#654B7B]/30 focus:border-[#654B7B] transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E8E5E0] rounded-xl text-xs font-medium text-[#74716D] w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === 'all'
                ? 'bg-[#654B7B] text-white shadow-xs font-semibold'
                : 'hover:text-[#242321] hover:bg-slate-50'
            }`}
          >
            Tất cả ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('ready')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === 'ready'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Sẵn sàng ({readyCount})
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3 bg-white border border-[#E8E5E0] rounded-2xl">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#654B7B]" />
          <p className="text-sm text-[#74716D]">Đang tải danh sách dự án video...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <p className="text-sm text-rose-700">{error}</p>
          <Button variant="secondary" size="sm" onClick={loadProjects}>
            Thử tải lại
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Create New Project CTA Card */}
          <div
            onClick={onCreateNewProject}
            className="group min-h-[220px] bg-white border-2 border-dashed border-[#D6D2CC] hover:border-[#654B7B] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:shadow-md hover:bg-[#FAF9F5]"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#654B7B]/10 border border-[#654B7B]/20 text-[#654B7B] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Plus className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-[#242321] group-hover:text-[#654B7B] transition-colors">
              Tạo dự án mới
            </h3>
            <p className="text-xs text-[#74716D] mt-1.5 max-w-xs leading-relaxed">
              Bắt đầu ghép người mẫu AI vào video mẫu mới từ thư viện
            </p>
          </div>

          {/* Existing Project Cards */}
          {filteredProjects.map((project) => {
            const isReady = Boolean(
              project.outputVideoUrl || project.currentGenerationStatus === 'COMPLETED'
            );
            const isProcessing = project.currentGenerationStatus === 'PROCESSING';
            const isDeleting = deletingId === project.projectId;

            return (
              <div
                key={project.projectId}
                onClick={() => onOpenProject(project)}
                className="group bg-white border border-[#E8E5E0] hover:border-[#654B7B] rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-md cursor-pointer relative"
              >
                <div className="space-y-3.5">
                  {/* Card Header: Title + Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-[#242321] group-hover:text-[#654B7B] truncate transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-[11px] text-[#A3A09B] mt-0.5">
                        Mã DA: {project.projectId.slice(0, 8)}...
                      </p>
                    </div>

                    {isReady ? (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Base Video sẵn sàng
                      </span>
                    ) : isProcessing ? (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Đang xử lý
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                        Bản nháp
                      </span>
                    )}
                  </div>

                  {/* Model & Template Meta */}
                  <div className="space-y-2 py-2 border-y border-[#F0EFEA] text-xs text-[#74716D]">
                    <div className="flex items-center gap-2 truncate">
                      <User className="w-3.5 h-3.5 text-[#654B7B] shrink-0" />
                      <span className="truncate">
                        Người mẫu: <strong className="text-[#242321]">{project.modelName}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Clapperboard className="w-3.5 h-3.5 text-[#654B7B] shrink-0" />
                      <span className="truncate">
                        Video mẫu: <strong className="text-[#242321]">{project.templateTitle}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Date + Delete Button (Clicking anywhere on card opens project) */}
                <div className="pt-3.5 flex items-center justify-between border-t border-[#F0EFEA] text-[11px] text-[#A3A09B]">
                  <span>
                    Cập nhật: {new Date(project.updatedAt).toLocaleDateString('vi-VN')}
                  </span>

                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={(e) => handleDeleteProject(e, project.projectId, project.name)}
                    className="p-1.5 text-[#A3A09B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Xóa dự án"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty Filter State */}
      {!isLoading && !error && filteredProjects.length === 0 && projects.length > 0 && (
        <div className="text-center py-12 bg-white border border-[#E8E5E0] rounded-2xl p-6 space-y-3">
          <p className="text-sm text-[#74716D]">Không tìm thấy dự án nào khớp với điều kiện tìm kiếm.</p>
          <Button variant="secondary" size="sm" onClick={() => { setSearchQuery(''); setFilterTab('all'); }}>
            Xóa bộ lọc
          </Button>
        </div>
      )}
    </div>
  );
};
