import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight,
  Edit2,
  ArrowLeft,
  UserRound,
  MoreHorizontal,
  Archive,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useModelDetail } from '../hooks/useModelDetail';
import { modelManagementService } from '../services/model-management.service';
import { formatModelStatus } from '../utils/model-photo-format';

import { Button } from '@/components/ui/Button';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { ModelPhotoGallery } from '../components/ModelPhotoGallery';
import { ModelProfileInformation } from '../components/ModelProfileInformation';
import { ModelArchiveDialog } from '../components/ModelArchiveDialog';
import { ModelDeleteDialog } from '../components/ModelDeleteDialog';
import { Skeleton } from '@/components/feedback/Skeleton';

export const ModelDetailPage: React.FC = () => {
  const { modelId } = useParams<{ modelId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { model, isLoading, error, reload } = useModelDetail(modelId);

  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleConfirmArchive = async () => {
    if (!modelId) return;
    setIsActionLoading(true);
    try {
      await modelManagementService.archiveModel(modelId);
      showToast('Đã lưu trữ hồ sơ người mẫu.', 'success');
      setShowArchiveDialog(false);
      reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu trữ người mẫu.';
      showToast(msg, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!modelId) return;
    try {
      await modelManagementService.restoreModel(modelId);
      showToast('Đã khôi phục hồ sơ người mẫu thành công.', 'success');
      reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể khôi phục người mẫu.';
      showToast(msg, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!modelId) return;
    setIsActionLoading(true);
    try {
      await modelManagementService.deleteModel(modelId);
      showToast('Đã xóa hồ sơ người mẫu.', 'success');
      setShowDeleteDialog(false);
      navigate('/models');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa người mẫu.';
      showToast(msg, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 font-sans p-4">
        <Skeleton className="h-5 w-48 rounded" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-12 gap-6">
          <Skeleton className="col-span-12 lg:col-span-8 h-96 rounded-xl" />
          <Skeleton className="col-span-12 lg:col-span-4 h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="w-full max-w-md mx-auto my-12 bg-white border border-[#E8E5E0] rounded-xl p-8 text-center flex flex-col items-center gap-3 shadow-sm">
        <p className="text-base font-semibold text-[#A94442]">Không thể tải hồ sơ người mẫu</p>
        <p className="text-xs text-[#74716D]">{error || 'Hồ sơ không tồn tại.'}</p>
        <Link
          to="/models"
          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#654B7B] rounded-md hover:bg-[#543C69] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay về thư viện người mẫu</span>
        </Link>
      </div>
    );
  }

  const statusInfo = formatModelStatus(model.status);
  const coverAsset =
    model.referenceAssets.find((a) => a.assetId === model.coverAssetId) ||
    model.referenceAssets[0];

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 font-sans pb-12">
      {/* 1. Breadcrumb */}
      <nav aria-label="Điều hướng phân cấp" className="flex items-center gap-1.5 text-xs text-[#74716D]">
        <Link to="/models" className="hover:text-[#654B7B] transition-colors">
          Người mẫu
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#97938E]" />
        <span className="text-[#242321] font-medium truncate max-w-xs">
          {model.displayName}
        </span>
      </nav>

      {/* 2. Top Profile Header Banner */}
      <div className="w-full bg-white border border-[#E8E5E0] rounded-xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 w-full sm:w-auto">
          {/* Cover Photo */}
          <div className="w-20 h-24 sm:w-24 sm:h-32 rounded-lg bg-[#F6F5F2] border border-[#E8E5E0] overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
            {coverAsset ? (
              <img
                src={coverAsset.thumbnailUrl || coverAsset.viewUrl}
                alt={model.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserRound className="w-8 h-8 text-[#97938E]" />
            )}
          </div>

          {/* Identity info */}
          <div className="text-center sm:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.badgeBg} ${statusInfo.textColor}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                {statusInfo.label}
              </span>
              <span className="text-xs font-mono text-[#74716D]">
                {model.modelCode}
              </span>
            </div>

            <h1 className="text-2xl sm:text-[26px] font-bold text-[#242321] tracking-tight truncate">
              {model.displayName}
            </h1>

            <p className="text-xs text-[#74716D] mt-1">
              {model.referenceAssets.length} ảnh tham chiếu • Phiên bản v{model.modelVersion}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`/models/${model.modelId}/edit`)}
            className="text-xs font-medium gap-1.5 bg-white border-[#E8E5E0] hover:bg-[#F7F6F4]"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Chỉnh sửa hồ sơ</span>
          </Button>

          <DropdownMenu
            align="right"
            trigger={
              <button
                type="button"
                aria-label="Tùy chọn khác"
                className="w-9 h-9 rounded-md border border-[#E8E5E0] bg-white hover:bg-[#F7F6F4] text-[#242321] flex items-center justify-center transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            }
          >
            {model.status === 'READY' && (
              <DropdownMenuItem
                label="Lưu trữ hồ sơ"
                icon={Archive}
                onClick={() => setShowArchiveDialog(true)}
              />
            )}
            {model.status === 'ARCHIVED' && (
              <DropdownMenuItem
                label="Khôi phục hồ sơ"
                icon={RotateCcw}
                onClick={handleConfirmRestore}
              />
            )}
            {model.usedInProjectsCount === 0 && (
              <DropdownMenuItem
                label="Xóa hồ sơ"
                icon={Trash2}
                destructive
                onClick={() => setShowDeleteDialog(true)}
              />
            )}
          </DropdownMenu>
        </div>
      </div>

      {/* 3. Main Content Grid */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Photo Gallery (8 cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white border border-[#E8E5E0] rounded-xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#E8E5E0] pb-3">
              <div>
                <h2 className="text-base font-semibold text-[#242321]">
                  Bộ sưu tập ảnh tham chiếu
                </h2>
                <p className="text-xs text-[#74716D] mt-0.5">
                  Click vào ảnh bất kỳ để mở trình xem ảnh chất lượng cao.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/models/${model.modelId}/edit`)}
                className="text-xs"
              >
                Quản lý ảnh
              </Button>
            </div>

            <ModelPhotoGallery
              assets={model.referenceAssets}
              coverAssetId={model.coverAssetId}
              isReadOnly
            />
          </div>
        </div>

        {/* Detailed Metadata & Usage (4 cols) */}
        <div className="col-span-12 lg:col-span-4">
          <ModelProfileInformation model={model} />
        </div>
      </div>

      {/* Archive Dialog */}
      <ModelArchiveDialog
        model={model}
        isOpen={showArchiveDialog}
        onClose={() => setShowArchiveDialog(false)}
        onConfirmArchive={handleConfirmArchive}
        isLoading={isActionLoading}
      />

      {/* Delete Dialog */}
      <ModelDeleteDialog
        model={model}
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirmDelete={handleConfirmDelete}
        isLoading={isActionLoading}
      />
    </div>
  );
};
