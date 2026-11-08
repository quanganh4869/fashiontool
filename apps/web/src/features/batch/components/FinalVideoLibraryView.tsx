import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderKanban,
  Search,
  Download,
  Play,
  SplitSquareVertical,
  Archive,
  RefreshCw,
  CheckCircle2,
  Film,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FinalVideoItem, BatchProductionGroup } from '../types/batch.types';
import { batchService } from '../services/batch.service';
import { ModelTemplateGeneration } from '@/features/studio/types/studio.types';

export interface FinalVideoLibraryViewProps {
  generation: ModelTemplateGeneration;
  onOpenVideoDetail: (video: FinalVideoItem) => void;
  onOpenCompare: (video: FinalVideoItem) => void;
  onNewBatchClick?: () => void;
}

export const FinalVideoLibraryView: React.FC<FinalVideoLibraryViewProps> = ({
  generation,
  onOpenVideoDetail,
  onOpenCompare,
  onNewBatchClick,
}) => {
  const projectId = generation.projectId;

  const [videos, setVideos] = useState<FinalVideoItem[]>([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [qualityFilter, setQualityFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'created_at' | 'product_title'>('created_at');
  const [includeArchived, setIncludeArchived] = useState(false);

  // Available batches for filter dropdown
  const [batches, setBatches] = useState<BatchProductionGroup[]>([]);
  const [isExportingZip, setIsExportingZip] = useState(false);

  // 1. Fetch batches
  useEffect(() => {
    if (!projectId) return;
    batchService.listBatches(projectId).then(setBatches).catch(console.error);
  }, [projectId]);

  // 2. Load videos
  const loadVideos = useCallback(async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);
      const res = await batchService.getFinalVideos(projectId, {
        page,
        limit: 12,
        search: searchTerm || undefined,
        batchId: selectedBatchId || undefined,
        qualityStatus: qualityFilter || undefined,
        sortBy,
        sortDir: 'desc',
        includeArchived,
      });
      setVideos(res.items);
      setTotalVideos(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to load final videos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, page, searchTerm, selectedBatchId, qualityFilter, sortBy, includeArchived]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  // 3. Toggle Archive
  const handleToggleArchive = async (video: FinalVideoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await batchService.toggleArchive(projectId, video.video_id);
      loadVideos();
    } catch {
      alert('Không thể cập nhật trạng thái lưu trữ');
    }
  };

  // 4. Batch ZIP Export
  const handleExportZip = async () => {
    try {
      setIsExportingZip(true);
      const blob = await batchService.exportZip(projectId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TrendMotion_${generation.projectName || 'project'}_videos.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể xuất gói ZIP');
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Actions Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 bg-indigo-50 text-indigo-700 rounded-lg">
              <FolderKanban className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Thư viện video thành phẩm</h2>
          </div>
          <p className="text-xs text-slate-500">
            Dự án: <strong className="text-slate-700">{generation.projectName}</strong> • Tổng số{' '}
            <strong className="text-indigo-600 font-mono font-bold text-sm">{totalVideos}</strong> video
            đã hoàn thành kiểm định.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {totalVideos > 0 && (
            <Button
              variant="secondary"
              onClick={handleExportZip}
              disabled={isExportingZip}
              isLoading={isExportingZip}
              className="text-xs text-slate-700 gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất toàn bộ ZIP (kèm manifest)
            </Button>
          )}

          {onNewBatchClick && (
            <Button
              onClick={onNewBatchClick}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Sản xuất đợt mới
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên sản phẩm..."
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Batch Filter */}
          {batches.length > 0 && (
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setPage(1);
              }}
              className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tất cả các đợt sản xuất</option>
              {batches.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>
                  {b.name} ({b.total_jobs} video)
                </option>
              ))}
            </select>
          )}

          {/* Quality Review Filter */}
          <select
            value={qualityFilter}
            onChange={(e) => {
              setQualityFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tất cả trạng thái kiểm định</option>
            <option value="PASS">Chỉ video ĐẠT (PASS)</option>
            <option value="NEEDS_REVIEW">Cần xem xét (NEEDS_REVIEW)</option>
          </select>
        </div>

        {/* Sort & Archive Toggle */}
        <div className="flex items-center gap-2.5">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'created_at' | 'product_title')}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="created_at">Mới nhất trước</option>
            <option value="product_title">Tên sản phẩm (A-Z)</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="rounded text-indigo-600 border-slate-300 w-3.5 h-3.5"
            />
            <span>Hiện video lưu trữ</span>
          </label>

          <button
            type="button"
            onClick={loadVideos}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Làm mới"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Videos Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 mx-auto animate-spin text-indigo-600" />
          <p className="text-xs">Đang tải danh sách video thành phẩm...</p>
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map((v) => {
            const thumbUrl = batchService.resolveMediaUrl(v.thumbnail_url);
            const downloadUrl = batchService.getDownloadUrl(projectId, v.video_id);

            return (
              <div
                key={v.video_id}
                className={`bg-white border rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group ${
                  v.is_archived ? 'opacity-60 border-dashed border-slate-300' : 'border-slate-200'
                }`}
              >
                {/* Poster Frame */}
                <div
                  onClick={() => onOpenVideoDetail(v)}
                  className="aspect-[9/16] bg-slate-950 relative overflow-hidden flex items-center justify-center cursor-pointer"
                >
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={v.product_title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Film className="w-8 h-8 text-slate-600" />
                  )}

                  {/* Play icon overlay */}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-md">
                      <Play className="w-5 h-5 fill-slate-900 ml-0.5" />
                    </div>
                  </div>

                  {/* Top-right badges */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/90 text-white backdrop-blur-xs flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> 10/10 PASS
                    </span>
                  </div>

                  {/* Bottom specs bar */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white/90 font-mono bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded">
                    <span>1080x1920 (9:16)</span>
                    <span>{(v.duration_ms / 1000).toFixed(1)}s</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                  <div>
                    <h4
                      onClick={() => onOpenVideoDetail(v)}
                      className="text-xs font-bold text-slate-900 line-clamp-2 cursor-pointer hover:text-indigo-600 transition-colors"
                      title={v.product_title}
                    >
                      {v.product_title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Người mẫu: <strong className="text-slate-700">{v.model_name}</strong>
                    </p>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => onOpenCompare(v)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md font-semibold text-[11px] transition-colors"
                      title="So sánh song song với Base Video"
                    >
                      <SplitSquareVertical className="w-3 h-3" />
                      So sánh
                    </button>

                    <a
                      href={downloadUrl}
                      download={`TrendMotion_${v.product_title.replace(/\s+/g, '_')}.mp4`}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                      title="Tải video MP4"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={(e) => handleToggleArchive(v, e)}
                      className={`p-1.5 rounded-md transition-colors ${
                        v.is_archived
                          ? 'text-indigo-600 hover:bg-indigo-50'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                      title={v.is_archived ? 'Bỏ lưu trữ' : 'Lưu trữ video'}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <Film className="w-10 h-10 mx-auto text-slate-400" />
          <h4 className="text-sm font-bold text-slate-900">Chưa có video thành phẩm nào</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Khi các tác vụ thay trang phục đơn lẻ hoặc đợt sản xuất hàng loạt hoàn thành, các video thành
            phẩm đã kiểm định sẽ xuất hiện tại đây.
          </p>
          {onNewBatchClick && (
            <div className="pt-2">
              <Button onClick={onNewBatchClick} className="bg-indigo-600 text-white text-xs">
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Tạo đợt sản xuất hàng loạt
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-600">
          <span>
            Trang {page} / {totalPages} (Tổng {totalVideos} video)
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Tiếp
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
