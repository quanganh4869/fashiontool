import React, { useState } from 'react';
import { Copy, Check, Sparkles, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { useToast } from '@/hooks/useToast';
import { PageContainer } from '@/components/layout/PageContainer';

export const DesignPreviewPage: React.FC = () => {
  const { showToast } = useToast();

  // State for buttons
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  // State for form control demo
  const [projectName, setProjectName] = useState('');
  const [projectError, setProjectError] = useState('');
  const [projectHelper, setProjectHelper] = useState('');

  // State for select demo
  const [selectedStyle, setSelectedStyle] = useState('minimalist');

  // State for dialog demo
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // State for color copy
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const COLOR_TOKENS = [
    { name: '--color-canvas', hex: '#F6F5F2', desc: 'Nền canvas toàn hệ thống' },
    { name: '--color-surface', hex: '#FFFFFF', desc: 'Bề mặt thẻ, thanh bên, topbar' },
    { name: '--color-surface-secondary', hex: '#FBFAF8', desc: 'Bề mặt phụ' },
    { name: '--color-text-primary', hex: '#242321', desc: 'Văn bản chính' },
    { name: '--color-text-secondary', hex: '#74716D', desc: 'Văn bản phụ' },
    { name: '--color-text-tertiary', hex: '#97938E', desc: 'Văn bản cấp 3 & label nhóm' },
    { name: '--color-border', hex: '#E8E5E0', desc: 'Đường viền tiêu chuẩn' },
    { name: '--color-border-emphasized', hex: '#D8D4CE', desc: 'Đường viền nhấn mạnh' },
    { name: '--color-brand-primary', hex: '#654B7B', desc: 'Thương hiệu tím trầm' },
    { name: '--color-brand-hover', hex: '#543C69', desc: 'Trạng thái hover tím' },
    { name: '--color-brand-active', hex: '#463253', desc: 'Trạng thái active tím' },
    { name: '--color-brand-light', hex: '#F2EDF5', desc: 'Nền mục được chọn' },
    { name: '--color-success', hex: '#367458', desc: 'Trạng thái thành công' },
    { name: '--color-warning', hex: '#9A6B26', desc: 'Trạng thái cảnh báo' },
    { name: '--color-error', hex: '#A94442', desc: 'Trạng thái lỗi' },
  ];

  const handleCopyColor = (hex: string, name: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedToken(name);
    showToast(`Đã sao chép mã màu ${hex}`, 'success', 2500);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleValidateForm = () => {
    if (!projectName.trim()) {
      setProjectError('Vui lòng nhập tên dự án');
      setProjectHelper('');
    } else {
      setProjectError('');
      setProjectHelper('Thông tin hợp lệ');
      showToast('Thông tin biểu mẫu hợp lệ', 'success');
    }
  };

  const handleClearForm = () => {
    setProjectName('');
    setProjectError('');
    setProjectHelper('');
  };

  const handleTriggerLoading = () => {
    setIsButtonLoading(true);
    setTimeout(() => {
      setIsButtonLoading(false);
      showToast('Đã hoàn thành mô phỏng tác vụ', 'info');
    }, 2000);
  };

  return (
    <PageContainer
      title="Design System Preview"
      description="Trang kiểm tra các thành phần giao diện của TrendMotion Studio trong môi trường phát triển."
      className="space-y-12 pb-16"
    >
      {/* 1. COLOR TOKENS */}
      <section className="space-y-4">
        <div className="border-b border-[#E8E5E0] pb-2">
          <h2 className="text-xl font-bold text-[#242321]">1. Color Tokens</h2>
          <p className="text-xs text-[#74716D] mt-0.5">
            Màu sắc trung tính có chiều sâu kết hợp sắc tím trầm biên tập thời trang. Nhấp mã màu để sao chép.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {COLOR_TOKENS.map((token) => (
            <div
              key={token.name}
              onClick={() => handleCopyColor(token.hex, token.name)}
              className="p-3 bg-white rounded-lg border border-[#E8E5E0] hover:border-[#D8D4CE] transition-all cursor-pointer flex flex-col gap-2 group shadow-sm"
            >
              <div
                className="w-full h-12 rounded-md border border-black/10 flex items-center justify-center"
                style={{ backgroundColor: token.hex }}
              >
                {copiedToken === token.name && (
                  <Check className="w-4 h-4 text-white drop-shadow" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#242321] truncate">
                  {token.name}
                </span>
                <span className="text-[11px] font-mono text-[#74716D] flex items-center justify-between mt-0.5">
                  {token.hex}
                  <Copy className="w-3 h-3 text-[#97938E] group-hover:text-[#242321]" />
                </span>
                <span className="text-[11px] text-[#97938E] mt-1 line-clamp-1">
                  {token.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. TYPOGRAPHY */}
      <section className="space-y-4">
        <div className="border-b border-[#E8E5E0] pb-2">
          <h2 className="text-xl font-bold text-[#242321]">
            2. Typography (Be Vietnam Pro)
          </h2>
          <p className="text-xs text-[#74716D] mt-0.5">
            Kiểm tra khả năng hiển thị tiếng Việt có dấu đầy đủ (ă, â, ê, ô, ơ, ư, đ và thanh điệu) qua các cấp chữ.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl border border-[#E8E5E0] space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-mono text-[#97938E]">
              Display / Page Title — 30px / 700 / line-height 1.3
            </span>
            <div className="text-page-title">
              Thời trang TikTok Shop — Sản xuất video thời trang chất lượng cao với công nghệ AI
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono text-[#97938E]">
              Section Heading — 20px / 600 / line-height 1.4
            </span>
            <div className="text-section-title">
              Khám phá sản phẩm thời trang và theo dõi những cơ hội kinh doanh tiềm năng
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono text-[#97938E]">
              Card Heading — 16px / 600 / line-height 1.5
            </span>
            <div className="text-card-title">
              Áo sơ mi lụa cổ điển và đầm dạ hội xu hướng mùa thu 2026
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono text-[#97938E]">
              Small Heading — 14px / 600
            </span>
            <div className="text-small-heading">
              Chỉ số chuyển đổi và hoa hồng tiếp thị liên kết (Affiliate Commission)
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono text-[#97938E]">
              Body Text — 14px / 400 / line-height 1.6
            </span>
            <div className="text-body text-[#242321]">
              Nền tảng hỗ trợ nhà sáng tạo nội dung thời trang xây dựng quy trình từ khâu nghiên cứu dữ liệu sản phẩm TikTok Shop đến tạo video chuyển động ngắn với người mẫu ảo. Mọi số liệu và trạng thái đều được cập nhật minh bạch.
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono text-[#97938E]">
              Body Small — 13px / 400 / line-height 1.5
            </span>
            <div className="text-body-sm text-[#74716D]">
              Nội dung mô tả phụ trợ và chú thích thông tin kỹ thuật trong các bảng danh sách đối tượng dữ liệu.
            </div>
          </div>

          <div className="flex flex-wrap gap-8 pt-2 border-t border-[#E8E5E0]">
            <div>
              <span className="text-xs font-mono text-[#97938E] block mb-1">
                Form Label — 13px / 500
              </span>
              <span className="text-form-label text-[#242321]">
                Tên chiến dịch video
              </span>
            </div>
            <div>
              <span className="text-xs font-mono text-[#97938E] block mb-1">
                Caption / Tooltip — 12px / 400
              </span>
              <span className="text-caption text-[#74716D]">
                Thời gian cập nhật: 5 phút trước
              </span>
            </div>
            <div>
              <span className="text-xs font-mono text-[#97938E] block mb-1">
                Tabular Numbers — Tabular Figures
              </span>
              <span className="tabular-nums font-semibold text-sm text-[#242321]">
                1,250,000 đ — 450 Credits — 98.5%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BUTTONS */}
      <section className="space-y-4">
        <div className="border-b border-[#E8E5E0] pb-2">
          <h2 className="text-xl font-bold text-[#242321]">3. Buttons</h2>
          <p className="text-xs text-[#74716D] mt-0.5">
            4 biến thể (Primary, Secondary, Tertiary, Ghost) qua 3 kích thước (Small, Medium, Large) kèm trạng thái Loading.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl border border-[#E8E5E0] space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="md">
              Primary Button
            </Button>
            <Button variant="secondary" size="md">
              Secondary Button
            </Button>
            <Button variant="tertiary" size="md">
              Tertiary Button
            </Button>
            <Button variant="ghost" size="md">
              Ghost Button
            </Button>
            <Button variant="primary" size="md" disabled>
              Disabled Button
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#E8E5E0]">
            <Button variant="primary" size="sm">
              Small (32px)
            </Button>
            <Button variant="primary" size="md">
              Medium (40px)
            </Button>
            <Button variant="primary" size="lg">
              Large (44px)
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#E8E5E0]">
            <Button
              variant="primary"
              size="md"
              isLoading={isButtonLoading}
              onClick={handleTriggerLoading}
            >
              Thử trạng thái Loading
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsButtonLoading(false)}
            >
              Đặt lại trạng thái
            </Button>
            <span className="text-xs text-[#74716D]">
              (Dữ liệu tương tác thử nghiệm — không kết nối API thật)
            </span>
          </div>
        </div>
      </section>

      {/* 4. FORM CONTROLS */}
      <section className="space-y-4">
        <div className="border-b border-[#E8E5E0] pb-2">
          <h2 className="text-xl font-bold text-[#242321]">4. Form Controls</h2>
          <p className="text-xs text-[#74716D] mt-0.5">
            Input chuẩn 40px, hỗ trợ Label, Placeholder, Helper text, Trạng thái lỗi và Disabled.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl border border-[#E8E5E0] grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Input
              label="Tên dự án thời trang"
              placeholder="Nhập tên dự án (ví dụ: Thu Đông 2026)..."
              value={projectName}
              error={projectError}
              helperText={projectHelper}
              onChange={(e) => {
                setProjectName(e.target.value);
                if (projectError) setProjectError('');
              }}
            />

            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={handleValidateForm}>
                Kiểm tra biểu mẫu
              </Button>
              <Button variant="secondary" size="sm" onClick={handleClearForm}>
                Xóa nội dung
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Trường dữ liệu vô hiệu hóa"
              disabled
              defaultValue="Dữ liệu bị khóa không cho sửa"
            />
            <Input
              label="Trường có lỗi minh họa"
              error="Mã sản phẩm không đúng định dạng TikTok Shop"
              defaultValue="SP-ERR-001"
            />
          </div>
        </div>
      </section>

      {/* 5. SELECT & DROPDOWN */}
      <section className="space-y-4">
        <div className="border-b border-[#E8E5E0] pb-2">
          <h2 className="text-xl font-bold text-[#242321]">
            5. Select & Dropdown
          </h2>
          <p className="text-xs text-[#74716D] mt-0.5">
            Select có icon mũi tên đơn sắc, điều hướng bàn phím đầy đủ (Arrow Up/Down, Enter, Escape).
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl border border-[#E8E5E0] max-w-md">
          <Select
            label="Chọn phong cách thời trang"
            value={selectedStyle}
            onChange={(val) => {
              setSelectedStyle(val);
              showToast(`Đã chọn phong cách: ${val}`, 'info');
            }}
            options={[
              { value: 'minimalist', label: 'Tối giản (Minimalist)' },
              { value: 'streetwear', label: 'Thời trang đường phố (Streetwear)' },
              { value: 'elegant', label: 'Thanh lịch & Sang trọng (Elegant)' },
              { value: 'vintage', label: 'Cổ điển (Vintage Y2K)' },
            ]}
          />
        </div>
      </section>

      {/* 6. TABLE */}
      <section className="space-y-4">
        <div className="border-b border-[#E8E5E0] pb-2">
          <h2 className="text-xl font-bold text-[#242321]">6. Table</h2>
          <p className="text-xs text-[#74716D] mt-0.5">
            Cấu trúc Header (12px, 600, #74716D), Row (52px, hover #FAF9F7), Border #E8E5E0.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-[#74716D] italic">
            Dữ liệu trình diễn Design System — không phải dữ liệu sản phẩm thật
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên tài nguyên</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-[#242321]">
                  Tài nguyên minh họa 01
                </TableCell>
                <TableCell>Ảnh sản phẩm</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#EBF4F0] text-[#367458]">
                    Đã hoàn thành
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Xem chi tiết
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-[#242321]">
                  Tài nguyên minh họa 02
                </TableCell>
                <TableCell>Video render</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#FBF4E8] text-[#9A6B26]">
                    Đang xử lý
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Xem chi tiết
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-[#242321]">
                  Tài nguyên minh họa 03
                </TableCell>
                <TableCell>Hồ sơ người mẫu</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#F6F5F2] text-[#74716D]">
                    Chưa xử lý
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Xem chi tiết
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* 7. TABS */}
      <section className="space-y-4">
        <div className="border-b border-[#E8E5E0] pb-2">
          <h2 className="text-xl font-bold text-[#242321]">7. Tabs</h2>
          <p className="text-xs text-[#74716D] mt-0.5">
            Thay đổi nội dung thực tế khi nhấp chọn tab.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl border border-[#E8E5E0]">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Tổng quan</TabsTrigger>
              <TabsTrigger value="details">Chi tiết</TabsTrigger>
              <TabsTrigger value="history">Lịch sử</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="p-4 rounded-lg bg-[#FBFAF8] border border-[#E8E5E0] text-sm text-[#242321]">
                <strong>Tab Tổng quan:</strong> Trình bày thông tin tổng hợp của đối tượng làm việc và các chỉ dẫn nhanh.
              </div>
            </TabsContent>

            <TabsContent value="details">
              <div className="p-4 rounded-lg bg-[#FBFAF8] border border-[#E8E5E0] text-sm text-[#242321]">
                <strong>Tab Chi tiết:</strong> Hiển thị các thông số kỹ thuật, cấu hình thuộc tính thời trang và các tùy chọn.
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="p-4 rounded-lg bg-[#FBFAF8] border border-[#E8E5E0] text-sm text-[#242321]">
                <strong>Tab Lịch sử:</strong> Ghi nhận nhật ký thay đổi trạng thái, phiên bản và các hoạt động trước đó.
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* 8. DIALOG */}
      <section className="space-y-4">
        <div className="border-b border-[#E8E5E0] pb-2">
          <h2 className="text-xl font-bold text-[#242321]">8. Dialog (Modal)</h2>
          <p className="text-xs text-[#74716D] mt-0.5">
            Hộp thoại modal 540px, khóa focus, phím Escape đóng, nút Hủy trước nút Xác nhận.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl border border-[#E8E5E0]">
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsDialogOpen(true)}
          >
            Mở hộp thoại thử nghiệm
          </Button>

          <Dialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            title="Xác nhận thao tác thử nghiệm"
            description="Đây là hộp thoại dùng để kiểm tra trạng thái và khả năng tương tác của Dialog."
            confirmLabel="Xác nhận"
            cancelLabel="Hủy"
            onConfirm={() => {
              setIsDialogOpen(false);
              showToast('Đã xác nhận thao tác thử nghiệm', 'success');
            }}
          >
            <p className="text-sm text-[#74716D] leading-relaxed">
              Thao tác này kiểm tra tính năng đóng mở mượt mà, bẫy tiêu điểm (focus trap) và thứ tự nút bấm theo tiêu chuẩn giao diện TrendMotion Studio.
            </p>
          </Dialog>
        </div>
      </section>

      {/* 9. EMPTY STATE & SKELETON */}
      <section className="space-y-4">
        <div className="border-b border-[#E8E5E0] pb-2">
          <h2 className="text-xl font-bold text-[#242321]">
            9. Empty State & Skeleton
          </h2>
          <p className="text-xs text-[#74716D] mt-0.5">
            Trạng thái trống không dùng hình vẽ quá lớn, Skeleton mô phỏng hình khối nội dung sắp tải.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EmptyState
            icon={FolderKanban}
            title="Chưa có tài nguyên"
            description="Các tài nguyên sẽ xuất hiện tại đây khi được thêm vào hệ thống."
            action={
              <Button variant="secondary" size="sm">
                Tạo tài nguyên mới
              </Button>
            }
          />

          <div className="p-6 bg-white rounded-xl border border-[#E8E5E0] space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton variant="circular" className="w-10 h-10" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-28 w-full" />
            <div className="flex justify-end gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      </section>

      {/* 10. APP SHELL PREVIEW */}
      <section className="space-y-4">
        <div className="border-b border-[#E8E5E0] pb-2">
          <h2 className="text-xl font-bold text-[#242321]">
            10. App Shell Architecture Summary
          </h2>
          <p className="text-xs text-[#74716D] mt-0.5">
            Xác nhận kiến trúc App Shell hoạt động ổn định trên toàn bộ ứng dụng.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl border border-[#E8E5E0] space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#367458]">
            <Sparkles className="w-4 h-4" />
            <span>App Shell Verified: Sidebar 252px/72px, Topbar 64px, Fluid Main Canvas #F6F5F2</span>
          </div>
          <p className="text-xs text-[#74716D] leading-relaxed">
            Bạn có thể thử nghiệm tính năng thu gọn thanh bên bằng nút ở góc dưới Sidebar bên trái, hoặc thay đổi kích thước cửa sổ trình duyệt để quan sát chế độ Mobile Drawer hoạt động.
          </p>
        </div>
      </section>
    </PageContainer>
  );
};
