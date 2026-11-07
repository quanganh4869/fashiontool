import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MoreHorizontal, ExternalLink, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { RecentProject } from '@/types/overview';
import {
  formatRelativeTime,
  formatProjectStep,
  formatProjectStatus,
} from '@/utils/formatters';

export interface RecentProjectsSectionProps {
  projects: RecentProject[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const RecentProjectsSection: React.FC<RecentProjectsSectionProps> = ({
  projects,
  isLoading,
  error,
  onRetry,
}) => {
  const navigate = useNavigate();

  const handleRowClick = (project: RecentProject) => {
    navigate(`/studio/${project.projectId}/${project.currentStep}`);
  };

  return (
    <section className="w-full bg-white border border-[#E8E5E0] rounded-xl flex flex-col overflow-hidden shadow-sm">
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-[#E8E5E0] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#242321]">Dự án gần đây</h2>
        <Link
          to="/studio"
          className="text-sm font-medium text-[#74716D] hover:text-[#654B7B] focus:text-[#654B7B] transition-colors inline-flex items-center gap-1"
        >
          <span>Mở Studio</span>
        </Link>
      </div>

      {/* Content Area */}
      <div className="w-full flex-1 min-h-[260px] flex flex-col justify-center">
        {isLoading ? (
          <div className="p-5 flex flex-col gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-4">
                <Skeleton className="w-[52px] h-[64px] rounded-md shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-4 w-1/3 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
                <Skeleton className="h-4 w-24 rounded hidden sm:block" />
                <Skeleton className="h-4 w-16 rounded hidden md:block" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
            <p className="text-sm text-[#A94442] font-medium">Không thể tải danh sách dự án</p>
            <p className="text-xs text-[#74716D] max-w-sm">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#242321] bg-[#F6F5F2] hover:bg-[#EBE8E3] rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Chưa có dự án nào"
              description="Các dự án bạn thực hiện trong Studio sẽ xuất hiện tại đây."
              className="border-none bg-transparent p-4 sm:p-6"
            />
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm font-sans border-collapse">
              <thead>
                <tr className="border-b border-[#E8E5E0] bg-[#FBFAF8] text-xs font-medium text-[#74716D]">
                  <th className="py-2.5 px-4 pl-5">Dự án & Sản phẩm</th>
                  <th className="py-2.5 px-4 hidden sm:table-cell">Cập nhật</th>
                  <th className="py-2.5 px-4 hidden md:table-cell">Giai đoạn</th>
                  <th className="py-2.5 px-4">Trạng thái</th>
                  <th className="py-2.5 px-4 pr-5 text-right w-12">
                    <span className="sr-only">Hành động</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E5E0]">
                {projects.slice(0, 5).map((project) => {
                  const statusInfo = formatProjectStatus(project.projectStatus);

                  return (
                    <tr
                      key={project.projectId}
                      onClick={() => handleRowClick(project)}
                      className="group cursor-pointer transition-colors duration-fast hover:bg-[#FBFAF8]"
                    >
                      {/* Project info & Thumbnail */}
                      <td className="py-3 px-4 pl-5">
                        <div className="flex items-center gap-3">
                          <div className="w-[52px] h-[64px] rounded-md bg-[#F6F5F2] border border-[#E8E5E0] overflow-hidden shrink-0 flex items-center justify-center">
                            {project.thumbnailUrl ? (
                              <img
                                src={project.thumbnailUrl}
                                alt={project.projectName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-[#97938E]" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs md:max-w-md">
                            <h3 className="text-sm font-semibold text-[#242321] truncate group-hover:text-[#654B7B] transition-colors">
                              {project.projectName}
                            </h3>
                            <p className="text-xs text-[#74716D] truncate mt-0.5">
                              {project.productName || 'Chưa liên kết sản phẩm'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Last Updated */}
                      <td className="py-3 px-4 hidden sm:table-cell text-xs text-[#74716D] whitespace-nowrap">
                        {formatRelativeTime(project.updatedAt)}
                      </td>

                      {/* Step */}
                      <td className="py-3 px-4 hidden md:table-cell text-xs font-medium text-[#4B4945] whitespace-nowrap">
                        {formatProjectStep(project.currentStep)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-xs font-medium ${statusInfo.textColor}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Actions Menu */}
                      <td
                        className="py-3 px-4 pr-5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu
                          align="right"
                          trigger={
                            <button
                              type="button"
                              aria-label={`Hành động cho dự án ${project.projectName}`}
                              className="w-8 h-8 rounded flex items-center justify-center text-[#74716D] hover:text-[#242321] hover:bg-[#F2EDF5] transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          }
                        >
                          <DropdownMenuItem
                            label="Mở trong Studio"
                            icon={ExternalLink}
                            onClick={() =>
                              navigate(`/studio/${project.projectId}/${project.currentStep}`)
                            }
                          />
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
