import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { QualityReviewReport } from '../types/studio.types';

interface QualityReviewReportCardProps {
  report: QualityReviewReport | null | undefined;
}

export const QualityReviewReportCard: React.FC<QualityReviewReportCardProps> = ({
  report,
}) => {
  if (!report) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500 space-y-2">
        <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
        <h4 className="font-semibold text-slate-700">Chưa có báo cáo kiểm định</h4>
        <p className="text-xs">Báo cáo chất lượng tự động chưa được khởi tạo cho bản xuất này.</p>
      </div>
    );
  }

  const isPass = report.overallStatus === 'PASS';
  const isNeedsReview = report.overallStatus === 'NEEDS_REVIEW';

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-4">
      {/* Header Banner */}
      <div
        className={`px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isPass
            ? 'bg-emerald-50/60 border-emerald-100'
            : isNeedsReview
            ? 'bg-amber-50/60 border-amber-100'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isPass
                ? 'bg-emerald-100 text-emerald-700'
                : isNeedsReview
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {isPass ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-sm">
                Báo cáo kiểm định chất lượng tự động
              </h4>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded border ${
                  isPass
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : isNeedsReview
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {isPass ? 'ĐẠT TIÊU CHUẨN' : isNeedsReview ? 'CẦN XEM XÉT' : 'CHƯA ĐÁNH GIÁ'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Được phân tích tự động bằng FFprobe và mô đun Quality Review nội bộ.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            {report.inspector}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(report.assessedAt).toLocaleTimeString('vi-VN')}
          </span>
        </div>
      </div>

      {/* Criteria Breakdown Grid */}
      <div className="px-5 pb-5">
        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Chi tiết đánh giá từng tiêu chí
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {report.criteria.map((cr) => {
            const itemPass = cr.status === 'PASS';
            const itemReview = cr.status === 'NEEDS_REVIEW';

            return (
              <div
                key={cr.key}
                className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                  itemPass
                    ? 'bg-white border-slate-200'
                    : itemReview
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{cr.name}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${
                      itemPass
                        ? 'bg-emerald-50 text-emerald-700'
                        : itemReview
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {itemPass && <CheckCircle2 className="w-3 h-3" />}
                    {itemPass ? 'Đạt' : itemReview ? 'Cần xem xét' : 'Chưa rõ'}
                  </span>
                </div>

                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {cr.description}
                </p>

                {cr.notes && (
                  <p className="text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-100">
                    Ghi chú: {cr.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
