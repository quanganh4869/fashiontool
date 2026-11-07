import React, { useState } from 'react';
import { Link2, Sparkles, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ProductInputSectionProps {
  onExtract: (url: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const ProductInputSection: React.FC<ProductInputSectionProps> = ({
  onExtract,
  isLoading,
  disabled = false,
}) => {
  const [url, setUrl] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);

  const validateUrl = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return 'Vui lòng nhập đường dẫn liên kết sản phẩm.';
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return 'Chỉ hỗ trợ giao thức bảo mật HTTP hoặc HTTPS.';
      }

      const host = parsed.hostname.toLowerCase();
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '::1' ||
        host.startsWith('192.168.') ||
        host.startsWith('10.') ||
        host.endsWith('.local') ||
        host.endsWith('.internal')
      ) {
        return 'Không được phép trích xuất từ địa chỉ mạng nội bộ hoặc localhost (Bảo vệ SSRF).';
      }
    } catch {
      return 'Định dạng URL không hợp lệ (ví dụ: https://brand.com/products/dress-123).';
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateUrl(url);
    if (error) {
      setClientError(error);
      return;
    }
    setClientError(null);
    onExtract(url.trim());
  };

  const handleInputChange = (val: string) => {
    setUrl(val);
    if (clientError) setClientError(null);
  };

  const handleClear = () => {
    setUrl('');
    setClientError(null);
  };

  const handleSampleClick = (sampleUrl: string) => {
    setUrl(sampleUrl);
    setClientError(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-indigo-600" />
          Nhập liên kết sản phẩm thời trang
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Hệ thống sẽ kiểm tra an toàn SSRF, trích xuất dữ liệu đa tầng (JSON-LD Schema, OpenGraph, HTML) và tải ảnh gốc chất lượng cao về Local Filesystem.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Link2 className="w-4 h-4" />
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={isLoading || disabled}
            placeholder="Dán link sản phẩm (ví dụ: https://shop.brand.com/products/floral-maxi-dress)..."
            className={`w-full pl-10 pr-24 py-2.5 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 ${
              clientError
                ? 'border-red-300 focus:ring-red-400 bg-red-50/20'
                : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white'
            }`}
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            {url && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                title="Xóa URL"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              disabled={disabled || !url.trim()}
              className="gap-1.5 px-3 py-1.5 text-xs shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Phân tích
            </Button>
          </div>
        </div>

        {clientError && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{clientError}</span>
          </div>
        )}

        {/* Security & Support Indicators */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Chống SSRF đa lớp • Lưu trữ Local Filesystem độc quyền</span>
          </div>

          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            <span className="text-slate-400">Gợi ý mẫu:</span>
            <button
              type="button"
              onClick={() =>
                handleSampleClick(
                  'https://shop.fashionbrand.vn/products/ao-so-mi-lua-tay-phong'
                )
              }
              className="text-indigo-600 hover:underline hover:text-indigo-700"
            >
              Áo sơ mi lụa
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={() =>
                handleSampleClick(
                  'https://brand-shop.example.com/products/floral-silk-maxi-dress'
                )
              }
              className="text-indigo-600 hover:underline hover:text-indigo-700"
            >
              Đầm Maxi
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
