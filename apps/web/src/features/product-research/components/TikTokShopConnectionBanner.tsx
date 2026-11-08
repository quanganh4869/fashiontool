import React, { useState } from 'react';
import {
  Store,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Unplug,
  Loader2,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { TikTokShopConnectionPublic } from '../types/research.types';
import { researchService } from '../services/research.service';

export interface TikTokShopConnectionBannerProps {
  connection: TikTokShopConnectionPublic | null;
  onRefresh: () => void;
}

export const TikTokShopConnectionBanner: React.FC<TikTokShopConnectionBannerProps> = ({
  connection,
  onRefresh,
}) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const isConnected = connection?.status === 'CONNECTED';

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const redirectUri = `${window.location.origin}/settings`;
      const authData = await researchService.getAuthUrl(redirectUri);
      // Redirect to TikTok Shop OAuth
      window.location.href = authData.auth_url;
    } catch {
      setIsGuideOpen(true);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn ngắt kết nối tài khoản TikTok Shop?')) {
      return;
    }
    try {
      setIsDisconnecting(true);
      await researchService.disconnectTikTokShop();
      onRefresh();
    } catch {
      alert('Không thể ngắt kết nối');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : 'bg-amber-50 text-amber-600 border border-amber-100'
              }`}
            >
              <Store className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-slate-900">
                  {isConnected
                    ? `Đã kết nối: ${connection?.account_name || 'TikTok Shop Account'}`
                    : 'Nguồn dữ liệu TikTok Shop Open Platform'}
                </h4>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    Thị trường {connection?.market || 'VN'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <AlertTriangle className="w-3 h-3" />
                    {connection?.status === 'NOT_CONFIGURED' ? 'Chưa cấu hình API' : 'Chưa kết nối'}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                {isConnected
                  ? 'Đang truy vấn trực tiếp từ TikTok Shop Affiliate Marketplace với quyền Creator Open Collaboration.'
                  : 'Để tra cứu sản phẩm affiliate thời trang với giá bán, hoa hồng và dữ liệu thương mại có thật, vui lòng kết nối tài khoản TikTok Shop chính thức.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsGuideOpen(true)}
              className="text-xs text-slate-600 gap-1.5"
            >
              <Info className="w-3.5 h-3.5" />
              Hướng dẫn ủy quyền
            </Button>

            {isConnected ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1.5"
              >
                {isDisconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unplug className="w-3.5 h-3.5" />}
                Ngắt kết nối
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isConnecting}
                className="text-xs bg-slate-900 hover:bg-black text-white font-medium gap-1.5 shadow-sm"
              >
                {isConnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                Kết nối TikTok Shop
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Guide Dialog */}
      <Dialog
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="Hướng dẫn kết nối TikTok Shop Open Platform"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>
            TrendMotion Studio tuân thủ nghiêm ngặt nguyên tắc <strong>dữ liệu thương mại có thật</strong> từ
            TikTok Shop Open Platform & Affiliate API, không sử dụng web scraping trái phép:
          </p>

          <ol className="list-decimal pl-4 space-y-2.5 font-medium text-slate-700">
            <li>
              Đăng ký tài khoản Partner/ISV tại{' '}
              <a
                href="https://partner.tiktokshop.com"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 underline font-semibold"
              >
                partner.tiktokshop.com
              </a>.
            </li>
            <li>Tạo ứng dụng mới và chọn thị trường mục tiêu là <strong>Việt Nam (VN)</strong>.</li>
            <li>
              Yêu cầu các quyền truy cập (Scopes):
              <ul className="list-disc pl-4 mt-1 font-mono text-[11px] text-slate-600 space-y-0.5">
                <li>affiliate_creator.open_collaboration.read</li>
                <li>affiliate_creator.product.read</li>
              </ul>
            </li>
            <li>Cấu hình biến môi trường tại Backend: <code className="bg-slate-100 px-1 py-0.5 rounded">TIKTOK_SHOP_APP_KEY</code> và <code className="bg-slate-100 px-1 py-0.5 rounded">TIKTOK_SHOP_APP_SECRET</code>.</li>
            <li>Nhấn <strong>Kết nối TikTok Shop</strong> để hoàn tất ủy quyền OAuth2.</li>
          </ol>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              Nếu ứng dụng chưa được cấp quyền Affiliate Marketplace, hệ thống sẽ bảo đảm trung thực hiển thị
              trạng thái chưa kết nối thay vì sử dụng dữ liệu giả.
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={() => setIsGuideOpen(false)}>
              Đã hiểu
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
};
