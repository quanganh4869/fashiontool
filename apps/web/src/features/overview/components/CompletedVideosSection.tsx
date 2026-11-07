import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, RotateCcw, Video as VideoIcon } from 'lucide-react';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { CompletedVideo } from '@/types/overview';
import { formatRelativeTime, formatDuration } from '@/utils/formatters';
import { VideoPlayerDialog } from './VideoPlayerDialog';

export interface CompletedVideosSectionProps {
  videos: CompletedVideo[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const CompletedVideosSection: React.FC<CompletedVideosSectionProps> = ({
  videos,
  isLoading,
  error,
  onRetry,
}) => {
  const [selectedVideo, setSelectedVideo] = useState<CompletedVideo | null>(null);

  return (
    <section className="w-full bg-white border border-[#E8E5E0] rounded-xl flex flex-col overflow-hidden shadow-sm">
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-[#E8E5E0] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#242321]">Video mới hoàn thành</h2>
        <Link
          to="/library"
          className="text-sm font-medium text-[#74716D] hover:text-[#654B7B] focus:text-[#654B7B] transition-colors"
        >
          Mở thư viện
        </Link>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 min-h-[260px] flex flex-col justify-center">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex flex-col gap-2.5">
                <Skeleton className="w-full h-[200px] rounded-lg" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center flex flex-col items-center justify-center gap-2">
            <p className="text-sm text-[#A94442] font-medium">Không thể tải danh sách video</p>
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
        ) : videos.length === 0 ? (
          <EmptyState
            title="Chưa có video hoàn thành"
            description="Video được tạo thành công sẽ xuất hiện tại đây."
            className="border-none bg-transparent p-4 sm:p-6"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {videos.slice(0, 3).map((video) => (
              <div
                key={video.videoId}
                className="group flex flex-col gap-2.5 cursor-pointer"
                onClick={() => setSelectedVideo(video)}
              >
                {/* 9:16 Video Thumbnail Container */}
                <div className="relative w-full h-[200px] sm:h-[210px] rounded-lg overflow-hidden bg-[#242321] border border-[#E8E5E0] shadow-sm flex items-center justify-center">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-normal group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#97938E] gap-1.5">
                      <VideoIcon className="w-8 h-8" />
                      <span className="text-xs">Bản xem trước</span>
                    </div>
                  )}

                  {/* Overlay & Centered Monochrome Play Button */}
                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <button
                      type="button"
                      aria-label={`Xem video ${video.title}`}
                      className="w-11 h-11 rounded-full bg-white/90 hover:bg-white text-[#242321] shadow-md flex items-center justify-center transition-transform group-hover:scale-110"
                    >
                      <Play className="w-5 h-5 ml-0.5 fill-[#242321]" />
                    </button>
                  </div>

                  {/* Duration Badge if available */}
                  {video.durationSeconds && (
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 text-[11px] font-medium text-white tabular-nums">
                      {formatDuration(video.durationSeconds)}
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex flex-col gap-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[#242321] truncate group-hover:text-[#654B7B] transition-colors">
                    {video.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-[#74716D]">
                    <span className="truncate max-w-[65%]">
                      {video.productName || 'Không có tên sản phẩm'}
                    </span>
                    <span className="whitespace-nowrap shrink-0">
                      {formatRelativeTime(video.completedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      <VideoPlayerDialog
        video={selectedVideo}
        isOpen={Boolean(selectedVideo)}
        onClose={() => setSelectedVideo(null)}
      />
    </section>
  );
};
