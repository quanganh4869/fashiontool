import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { ModelProfileSummary } from '../types/model-management.types';
import { formatModelStatus } from '../utils/model-photo-format';
import { ModelActionMenu } from './ModelActionMenu';

export interface ModelCardProps {
  model: ModelProfileSummary;
  onArchive?: (model: ModelProfileSummary) => void;
  onRestore?: (model: ModelProfileSummary) => void;
  onDelete?: (model: ModelProfileSummary) => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  onArchive,
  onRestore,
  onDelete,
}) => {
  const navigate = useNavigate();
  const statusInfo = formatModelStatus(model.status);

  const handleClick = () => {
    if (model.status === 'DRAFT') {
      navigate(`/models/${model.modelId}/setup/identity`);
    } else {
      navigate(`/models/${model.modelId}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group bg-white border border-[#E8E5E0] hover:border-[#D1C2DC] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-normal flex flex-col cursor-pointer"
    >
      {/* 4:5 Aspect Ratio Cover Photo Container */}
      <div className="relative w-full aspect-[4/5] bg-[#F6F5F2] overflow-hidden flex items-center justify-center">
        {model.coverImageUrl ? (
          <img
            src={model.coverImageUrl}
            alt={model.displayName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-normal"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-[#97938E] gap-2 p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#EBE8E3] flex items-center justify-center text-[#74716D]">
              <UserRound className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium">Chưa có ảnh đại diện</span>
          </div>
        )}

        {/* Status Pill Badge */}
        <div className="absolute bottom-2.5 left-2.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/95 backdrop-blur-sm border border-[#E8E5E0]/60 ${statusInfo.textColor}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
            {statusInfo.label}
          </span>
        </div>

        {/* Action Menu (Top-Right) */}
        <div
          className="absolute top-2.5 right-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          <ModelActionMenu
            model={model}
            onArchive={onArchive}
            onRestore={onRestore}
            onDelete={onDelete}
          />
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col gap-1.5 flex-1 justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#242321] group-hover:text-[#654B7B] transition-colors truncate">
            {model.displayName}
          </h3>
          <p className="text-xs text-[#74716D] font-mono tracking-tight mt-0.5">
            {model.modelCode}
          </p>
        </div>

        <div className="pt-2 border-t border-[#F2EDF5] flex items-center justify-between text-xs text-[#74716D]">
          <span>
            {model.referenceAssetsCount > 0
              ? `${model.referenceAssetsCount.toString().padStart(2, '0')} ảnh tham chiếu`
              : 'Chưa có ảnh'}
          </span>
          {model.usedInProjectsCount > 0 && (
            <span className="font-medium text-[#654B7B]">
              {model.usedInProjectsCount} dự án
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
