import React from 'react';
import { Calendar, Tag, Layers, CheckCircle2, Clapperboard } from 'lucide-react';
import { ModelProfileDetail } from '../types/model-management.types';
import { formatRelativeTime } from '@/utils/formatters';

export interface ModelProfileInformationProps {
  model: ModelProfileDetail;
}

export const ModelProfileInformation: React.FC<ModelProfileInformationProps> = ({
  model,
}) => {
  return (
    <div className="w-full flex flex-col gap-5">
      {/* Basic Metadata Card */}
      <div className="bg-white border border-[#E8E5E0] rounded-xl p-5 shadow-sm flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-[#242321] border-b border-[#E8E5E0] pb-2">
          Thông tin chi tiết
        </h3>

        <div className="flex flex-col gap-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#74716D] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Mã hồ sơ:
            </span>
            <span className="font-mono font-medium text-[#242321]">
              {model.modelCode}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#74716D] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Phiên bản hồ sơ:
            </span>
            <span className="font-medium text-[#654B7B] bg-[#F2EDF5] px-2 py-0.5 rounded text-[11px]">
              v{model.modelVersion}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#74716D] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Ngày tạo:
            </span>
            <span className="text-[#242321]">
              {formatRelativeTime(model.createdAt)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#74716D] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Cập nhật lần cuối:
            </span>
            <span className="text-[#242321]">
              {formatRelativeTime(model.updatedAt)}
            </span>
          </div>

          <div className="pt-2 border-t border-[#F2EDF5] flex flex-col gap-1.5">
            <span className="text-[#74716D]">Cam kết bản quyền:</span>
            <div className="flex items-center gap-1.5 text-[#367458] font-medium text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Đã xác nhận quyền sử dụng hình ảnh</span>
            </div>
          </div>

          {model.description && (
            <div className="pt-2 border-t border-[#F2EDF5] flex flex-col gap-1">
              <span className="text-[#74716D]">Ghi chú quản lý:</span>
              <p className="text-[#242321] leading-relaxed bg-[#FAF9F7] p-2.5 rounded border border-[#E8E5E0]">
                {model.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Usage in Projects Section (Prepared for future Studio linking) */}
      <div className="bg-white border border-[#E8E5E0] rounded-xl p-5 shadow-sm flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-[#242321] border-b border-[#E8E5E0] pb-2 flex items-center justify-between">
          <span>Thông tin sử dụng</span>
          {model.usedInProjectsCount > 0 && (
            <span className="text-xs text-[#654B7B] font-medium">
              {model.usedInProjectsCount} dự án
            </span>
          )}
        </h3>

        {model.usedInProjectsCount > 0 ? (
          <p className="text-xs text-[#4B4945]">
            Hồ sơ này đã được liên kết trong {model.usedInProjectsCount} dự án sản xuất video thời trang.
          </p>
        ) : (
          <div className="p-4 bg-[#FAF9F7] rounded-lg border border-[#E8E5E0] text-center flex flex-col items-center justify-center gap-2">
            <Clapperboard className="w-5 h-5 text-[#97938E]" />
            <p className="text-xs text-[#74716D]">Chưa có dữ liệu sử dụng</p>
            <p className="text-[11px] text-[#97938E] max-w-xs">
              Khi bạn chọn người mẫu này trong các dự án Studio, lịch sử sử dụng sẽ hiển thị tại đây.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
