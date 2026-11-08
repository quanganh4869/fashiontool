import React from 'react';
import { Sparkles, FolderKanban, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface StudioHeaderProps {
  onOpenProjects: () => void;
  onNewProject: () => void;
  activeProjectName?: string | null;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  onOpenProjects,
  onNewProject,
  activeProjectName,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Studio cá nhân hóa video
            </h1>
            <p className="text-sm text-slate-600">
              Ghép người mẫu vào video thời trang mẫu để tạo Personalized Base Video.
            </p>
          </div>
        </div>
        {activeProjectName && (
          <div className="mt-2 text-xs text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded inline-block font-medium">
            Dự án hiện tại: <span className="font-semibold">{activeProjectName}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={onOpenProjects}
        >
          <FolderKanban className="w-4 h-4 text-slate-500" />
          Dự án của tôi
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5 text-xs text-slate-700 hover:text-slate-900"
          onClick={onNewProject}
          title="Bắt đầu lại từ bước 1 để tạo video mới"
        >
          <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
          Làm dự án mới
        </Button>
      </div>
    </div>
  );
};
