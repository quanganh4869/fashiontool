import React from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError();

  let errorMessage = 'Đã xảy ra lỗi không mong muốn trong ứng dụng.';
  if (isRouteErrorResponse(error)) {
    errorMessage = `${error.status} ${error.statusText}: ${error.data || ''}`;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const handleReload = () => {
    window.location.href = '/studio';
  };

  return (
    <div className="min-h-screen bg-[#F6F5F2] flex items-center justify-center p-6 text-[#242321]">
      <div className="max-w-md w-full bg-white border border-[#E8E5E0] rounded-2xl p-8 shadow-sm text-center space-y-6">
        <div className="w-14 h-14 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[#242321]">Có sự cố giao diện</h2>
          <p className="text-sm text-[#74716D] leading-relaxed">
            {errorMessage.includes('insertBefore')
              ? 'Trình duyệt đang dịch tự động trang gây xung đột giao diện. Hãy bấm nút dưới đây để làm mới và tiếp tục.'
              : errorMessage}
          </p>
        </div>

        <div className="pt-2">
          <Button variant="primary" onClick={handleReload} className="w-full gap-2 shadow-sm">
            <RotateCcw className="w-4 h-4" />
            Làm mới và quay lại Studio
          </Button>
        </div>
      </div>
    </div>
  );
};
