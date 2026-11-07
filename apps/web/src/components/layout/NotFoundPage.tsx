import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-14 h-14 rounded-full bg-[#EFEEEB] flex items-center justify-center text-[#74716D] mb-5">
        <FileQuestion className="w-7 h-7" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#242321] tracking-tight">
        Không tìm thấy trang
      </h1>
      <p className="text-sm text-[#74716D] max-w-md mt-2 leading-relaxed">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <div className="mt-6">
        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/overview')}
        >
          Quay về tổng quan
        </Button>
      </div>
    </div>
  );
};
