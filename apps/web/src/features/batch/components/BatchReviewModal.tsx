import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Package,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { BatchPreflightResponse } from '../types/batch.types';
import { productService } from '@/features/products/services/product.service';

export interface BatchReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (validProductIds: string[], confirmedLimitations: boolean, idempotencyKey: string) => void;
  preflight: BatchPreflightResponse | null;
  isLoading?: boolean;
  isStarting?: boolean;
}

export const BatchReviewModal: React.FC<BatchReviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  preflight,
  isLoading = false,
  isStarting = false,
}) => {
  const [confirmedLimitations, setConfirmedLimitations] = useState(false);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [idempotencyKey] = useState(() => `idemp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  if (!preflight) return null;

  // Active items after user exclusions
  const activeItems = preflight.items.filter((item) => !excludedIds.includes(item.product_id));
  const eligibleItems = activeItems.filter((item) => item.status === 'ELIGIBLE');
  const warningItems = activeItems.filter((item) => item.status === 'WARNINGS');
  const blockedItems = activeItems.filter((item) => item.status === 'BLOCKED');

  const hasWarnings = warningItems.length > 0;
  const hasBlocked = blockedItems.length > 0;

  // Can start if at least one valid product and either no blocked or user excluded them, and warnings confirmed
  const canStart =
    (eligibleItems.length + warningItems.length > 0) &&
    !hasBlocked &&
    (!hasWarnings || confirmedLimitations);

  const handleExcludeProduct = (productId: string) => {
    setExcludedIds((prev) => [...prev, productId]);
  };

  const handleConfirm = () => {
    const validIds = [...eligibleItems, ...warningItems].map((i) => i.product_id);
    onConfirm(validIds, confirmedLimitations, idempotencyKey);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={isStarting ? () => {} : onClose}
      title="Đánh giá trước khi tạo đợt sản xuất hàng loạt"
      description="Hệ thống đã kiểm tra tính tương thích của từng sản phẩm với Personalized Base Video."
      maxWidth="max-w-[800px]"
    >
      <div className="space-y-5">
        {/* Summary Counter Strip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                Hợp lệ hoàn toàn
              </span>
              <span className="text-base font-bold text-emerald-950 font-mono">
                {eligibleItems.length} sản phẩm
              </span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">
                Có cảnh báo giới hạn
              </span>
              <span className="text-base font-bold text-amber-950 font-mono">
                {warningItems.length} sản phẩm
              </span>
            </div>
          </div>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">
                Không đủ điều kiện
              </span>
              <span className="text-base font-bold text-rose-950 font-mono">
                {blockedItems.length} sản phẩm
              </span>
            </div>
          </div>
        </div>

        {/* Product Items Table / List */}
        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {activeItems.map((item) => {
            const isBlocked = item.status === 'BLOCKED';
            const isWarning = item.status === 'WARNINGS';
            const imgUrl = productService.resolveImageUrl(item.primary_image_url);

            return (
              <div
                key={item.product_id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                  isBlocked
                    ? 'bg-rose-50/50 border-rose-200'
                    : isWarning
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-14 rounded-lg bg-slate-900 overflow-hidden shrink-0 flex items-center justify-center border border-slate-300">
                    {imgUrl ? (
                      <img src={imgUrl} alt={item.product_title} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate max-w-[320px]">
                        {item.product_title}
                      </h4>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isBlocked
                            ? 'bg-rose-100 text-rose-800'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {item.truth_sheet && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Quy cách: {item.truth_sheet.category} • {item.truth_sheet.button_count} cúc • Cổ{' '}
                        {item.truth_sheet.collar_type}
                      </p>
                    )}

                    {/* Warnings message */}
                    {item.warnings.length > 0 && (
                      <p className="text-[11px] text-amber-700 mt-0.5 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        {item.warnings.join('; ')}
                      </p>
                    )}

                    {/* Blocking reasons */}
                    {item.blocking_reasons.length > 0 && (
                      <p className="text-[11px] text-rose-700 mt-0.5 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {item.blocking_reasons.join('; ')}
                      </p>
                    )}
                  </div>
                </div>

                {isBlocked && (
                  <button
                    type="button"
                    onClick={() => handleExcludeProduct(item.product_id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100/50 rounded-lg transition-colors text-xs flex items-center gap-1 shrink-0"
                    title="Loại bỏ khỏi đợt sản xuất"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Loại bỏ</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Warning Acknowledgment Checkbox */}
        {hasWarnings && (
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="batch-confirm-warnings"
                checked={confirmedLimitations}
                onChange={(e) => setConfirmedLimitations(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="batch-confirm-warnings" className="text-xs text-amber-900 cursor-pointer">
                <strong>Tôi hiểu và chấp nhận các cảnh báo giới hạn trên:</strong> Các sản phẩm có cảnh
                báo vẫn sẽ được thay thế bằng quy tắc neo giữ cấu trúc tốt nhất của Local Engine.
              </label>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <Button variant="secondary" onClick={onClose} disabled={isStarting}>
            Hủy bỏ
          </Button>

          <Button
            onClick={handleConfirm}
            disabled={!canStart || isStarting || isLoading}
            isLoading={isStarting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Tạo {eligibleItems.length + warningItems.length} video thành phẩm
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
