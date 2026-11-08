import React, { useState } from 'react';
import { ArrowRight, FolderPlus } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (projectName: string, projectDescription?: string) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm(name.trim(), description.trim() || undefined);
    setName('');
    setDescription('');
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo dự án video mới"
      description="Đặt tên cho dự án để quản lý các phiên bản video và sản phẩm thời trang."
      maxWidth="max-w-[480px]"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#242321] flex items-center gap-1.5">
            <FolderPlus className="w-3.5 h-3.5 text-[#654B7B]" />
            Tên dự án <span className="text-rose-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: BST Áo Sơ Mi Hè 2026 - Video 01"
            className="w-full"
            autoFocus
          />
          <p className="text-[11px] text-[#74716D]">
            Tên này sẽ hiển thị xuyên suốt các bước chọn người mẫu, video và xuất bản phẩm.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#242321]">
            Mô tả dự án <span className="text-[#A3A09B] font-normal">(Tùy chọn)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ghi chú về mục đích chiến dịch, phong cách trang phục..."
            rows={2}
            className="w-full px-3 py-2 bg-white border border-[#D6D2CC] rounded-xl text-sm text-[#242321] placeholder-[#A3A09B] focus:outline-none focus:ring-2 focus:ring-[#654B7B]/30 focus:border-[#654B7B] transition-all resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E8E5E0]">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Hủy
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!name.trim()}
            className="gap-2 bg-[#654B7B] hover:bg-[#523C64] text-white"
          >
            <span>Bắt đầu dự án</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
