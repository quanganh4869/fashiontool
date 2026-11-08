import React from 'react';
import { History, X, Trash2, ArrowUpRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SearchHistoryItem } from '../types/research.types';

export interface SearchHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: SearchHistoryItem[];
  onSelectQuery: (query: string) => void;
  onDeleteItem: (historyId: string) => void;
}

export const SearchHistoryDrawer: React.FC<SearchHistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectQuery,
  onDeleteItem,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Lịch sử tìm kiếm</h3>
                <p className="text-[11px] text-slate-500">Các truy vấn nghiên cứu gần đây</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-5">
            {history.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">Chưa có lịch sử tìm kiếm nào</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Khi bạn tìm kiếm từ khóa hoặc lọc danh mục, các truy vấn sẽ được lưu tại đây.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.history_id}
                    className="p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all flex items-center justify-between group"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectQuery(item.query || '');
                        onClose();
                      }}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {item.query || 'Tất cả sản phẩm'}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.created_at).toLocaleDateString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </span>
                        <span>•</span>
                        <span>{item.result_count} kết quả</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      title="Xóa truy vấn này"
                      onClick={() => onDeleteItem(item.history_id)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
