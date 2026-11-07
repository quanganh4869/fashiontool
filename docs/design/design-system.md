# Quy Chuẩn Hệ Thống Thiết Kế (Design System Specification)

> **TrendMotion Studio — Fashion Commerce Workbench**  
> Ngôn ngữ thiết kế chuyên biệt cho nghiên cứu sản phẩm TikTok Shop và sản xuất video thương mại điện tử thời trang. Thiết kế tối ưu hóa cho công việc tập trung cao độ, mang cảm giác thanh lịch, editorial và không gian làm việc chuyên nghiệp.

---

## 1. Triết Lý Thiết Kế: Fashion Commerce Workbench

TrendMotion Studio không sử dụng các bảng màu neon, hiệu ứng gradient sặc sỡ hay phong cách công cụ AI đại trà. Ứng dụng được xây dựng theo phong cách **Bàn làm việc biên tập thời trang (Fashion Commerce Workbench)** với 3 nguyên tắc nền tảng:
1. **Visual & Data Balance (Cân bằng giữa Hình ảnh & Dữ liệu):** Sản phẩm thời trang luôn cần được quan sát rõ ràng về chất liệu, form dáng, trong khi các chỉ số thương mại (giá bán, doanh số ước tính, tỷ lệ hoa hồng affiliate) được hiển thị sắc nét, thẳng hàng với phông số Tabular Figures.
2. **Context-Preserving Workflow (Duy trì Ngữ cảnh):** Tránh các lớp bọc thẻ lồng nhau (card-in-card) gây choáng ngợp; ưu tiên phân cách bằng khoảng trắng 4px chuẩn mực, đường viền mảnh 1px và nền phân tầng nhẹ.
3. **Calm Editorial Palette (Bảng màu tĩnh lặng có chiều sâu):** Nền canvas màu kem ấm `#F6F5F2` phối hợp với bề mặt trắng tinh khiết `#FFFFFF` và điểm nhấn thương hiệu tím mận trầm `#654B7B` tạo sự tập trung tối đa cho người sáng tạo nội dung.

---

## 2. Hệ Thống Màu Sắc (Color Tokens)

Mọi giá trị màu được khai báo tập trung trong `apps/web/src/styles/tokens.css` và tích hợp qua Tailwind CSS:

| Token Name | Mã HEX / RGBA | Vai trò & Ứng dụng |
| :--- | :--- | :--- |
| `--color-canvas` | `#F6F5F2` | Nền canvas toàn hệ thống, tạo cảm giác êm dịu cho mắt khi làm việc thời gian dài |
| `--color-surface` | `#FFFFFF` | Nền bề mặt chính: Sidebar, Topbar, Card, Dropdown menu, Modal Dialog |
| `--color-surface-secondary` | `#FBFAF8` | Nền bề mặt phụ: Bảng điều khiển phụ, chân trang Modal, header của Table |
| `--color-surface-hover` | `#F7F6F4` | Trạng thái hover của nút phụ, menu item, table row |
| `--color-surface-active` | `#F2EDF5` | Nền trạng thái đang được chọn (Active) của menu item |
| `--color-text-primary` | `#242321` | Màu văn bản chính: Tiêu đề, nhãn biểu mẫu, nội dung bài đọc |
| `--color-text-secondary` | `#74716D` | Màu văn bản phụ: Đoạn mô tả, chú thích bảng, trạng thái chờ |
| `--color-text-tertiary` | `#97938E` | Màu văn bản cấp ba: Tên nhóm menu Sidebar, placeholder input |
| `--color-text-muted` | `#5C5955` | Màu menu điều hướng mặc định |
| `--color-border` | `#E8E5E0` | Đường viền tiêu chuẩn giữa các phần tử, phân cách hàng bảng |
| `--color-border-emphasized` | `#D8D4CE` | Đường viền nhấn mạnh: Input borders, đường viền thẻ tương tác |
| `--color-brand-primary` | `#654B7B` | Sắc tím mận trầm: Nút bấm chính (Primary), focus state, active indicator |
| `--color-brand-hover` | `#543C69` | Trạng thái hover của hành động thương hiệu |
| `--color-brand-active` | `#463253` | Trạng thái nhấn (active) của hành động thương hiệu |
| `--color-brand-light` | `#F2EDF5` | Nền nhấn thương hiệu nhạt cho menu active |
| `--color-brand-ring` | `rgba(101, 75, 123, 0.25)` | Vòng focus tiếp cận (focus ring) theo chuẩn accessibility |
| `--color-success` | `#367458` | Trạng thái hoàn tất thành công, chỉ số tăng trưởng tích cực |
| `--color-warning` | `#9A6B26` | Trạng thái cảnh báo, tác vụ đang render trong hàng đợi |
| `--color-error` | `#A94442` | Trạng thái lỗi hệ thống, cảnh báo thất bại, trường nhập sai |
| `--color-tooltip-bg` | `#292725` | Nền đen khói cho Tooltip nội dung |
| `--color-overlay` | `rgba(36, 35, 33, 0.4)` | Lớp phủ nền mờ nhẹ khi mở Dialog hoặc Mobile Drawer |

---

## 3. Hệ Thống Chữ (Typography)

- **Font chữ chính thức:** **Be Vietnam Pro** (tải qua gói `@fontsource/be-vietnam-pro` cục bộ, fallback Google Fonts CDN). Hỗ trợ chuẩn xác 100% các ký tự tiếng Việt có dấu (`ă`, `â`, `ê`, `ô`, `ơ`, `ư`, `đ` và các tổ hợp thanh điệu phức tạp).
- **Quy chuẩn thang cỡ chữ & Weight:**

| Cấp bậc | Font Size | Weight | Line Height | Ứng dụng thực tế |
| :--- | :--- | :--- | :--- | :--- |
| **Page Title** | 30px | 700 (Bold) | 1.3 | Tiêu đề đầu trang (H1) trong Page Container |
| **Section Heading** | 20px | 600 (SemiBold)| 1.4 | Tiêu đề từng phân khu chức năng lớn |
| **Card Heading** | 16px | 600 (SemiBold)| 1.5 | Tiêu đề hộp thoại, tiêu đề thẻ sản phẩm |
| **Small Heading** | 14px | 600 (SemiBold)| 1.4 | Tiêu đề mục nhỏ, tiêu đề cột quan trọng |
| **Body Regular** | 14px | 400 (Regular) | 1.6 | Nội dung văn bản thông thường, mô tả chi tiết |
| **Body Small** | 13px | 400 (Regular) | 1.5 | Nội dung ô bảng, thông tin phụ, hướng dẫn |
| **Form Label** | 13px | 500 (Medium)  | 1.4 | Nhãn phía trên các trường nhập liệu |
| **Button Text** | 14px | 500 / 600     | 1.0 | Văn bản trong nút bấm tương tác |
| **Caption / Tooltip**| 12px | 400 (Regular) | 1.4 | Chú thích thời gian, nội dung Tooltip |
| **Group Label** | 11px | 600 (SemiBold)| 1.2 | Tên nhóm điều hướng Sidebar (letter-spacing 0.5px, uppercase) |

- **Tabular Numerals (`tabular-nums`):** Áp dụng thuộc tính `font-variant-numeric: tabular-nums` cho số tiền, chỉ số phần trăm hoa hồng và số dư credit nhằm căn thẳng hàng theo cột dọc.

---

## 4. Kích Thước, Khoảng Cách & Hình Dáng Component

### 4.1. Thang khoảng cách (Spacing Scale — 4px Base)
- `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `28px`, `32px`, `40px`, `48px`, `56px`, `64px`.
- Desktop Main Canvas padding: `32px` (giảm xuống `28px` ở màn hình vừa, `16px` ở mobile).

### 4.2. Chiều cao chuẩn các phần tử điều khiển (Component Heights)
- **Buttons:**
  - `sm`: 32px (thao tác phụ, nút trong hàng bảng).
  - `md`: 40px (chuẩn mặc định cho toàn bộ ứng dụng).
  - `lg`: 44px (hành động kêu gọi then chốt).
- **Input & Select:** Cố định 40px (vùng bấm tối thiểu không dưới 36px).
- **Table Row:** Chiều cao mặc định 52px (đảm bảo độ thoáng khi đọc nhiều dòng dữ liệu).
- **Topbar:** Chiều cao cố định 64px.
- **Sidebar Menu Item:** Chiều cao cố định 42px.

### 4.3. Bo góc (Border Radius)
- `8px` (`--radius-md`): Button, Input, Select, Dropdown Menu.
- `10px` (`--radius-lg`): Thẻ Card thông thường.
- `12px` (`--radius-xl`): Hộp thoại Modal Dialog và Empty State container.
- `6px` (`--radius-sm`): Tooltip và nhãn huy hiệu (Badges).

### 4.4. Đổ bóng (Shadows) & Chuyển động (Transitions)
- Chỉ áp dụng đổ bóng cho các lớp nổi (Elevated Surfaces): Dropdown (`--shadow-dropdown`), Modal (`--shadow-modal`). Các card làm việc ưu tiên viền mảnh 1px `#E8E5E0`.
- Thời gian chuyển trạng thái: 140ms (`--transition-fast`), 180ms (`--transition-normal`), 200ms (`--transition-sidebar`) với easing tự nhiên `cubic-bezier(0.4, 0, 0.2, 1)`.

---

## 5. Danh Mục Component Dùng Chung Đã Triển Khai

| Component | Vị trí Source Code | Mô tả & Trạng thái hỗ trợ |
| :--- | :--- | :--- |
| **Button** | `components/ui/Button.tsx` | 4 variants: Primary (`#654B7B`), Secondary (White border), Tertiary (`#F4F2EF`), Ghost. Hỗ trợ hover, active, focus-visible, disabled, loading (spinner 14px, cố định kích thước, chống double submit). |
| **Input** | `components/ui/Input.tsx` | Nhãn Label phía trên (13px 500), border `#D8D4CE`, focus brand ring, hiển thị helperText và errorMessage trực tiếp bên dưới. |
| **Select** | `components/ui/Select.tsx` | Chiều cao 40px, chevron arrow bên phải, dropdown menu mở dưới, điều hướng phím mũi tên, Enter chọn, Escape đóng. |
| **DropdownMenu** | `components/ui/DropdownMenu.tsx`| Menu trắng bóng đổ nhẹ, đóng khi click ra ngoài hoặc nhấn Escape, item cao 36px có hover background. |
| **Dialog (Modal)**| `components/ui/Dialog.tsx` | Modal tối đa 540px, khóa focus bên trong (focus trap), Escape đóng, overlay mờ nhẹ, nút Hủy đứng trước nút Xác nhận. |
| **Tooltip** | `components/ui/Tooltip.tsx` | Nền `#292725`, chữ trắng 12px, độ trễ 300ms, hỗ trợ 4 hướng (top/bottom/left/right) không che nội dung. |
| **Table** | `components/ui/Table.tsx` | Table, TableHeader, TableBody, TableRow (52px), TableHead (12px 600 `#74716D`), TableCell. Hỗ trợ TableStateRow (Loading, Empty, Error). |
| **Tabs** | `components/ui/Tabs.tsx` | Tabs, TabsList, TabsTrigger, TabsContent. Chuyển đổi nội dung thật, đường line chỉ dẫn 2px bên dưới tab active. |
| **EmptyState** | `components/feedback/EmptyState.tsx`| Hộp viền đứt nét thanh lịch, icon đơn sắc trong vòng tròn `#F6F5F2`, tiêu đề và mô tả giải thích trạng thái. |
| **Skeleton** | `components/feedback/Skeleton.tsx` | Xung chuyển động mềm (animate-pulse), mô phỏng chính xác hình khối text, chữ nhật hoặc hình tròn avatar. |
| **Toast** | `components/feedback/Toast.tsx` | Quản lý thông báo toast toàn cục qua `useToast()`. Hỗ trợ 4 loại: `success`, `warning`, `error`, `info`. |

---

## 6. Môi Trường Kiểm Thử Design Playground (`/__design-preview`)

Hệ thống thiết lập sẵn route phát triển `/__design-preview` (được bảo vệ chỉ hoạt động khi `import.meta.env.DEV === true`, không xuất hiện trên thanh Sidebar và tự động bị loại bỏ khỏi production build).

Trang này tổ chức thành 10 khu vực độc lập để thẩm định toàn diện:
1. **Color Tokens:** Bảng màu trực quan, cho phép nhấp để sao chép mã HEX và phản hồi Toast tức thì.
2. **Typography:** Đoạn văn bản tiếng Việt mẫu kiểm tra trọn vẹn dấu câu qua 8 cấp bậc.
3. **Buttons:** Trải nghiệm đầy đủ 4 biến thể, 3 kích cỡ và kích hoạt mô phỏng tác vụ Loading 2 giây.
4. **Form Controls:** Kiểm thử biểu mẫu tương tác với trường `Tên dự án` (rỗng báo lỗi, có chữ báo hợp lệ, nút xóa).
5. **Select & Dropdown:** Thử nghiệm chọn các phong cách thời trang (Tối giản, Streetwear, Elegant).
6. **Table:** Bảng trình diễn đối tượng tài nguyên minh họa 3 cột kèm chú thích dữ liệu demo.
7. **Tabs:** Chuyển đổi qua lại giữa 3 tab Tổng quan, Chi tiết, Lịch sử với nội dung phản hồi thực tế.
8. **Dialog:** Nút mở modal xác nhận có tiêu đề, nội dung và nút Hủy/Xác nhận phản hồi Toast.
9. **Empty State & Skeleton:** So sánh đối sánh giữa trạng thái trống chưa có tài nguyên và khối tải trước dữ liệu.
10. **App Shell Summary:** Xác nhận toàn vẹn bố cục khung ứng dụng.
