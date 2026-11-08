import React, { useState } from 'react';
import {
  Shirt,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Film,
  Info,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { ModelTemplateGeneration } from '@/features/studio/types/studio.types';
import { ProductAssetSummaryResponse, ProductAssetResponse } from '@/features/products/types/product.types';
import { ReplacementPreflightResponse } from '../types/replacement.types';
import { replacementService } from '../services/replacement.service';
import { productService } from '@/features/products/services/product.service';

export interface ReplacementPreflightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmedLimitations: boolean) => void;
  generation: ModelTemplateGeneration;
  product: ProductAssetResponse | ProductAssetSummaryResponse | null;
  preflight: ReplacementPreflightResponse | null;
  isLoading: boolean;
  isStarting: boolean;
}

export const ReplacementPreflightModal: React.FC<ReplacementPreflightModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  generation,
  product,
  preflight,
  isLoading,
  isStarting,
}) => {
  const [confirmedLimitations, setConfirmedLimitations] = useState(false);

  if (!product) return null;

  const hasWarnings = preflight && preflight.warnings.length > 0;
  const canStart = preflight && preflight.can_replace && (!hasWarnings || confirmedLimitations);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={isStarting ? () => {} : onClose}
      title="Kiểm tra tương thích trước khi thay trang phục"
      description="Đối chiếu Personalized Base Video và Product Truth Sheet để đảm bảo bảo toàn chính xác nhận diện sản phẩm."
      maxWidth="max-w-[760px]"
    >
      <div className="space-y-5">
        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-sm text-slate-600 font-medium">
              Đang phân tích vùng trang phục và kiểm tra Product Truth Sheet...
            </p>
          </div>
        ) : preflight ? (
          <>
            {/* Dual Input Panels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left: Base Video Input */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <Film className="w-3.5 h-3.5 text-indigo-600" />
                  Video nền đã cá nhân hóa
                </div>
                <div className="flex gap-3">
                  <div className="w-16 aspect-[9/16] rounded-md bg-black overflow-hidden shrink-0 border border-slate-300">
                    {generation.outputThumbnailUrl ? (
                      <img
                        src={replacementService.resolveMediaUrl(generation.outputThumbnailUrl)}
                        alt="Base Video Poster"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <Film className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-slate-900 truncate max-w-[180px]">
                      {generation.modelName} • {generation.templateTitle}
                    </p>
                    <p className="text-slate-500">
                      Trang phục gốc: <span className="font-medium text-slate-700">{preflight.detected_base_garment}</span>
                    </p>
                    <p className="text-slate-500">
                      Vùng thay thế: <span className="font-semibold text-indigo-600">{preflight.target_garment_slot}</span>
                    </p>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Base Video READY
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Product Asset & Truth Sheet Input */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <Shirt className="w-3.5 h-3.5 text-indigo-600" />
                  Sản phẩm & Truth Sheet
                </div>
                <div className="flex gap-3">
                  <div className="w-16 h-20 rounded-md bg-white overflow-hidden shrink-0 border border-slate-300 flex items-center justify-center">
                    {product.primary_image_url ? (
                      <img
                        src={productService.resolveImageUrl(product.primary_image_url)}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Shirt className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-slate-900 truncate max-w-[180px]">
                      {product.custom_title || product.title}
                    </p>
                    <p className="text-slate-500">
                      Danh mục: <span className="font-semibold text-slate-700 uppercase">{preflight.truth_sheet.category}</span>
                    </p>
                    <p className="text-slate-500">
                      Màu: <span className="font-medium text-slate-700">{preflight.truth_sheet.primary_color}</span> • Cổ: <span className="font-medium text-slate-700">{preflight.truth_sheet.collar_type}</span>
                    </p>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" /> Truth Sheet APPROVED
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Truth Sheet Key Constraints Card */}
            <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Các ràng buộc nhận dạng bất biến sẽ được bảo toàn trên video:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 bg-white rounded-lg border border-indigo-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block">Số lượng cúc áo</span>
                  <span className="font-bold text-indigo-700 text-sm">
                    {preflight.truth_sheet.button_count} cúc tròn
                  </span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-indigo-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block">Túi ngực</span>
                  <span className="font-bold text-indigo-700 text-sm">
                    {preflight.truth_sheet.has_left_pocket ? '1 túi ngực trái' : 'Không có túi'}
                  </span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-indigo-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block">Cổ áo</span>
                  <span className="font-bold text-indigo-700 text-sm">
                    Cổ nhọn (Pointed)
                  </span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-indigo-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block">Cổ tay & Tay áo</span>
                  <span className="font-bold text-indigo-700 text-sm">
                    Dài tay (2 cúc)
                  </span>
                </div>
              </div>
            </div>

            {/* Warnings or Limitations */}
            {hasWarnings && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-800">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Lưu ý về phạm vi tương thích:
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  {preflight.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
                <label className="flex items-center gap-2 pt-1 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmedLimitations}
                    onChange={(e) => setConfirmedLimitations(e.target.checked)}
                    className="rounded border-amber-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Tôi đã hiểu các giới hạn và đồng ý tiếp tục tạo video thành phẩm</span>
                </label>
              </div>
            )}

            {/* Blocking reasons if any */}
            {!preflight.can_replace && preflight.blocking_reasons.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Không thể bắt đầu thay trang phục:
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  {preflight.blocking_reasons.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Note about Local Processing */}
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-100 text-[11px] text-slate-600">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                Toàn bộ quá trình thay trang phục được thực thi 100% bằng Động cơ AI cục bộ trên máy chủ nội bộ.
                Khuôn mặt, màu da, kiểu tóc và bối cảnh video nền được bảo toàn nguyên vẹn.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={onClose} disabled={isStarting}>
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={() => onConfirm(confirmedLimitations)}
                disabled={!canStart || isStarting}
                className="gap-2"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang khởi tạo...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Xác nhận & Bắt đầu thay trang phục
                  </>
                )}
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </Dialog>
  );
};
