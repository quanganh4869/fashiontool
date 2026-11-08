import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Unlink,
  Link,
  RefreshCw,
  Info,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { TikTokShopConnectionPublic } from '../product-research/types/research.types';
import { researchService } from '../product-research/services/research.service';

export const SettingsPage: React.FC = () => {
  const [connection, setConnection] = useState<TikTokShopConnectionPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchConnection = async () => {
    setIsLoading(true);
    try {
      const data = await researchService.getTikTokShopStatus();
      setConnection(data);
    } catch {
      setConnection(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnection();
  }, []);

  const handleConnect = async () => {
    setIsActionLoading(true);
    setMessage(null);
    try {
      const redirectUri = `${window.location.origin}/settings`;
      const res = await researchService.getAuthUrl(redirectUri);
      if (res.auth_url) {
        window.open(res.auth_url, '_blank', 'noopener,noreferrer');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tạo URL kết nối';
      setMessage({ text: msg, type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy kết nối tài khoản TikTok Shop này?')) {
      return;
    }

    setIsActionLoading(true);
    setMessage(null);
    try {
      await researchService.disconnectTikTokShop();
      setMessage({ text: 'Đã hủy kết nối tài khoản TikTok Shop thành công.', type: 'success' });
      await fetchConnection();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi hủy kết nối';
      setMessage({ text: msg, type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <PageContainer
      title="Cài đặt hệ thống"
      description="Quản lý cấu hình tài khoản, liên kết tích hợp thương mại điện tử và các thiết lập Studio."
    >
      <div className="max-w-4xl space-y-6">
        {/* TikTok Shop Integration Section */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Tài khoản tích hợp TikTok Shop Open Platform
                </h3>
                <p className="text-xs text-slate-500">
                  Kết nối chính thức để truy vấn sản phẩm thời trang, thông tin hoa hồng và dữ liệu affiliate thực tế
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={fetchConnection}
              disabled={isLoading || isActionLoading}
              className="inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </Button>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-6">
            {message && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            {isLoading ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Đang tải thông tin kết nối TikTok Shop...
              </div>
            ) : !connection || connection.status === 'NOT_CONFIGURED' ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold mb-1">Chưa cấu hình ứng dụng đối tác (TikTok Shop Partner App)</h4>
                    <p className="text-amber-800 leading-relaxed">
                      Hệ thống tuân thủ nguyên tắc không cào dữ liệu lậu (zero scraping). Để kết nối API chính thức,
                      hãy tạo tài khoản trên TikTok Shop Partner Center và điền các khóa cấu hình vào file <code>.env</code> của Backend.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                  <div className="font-semibold text-slate-800">Các biến môi trường bắt buộc:</div>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] overflow-x-auto font-mono">
                    TIKTOK_SHOP_APP_KEY=your_partner_app_key{'\n'}
                    TIKTOK_SHOP_APP_SECRET=your_partner_app_secret{'\n'}
                    TIKTOK_SHOP_AUTH_URL=https://services.tiktokshop.com/open/authorize{'\n'}
                    TIKTOK_SHOP_API_HOST=https://open-api.tiktokglobalshop.com
                  </pre>
                </div>
              </div>
            ) : connection.status === 'CONNECTED' ? (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-900">
                          Đã kết nối tài khoản TikTok Shop
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-200 text-emerald-800">
                          ACTIVE
                        </span>
                      </div>
                      <div className="text-xs text-emerald-800 font-medium mt-0.5">
                        {connection.account_name || 'TikTok Shop Merchant'} ({connection.seller_id || connection.connection_id})
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={isActionLoading}
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 inline-flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Hủy kết nối</span>
                  </Button>
                </div>

                {/* Connection details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-slate-400 block text-[11px]">Thị trường mục tiêu</span>
                    <span className="font-semibold text-slate-800">
                      {connection.market || 'VN (Việt Nam)'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-slate-400 block text-[11px]">Thời hạn ủy quyền</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {connection.expires_at
                        ? new Date(connection.expires_at).toLocaleString('vi-VN')
                        : 'Ủy quyền dài hạn'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Quyền hạn đã cấp (Scopes)</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {connection.scopes.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-mono text-slate-600"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500">
                      <Link className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {connection.status === 'REAUTH_REQUIRED'
                          ? 'Phiên ủy quyền đã hết hạn'
                          : 'Tài khoản chưa được kết nối'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Ủy quyền ứng dụng để truy cập kho sản phẩm TikTok Shop Affiliate
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={handleConnect}
                    disabled={isActionLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Kết nối tài khoản ngay</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Compliance & Privacy Note */}
            <div className="p-3.5 bg-slate-50/60 border border-slate-100 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-500">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <strong>Bảo mật & Tuân thủ:</strong> Hệ thống lưu trữ token an toàn tại Backend server,
                tự động làm mới bằng <code>refresh_token</code> trước khi hết hạn và tuyệt đối không lưu
                access token trên trình duyệt người dùng hoặc mã nguồn mở.
              </div>
            </div>
          </div>
        </div>

        {/* General Application Preferences */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Tùy chọn Studio & Quản lý</h3>
              <p className="text-xs text-slate-500">Thiết lập mặc định cho quy trình sản xuất video</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <label className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/30">
              <div>
                <span className="font-semibold text-slate-800 block">Tự động đối chiếu điểm cơ hội</span>
                <span className="text-[11px] text-slate-500">
                  Tính toán Opportunity Score theo công thức minh bạch 4 thành phần khi tìm kiếm
                </span>
              </div>
              <input type="checkbox" defaultChecked disabled className="rounded text-indigo-600" />
            </label>

            <label className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/30">
              <div>
                <span className="font-semibold text-slate-800 block">Kiểm tra tính tương thích Base Video</span>
                <span className="text-[11px] text-slate-500">
                  Bắt buộc Personalized Base Video đạt chuẩn trước khi thực hiện thay trang phục
                </span>
              </div>
              <input type="checkbox" defaultChecked disabled className="rounded text-indigo-600" />
            </label>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
