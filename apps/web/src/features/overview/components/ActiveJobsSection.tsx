import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clapperboard, Sparkles, BarChart3, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ActiveJob } from '@/types/overview';
import { formatJobType, formatJobStatus } from '@/utils/formatters';

export interface ActiveJobsSectionProps {
  jobs: ActiveJob[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const ActiveJobsSection: React.FC<ActiveJobsSectionProps> = ({
  jobs,
  isLoading,
  error,
  onRetry,
}) => {
  const navigate = useNavigate();

  const getJobIcon = (type: ActiveJob['jobType']) => {
    switch (type) {
      case 'video_generation':
        return Clapperboard;
      case 'image_generation':
        return Sparkles;
      case 'channel_analysis':
        return BarChart3;
      default:
        return Sparkles;
    }
  };

  const handleJobClick = (job: ActiveJob) => {
    if (job.projectId) {
      navigate(`/studio/${job.projectId}/video`);
    } else if (job.jobType === 'channel_analysis') {
      navigate('/channels');
    }
  };

  return (
    <section className="w-full bg-white border border-[#E8E5E0] rounded-xl flex flex-col overflow-hidden shadow-sm">
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-[#E8E5E0] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#242321]">Tác vụ đang xử lý</h2>
        {jobs.length > 0 && (
          <span className="text-xs font-medium text-[#654B7B] bg-[#F2EDF5] px-2 py-0.5 rounded-full">
            {jobs.length} đang chạy
          </span>
        )}
      </div>

      {/* Content Area */}
      <div className="w-full flex-1 min-h-[260px] flex flex-col justify-center">
        {isLoading ? (
          <div className="p-5 flex flex-col gap-4">
            {[1, 2].map((n) => (
              <div key={n} className="flex flex-col gap-2 p-3 bg-[#FBFAF8] rounded-lg">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
                <Skeleton className="h-2 w-full rounded mt-1" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center flex flex-col items-center justify-center gap-2">
            <p className="text-sm text-[#A94442] font-medium">Không thể tải trạng thái tác vụ</p>
            <p className="text-xs text-[#74716D] max-w-xs">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#242321] bg-[#F6F5F2] hover:bg-[#EBE8E3] rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Không có tác vụ đang xử lý"
              description="Các tác vụ tạo ảnh, tạo video và phân tích đang chạy sẽ xuất hiện tại đây."
              className="border-none bg-transparent p-4 sm:p-6"
            />
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-3">
            {jobs.map((job) => {
              const Icon = getJobIcon(job.jobType);
              const hasPercentage =
                job.progress !== null && job.progress !== undefined && !isNaN(job.progress);

              return (
                <div
                  key={job.jobId}
                  onClick={() => handleJobClick(job)}
                  className="p-3.5 rounded-lg border border-[#E8E5E0] bg-[#FAF9F7] hover:bg-[#F2EDF5]/40 transition-colors cursor-pointer flex flex-col gap-2"
                >
                  {/* Line 1: Job Type Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#242321]">
                      <Icon className="w-4 h-4 text-[#654B7B] shrink-0" />
                      <span className="truncate">{formatJobType(job.jobType)}</span>
                    </div>
                    {hasPercentage && (
                      <span className="text-xs font-semibold text-[#654B7B] tabular-nums">
                        {Math.round(job.progress!)}%
                      </span>
                    )}
                  </div>

                  {/* Line 2: Related Resource Name */}
                  {job.relatedResourceName && (
                    <p className="text-xs text-[#4B4945] truncate font-medium">
                      {job.relatedResourceName}
                    </p>
                  )}

                  {/* Line 3: Actual Status */}
                  <div className="flex items-center justify-between text-xs text-[#74716D]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9A6B26] animate-pulse" />
                      {formatJobStatus(job.jobStatus)}
                    </span>
                  </div>

                  {/* Progress Bar: real percentage or indeterminate animation */}
                  <div className="w-full bg-[#E8E5E0] h-1.5 rounded-full overflow-hidden mt-0.5">
                    {hasPercentage ? (
                      <div
                        className="bg-[#654B7B] h-full transition-all duration-normal rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, job.progress!))}%` }}
                      />
                    ) : (
                      <div className="bg-[#654B7B]/70 h-full w-2/5 animate-indeterminate rounded-full" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
