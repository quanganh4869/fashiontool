import React, { useState } from 'react';
import {
  MoreHorizontal,
  Eye,
  CheckCircle,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Star,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { Dialog } from '@/components/ui/Dialog';
import { ModelAsset } from '../types/model-management.types';
import { ModelPhotoViewer } from './ModelPhotoViewer';

export interface ModelPhotoGalleryProps {
  assets: ModelAsset[];
  coverAssetId?: string | null;
  onSetCover?: (assetId: string) => void;
  onDeleteAsset?: (assetId: string) => void;
  onMoveOrder?: (assetId: string, direction: 'left' | 'right') => void;
  isReadOnly?: boolean;
}

export const ModelPhotoGallery: React.FC<ModelPhotoGalleryProps> = ({
  assets,
  coverAssetId,
  onSetCover,
  onDeleteAsset,
  onMoveOrder,
  isReadOnly = false,
}) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeViewerIndex, setActiveViewerIndex] = useState(0);
  const [assetToDelete, setAssetToDelete] = useState<ModelAsset | null>(null);

  const handleOpenViewer = (index: number) => {
    setActiveViewerIndex(index);
    setViewerOpen(true);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {assets.map((asset, index) => {
          const isCover = asset.assetId === coverAssetId || asset.isCover;

          return (
            <div
              key={asset.assetId}
              className={`group relative aspect-[3/4] rounded-lg overflow-hidden border bg-[#F6F5F2] transition-all shadow-sm ${
                isCover ? 'border-[#654B7B] ring-2 ring-[#654B7B]/20' : 'border-[#E8E5E0] hover:border-[#D1C2DC]'
              }`}
            >
              {/* Image Thumbnail */}
              <img
                src={asset.thumbnailUrl || asset.viewUrl}
                alt={asset.originalFilename}
                onClick={() => handleOpenViewer(index)}
                className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-normal"
                loading="lazy"
              />

              {/* Cover Badge */}
              {isCover && (
                <div className="absolute top-2 left-2 z-10 pointer-events-none">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#654B7B] text-white shadow-sm">
                    <Star className="w-3 h-3 fill-white" />
                    <span>Ảnh đại diện</span>
                  </span>
                </div>
              )}

              {/* Action Overlay */}
              {!isReadOnly && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 pointer-events-none">
                  {/* Top Row: Reorder & Menu */}
                  <div className="flex items-center justify-between w-full pointer-events-auto">
                    {/* Move Reorder Buttons */}
                    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-md p-0.5">
                      {index > 0 && onMoveOrder && (
                        <button
                          type="button"
                          aria-label="Di chuyển sang trái"
                          onClick={() => onMoveOrder(asset.assetId, 'left')}
                          className="w-6 h-6 rounded hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {index < assets.length - 1 && onMoveOrder && (
                        <button
                          type="button"
                          aria-label="Di chuyển sang phải"
                          onClick={() => onMoveOrder(asset.assetId, 'right')}
                          className="w-6 h-6 rounded hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu
                      align="right"
                      trigger={
                        <button
                          type="button"
                          aria-label={`Tùy chọn cho ảnh ${asset.originalFilename}`}
                          className="w-7 h-7 rounded-md bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      }
                    >
                      <DropdownMenuItem
                        label="Xem ảnh lớn"
                        icon={Eye}
                        onClick={() => handleOpenViewer(index)}
                      />
                      {!isCover && onSetCover && (
                        <DropdownMenuItem
                          label="Đặt làm ảnh đại diện"
                          icon={CheckCircle}
                          onClick={() => onSetCover(asset.assetId)}
                        />
                      )}
                      {onDeleteAsset && (
                        <DropdownMenuItem
                          label="Xóa ảnh"
                          icon={Trash2}
                          destructive
                          onClick={() => setAssetToDelete(asset)}
                        />
                      )}
                    </DropdownMenu>
                  </div>

                  {/* Bottom Row: View Clickable Hint */}
                  <div className="w-full flex justify-end pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => handleOpenViewer(index)}
                      className="text-[11px] text-white/90 hover:text-white flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Xem</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox Viewer */}
      <ModelPhotoViewer
        assets={assets}
        initialIndex={activeViewerIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={Boolean(assetToDelete)}
        onClose={() => setAssetToDelete(null)}
        title="Xóa ảnh khỏi hồ sơ?"
        description="Ảnh này sẽ không còn được sử dụng làm hình ảnh tham chiếu mới của người mẫu."
        confirmLabel="Xóa ảnh"
        cancelLabel="Hủy"
        onConfirm={() => {
          if (assetToDelete && onDeleteAsset) {
            onDeleteAsset(assetToDelete.assetId);
            setAssetToDelete(null);
          }
        }}
      />
    </div>
  );
};
