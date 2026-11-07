# Đặc tả Thiết kế & Trải nghiệm Người dùng: Module Model Management

Tài liệu này quy định chi tiết cấu trúc giao diện, kích thước, typography, hành vi tương tác và các trạng thái của module Quản lý Người mẫu (Model Management) trong TrendMotion Studio.

---

## 1. Tổng quan Module & Cấu trúc Điều hướng

### 1.1. Hệ thống Route
- `/models`: Thư viện Người mẫu (Model Library).
- `/models/:modelId/setup/identity`: Bước 1 Wizard — Thông tin người mẫu.
- `/models/:modelId/setup/photos`: Bước 2 Wizard — Hình ảnh tham chiếu & Cam kết bản quyền.
- `/models/:modelId/setup/review`: Bước 3 Wizard — Kiểm tra & Hoàn tất hồ sơ.
- `/models/:modelId`: Trang Chi tiết Người mẫu (Model Detail).
- `/models/:modelId/edit`: Trang Chỉnh sửa Người mẫu (Model Edit).

### 1.2. Design System Tokens sử dụng
- **Font chữ**: Be Vietnam Pro (100% ứng dụng).
- **Màu nền Canvas**: `#F6F5F2`.
- **Màu nền Bề mặt (Surface)**: `#FFFFFF`.
- **Màu viền (Border)**: `#E8E5E0`, nét đứt `#D8D4CE`.
- **Màu chữ chính**: `#242321`.
- **Màu chữ phụ (Muted)**: `#74716D`.
- **Màu thương hiệu (Brand)**: `#654B7B` (hover `#543C69`, focus ring `#654B7B/20`, light pill `#F2EDF5`).
- **Màu trạng thái văn bản**:
  - Sẵn sàng (`READY`): `#367458`
  - Bản nháp (`DRAFT`): `#74716D`
  - Đã lưu trữ (`ARCHIVED`): `#9A6B26`
  - Lỗi (`ERROR`): `#A94442`

---

## 2. Trang Thư viện Người mẫu (`/models`)

### 2.1. Header
- **Tiêu đề H1**: `Người mẫu` (30px, weight 700, line-height 1.3, màu `#242321`).
- **Mô tả**: `Quản lý hồ sơ người mẫu và hình ảnh tham chiếu để sử dụng trong các dự án video.` (14px, weight 400, màu `#74716D`, khoảng cách đến H1 là 8px).
- **Nút hành động**: Primary Button `Tạo người mẫu` (chiều cao 40px, icon `Plus` 16px ở bên trái).
  - Khi click: Gọi API tạo bản nháp `POST /api/v1/models/draft` lấy `modelId`, sau đó điều hướng tới `/models/:modelId/setup/identity`.

### 2.2. Toolbar Tìm kiếm & Lọc
- **Input Tìm kiếm**:
  - Label: `Tìm người mẫu`.
  - Placeholder: `Nhập tên hoặc mã người mẫu`.
  - Hỗ trợ lọc theo `displayName` và `modelCode`.
- **Bộ lọc Trạng thái**:
  - 4 lựa chọn: `Tất cả` (`ALL`), `Sẵn sàng` (`READY`), `Bản nháp` (`DRAFT`), `Đã lưu trữ` (`ARCHIVED`).
- **Dropdown Sắp xếp**:
  - `Mới cập nhật` (`updated_at_desc`), `Tạo gần đây nhất` (`created_at_desc`), `Tên A–Z` (`name_asc`).
- **Nút chuyển đổi View**: Grid (mặc định) và List.

### 2.3. Model Card (Grid View)
- **Tỷ lệ ảnh cover**: Dọc 4:5 hoặc 3:4, bo góc `rounded-lg`, `object-fit: cover`.
  - Nếu chưa có ảnh: Hiển thị placeholder nền trung tính `#F6F5F2` với chữ `Chưa có ảnh đại diện` và icon `UserRound`.
- **Tên người mẫu**: 16px, weight 600, màu `#242321`, hover chuyển `#654B7B`.
- **Mã hồ sơ**: 12px, màu `#74716D` (ví dụ `MOD-000101`).
- **Số ảnh tham chiếu**: 12px, màu `#74716D` (ví dụ `05 ảnh tham chiếu`).
- **Trạng thái**: Nhãn chữ tinh tế (không dùng badge rực rỡ):
  - `Sẵn sàng`: Màu `#367458`
  - `Bản nháp`: Màu `#74716D`
  - `Đã lưu trữ`: Màu `#9A6B26`
- **Menu hành động góc trên**: Nút `MoreHorizontal` với vùng bấm tối thiểu 36x36px.
  - Ngăn click nổi bọt (`e.stopPropagation()`).
  - Menu hiển thị các mục tương ứng:
    - Hồ sơ READY: `Xem hồ sơ`, `Chỉnh sửa`, `Lưu trữ`.
    - Hồ sơ ARCHIVED: `Xem hồ sơ`, `Khôi phục hồ sơ`.
    - Hồ sơ DRAFT: `Tiếp tục cài đặt`, `Xóa bản nháp`.
- **Click card**: Điều hướng vào trang chi tiết `/models/:modelId`.

### 2.4. Trạng thái Rỗng & Lỗi
- **Chưa có người mẫu**: Tiêu đề `Chưa có người mẫu nào`, mô tả `Tạo hồ sơ đầu tiên bằng những hình ảnh người mẫu do bạn cung cấp.`, hiển thị nút `Tạo người mẫu`.
- **Không tìm thấy kết quả lọc**: Tiêu đề `Không tìm thấy người mẫu phù hợp`, mô tả `Thử một tên hoặc mã người mẫu khác.`, hiển thị nút `Xóa tìm kiếm`.
- **Lỗi tải dữ liệu**: `Không thể tải danh sách người mẫu` kèm nút `Thử lại`.

---

## 3. Quy trình Tạo Người mẫu 3 Bước (Wizard)

### 3.1. Cấu trúc Chung của Wizard
- **Breadcrumb**: `Người mẫu` / `Tạo người mẫu`. Click `Người mẫu` mở hộp thoại xác nhận lưu nháp và thoát.
- **Tiêu đề**: `Tạo hồ sơ người mẫu` (28px, 700), mô tả `Thêm hình ảnh và thông tin để tạo một hồ sơ người mẫu có thể tái sử dụng.`
- **Stepper 3 bước**:
  - Bước 1: `Thông tin người mẫu`
  - Bước 2: `Hình ảnh tham chiếu`
  - Bước 3: `Kiểm tra và hoàn tất`
  - Trạng thái trực quan: Số thứ tự tròn, tên bước, thanh nối. Cho phép click lùi lại bước trước đã hoàn thành. Khóa không cho nhảy tới bước chưa đạt điều kiện.

### 3.2. Bước 1 — Thông tin Người mẫu (`/setup/identity`)
- **Tiêu đề khu vực**: `Thông tin người mẫu`.
- **Mô tả**: `Đặt tên và ghi chú cho hồ sơ người mẫu để dễ dàng quản lý khi có nhiều người mẫu khác nhau.`
- **Trường Tên người mẫu** (Bắt buộc):
  - Label: `Tên người mẫu *`.
  - Placeholder: `Ví dụ: Linh, Linh Fashion, Mẫu chụp số 01`.
  - Giới hạn: 2 đến 60 ký tự, tự động cắt khoảng trắng đầu/cuối (trim).
  - Validation: Không cho phép chuỗi rỗng hoặc toàn khoảng trắng.
- **Trường Mô tả hoặc ghi chú** (Tùy chọn):
  - Textarea tối đa 500 ký tự.
  - Placeholder: `Thêm ghi chú để phân biệt hồ sơ người mẫu này...`.
- **Trường Mã người mẫu** (Readonly):
  - Label: `Mã người mẫu`.
  - Hiển thị giá trị mã do Backend cấp (ví dụ `MOD-000102`).
- **Nút hành động cuối trang**:
  - Trái: `Hủy tạo` → Mở Dialog `Thoát quy trình tạo người mẫu?`.
    - Hai lựa chọn: `Ở lại` và `Lưu bản nháp và thoát` (lưu draft rồi quay về `/models`).
  - Phải: `Lưu và tiếp tục` → Kiểm tra hợp lệ, gọi API lưu thông tin draft `PATCH /api/v1/models/:modelId/identity`, sau khi Backend xác nhận thành công mới chuyển sang bước 2.

### 3.3. Bước 2 — Hình ảnh Tham chiếu (`/setup/photos`)
- **Tiêu đề khu vực**: `Hình ảnh tham chiếu`.
- **Mô tả**: `Tải lên những hình ảnh của cùng một người mẫu để hệ thống lưu thành một hồ sơ thống nhất.`
- **Vùng Upload Kéo - Thả**:
  - Chiều cao ~180px, bo góc 12px, nền `#FBFAF8`, viền nét đứt `#D8D4CE`.
  - Khi drag file vào: Đổi viền `#654B7B`, nền `#F2EDF5`, chữ `Thả ảnh để thêm vào hồ sơ`.
  - Tiêu đề: `Kéo thả ảnh người mẫu vào đây`.
  - Phụ đề: `Hoặc chọn ảnh từ thiết bị của bạn.`
  - Nút `Chọn ảnh` mở File Picker của hệ điều hành, hỗ trợ chọn nhiều ảnh cùng lúc (`multiple`).
- **Quy tắc Kiểm tra File**:
  - Định dạng hợp lệ: JPEG (`.jpg`, `.jpeg`), PNG (`.png`), WebP (`.webp`).
  - Dung lượng tối đa: 20MB / file.
  - Số lượng tối đa: 20 ảnh / hồ sơ.
  - Kích thước khuyến nghị: Cạnh ngắn tối thiểu 512px.
- **Hàng đợi Upload (Per-file Queue)**:
  - Hiển thị thumbnail xem trước, tên file, dung lượng, thanh tiến trình % thực tế.
  - Các trạng thái: `Đang chờ`, `Đang tải lên`, `Đã tải lên`, `Đang kiểm tra`, `Tải lên thất bại`.
  - Nút `Thử lại` cho file bị lỗi upload.
- **Quản lý Tập ảnh đã Tải lên**:
  - Menu góc ảnh: `Đặt làm ảnh đại diện`, `Xem ảnh` (mở Lightbox), `Xóa ảnh` (mở modal xác nhận).
  - Badge `Ảnh đại diện` trên ảnh được chọn làm cover.
  - Hỗ trợ đổi thứ tự ảnh.
- **Lời khuyên**:
  - `Để sử dụng trong các video thời trang, nên cung cấp ảnh chân dung, ảnh toàn thân và thêm các góc nhìn khác nếu có.`
  - Cảnh báo nếu chỉ có 1 ảnh: Gợi ý thêm các góc ảnh để tăng khả năng tái tạo góc quay.
- **Hai Checkbox Bắt buộc (Không tích mặc định)**:
  1. `[ ] Tôi xác nhận tất cả ảnh trong hồ sơ này đều thuộc cùng một người mẫu.`
  2. `[ ] Tôi có quyền sử dụng những hình ảnh này cho mục đích tạo nội dung trong TrendMotion Studio.`
- **Nút hành động cuối trang**:
  - Trái: `Quay lại` → Về bước 1 giữ nguyên dữ liệu và ảnh.
  - Phải: `Lưu và tiếp tục` → Khóa (disabled) nếu chưa có ít nhất 1 ảnh tải lên thành công, hoặc còn upload đang chạy, hoặc chưa tích đủ 2 checkbox. Lưu trạng thái rồi chuyển sang bước 3.

### 3.4. Bước 3 — Kiểm tra và Hoàn tất (`/setup/review`)
- **Tiêu đề**: `Kiểm tra hồ sơ người mẫu`.
- **Mô tả**: `Kiểm tra lại thông tin và ảnh tham chiếu trước khi hoàn tất.`
- **Nội dung tổng hợp**:
  - Header hồ sơ: Ảnh đại diện lớn, tên người mẫu, mã người mẫu, trạng thái `Bản nháp`.
  - Khối `Thông tin cơ bản`: Tên, mã, ghi chú. Có nút `Chỉnh sửa thông tin` quay về bước 1.
  - Khối `Hình ảnh tham chiếu`: Toàn bộ ảnh đã tải theo đúng thứ tự, có đánh dấu ảnh đại diện. Có nút `Chỉnh sửa ảnh` quay về bước 2.
  - Khối `Xác nhận sử dụng`: Hiển thị lại 2 cam kết đã được người dùng xác nhận.
  - Chú thích: `Sau khi hoàn tất, hồ sơ này sẽ được lưu trong thư viện người mẫu và có thể được tái sử dụng trong nhiều dự án video.`
- **Nút hành động**:
  - Trái: `Quay lại` → Về bước 2.
  - Phải: Primary Button `Hoàn tất hồ sơ người mẫu`.
    - Backend xác minh lần cuối và chuyển trạng thái sang `READY`.
    - Hiển thị Toast thông báo `Đã tạo hồ sơ người mẫu`.
    - Điều hướng tới trang chi tiết `/models/:modelId`.

---

## 4. Trang Chi tiết Người mẫu (`/models/:modelId`)
- **Breadcrumb**: `Người mẫu` / `[Tên người mẫu]`. Click `Người mẫu` quay lại thư viện giữ nguyên bộ lọc.
- **Header Chi tiết**:
  - Ảnh đại diện lớn, tên người mẫu (24px, 700), mã người mẫu, nhãn trạng thái, phiên bản (`v1`, `v2`), ngày tạo.
  - Nút Primary `Chỉnh sửa hồ sơ` → Điều hướng tới `/models/:modelId/edit`.
  - Nút MoreHorizontal: `Lưu trữ hồ sơ`, `Khôi phục hồ sơ` (nếu Archived), `Xóa hồ sơ` (nếu là draft hoặc chưa có liên kết project).
- **Các Tab / Khối Nội dung**:
  - `Thông tin người mẫu`: Tên, mã, mô tả, phiên bản, ngày tạo, ngày cập nhật.
  - `Ảnh tham chiếu`: Grid hiển thị các ảnh của người mẫu. Click ảnh mở Lightbox Gallery Viewer với nút Trước/Sau, chỉ số `X / N`, nút Đóng và phím `Escape`.
  - `Thông tin sử dụng`: Hiển thị `Chưa có dữ liệu sử dụng` (sẵn sàng kết nối khi Studio hoàn tất ở các giai đoạn sau).

---

## 5. Trang Chỉnh sửa Người mẫu (`/models/:modelId/edit`)
- **Tiêu đề**: `Chỉnh sửa người mẫu`, mô tả `Cập nhật tên và hình ảnh tham chiếu của người mẫu.`
- **Form**:
  - Tên người mẫu (Input) và Ghi chú (Textarea). Mã người mẫu là Readonly.
  - Quản lý ảnh tham chiếu: Thêm ảnh mới, thay đổi ảnh đại diện, đổi thứ tự, gỡ ảnh (chặn không cho gỡ ảnh cuối cùng của hồ sơ READY).
- **Cơ chế Bảo vệ Thay đổi chưa lưu (Unsaved Changes Guard)**:
  - Nếu người dùng đã thay đổi dữ liệu mà click điều hướng ra ngoài, hiển thị Dialog:
    - Tiêu đề: `Bạn có thay đổi chưa được lưu.`
    - Mô tả: `Những thay đổi hiện tại sẽ bị mất nếu bạn rời khỏi trang.`
    - Nút: `Ở lại chỉnh sửa` và `Rời khỏi trang`.
- **Nút Lưu thay đổi**:
  - Gọi API `PATCH /api/v1/models/:modelId`. Tăng `modelVersion`.
  - Hiển thị Toast `Đã cập nhật hồ sơ người mẫu` và quay về `/models/:modelId`.

---

## 6. Các Hộp thoại Xác nhận (Dialogs)
1. **Lưu trữ Hồ sơ (Archive Dialog)**:
   - Tiêu đề: `Lưu trữ người mẫu?`
   - Mô tả: `Hồ sơ sẽ được chuyển sang danh sách Đã lưu trữ và không còn hiển thị trong danh sách người mẫu sẵn sàng. Dữ liệu và những liên kết lịch sử sẽ được giữ lại.`
   - Nút: `Hủy` và `Lưu trữ hồ sơ`.
2. **Xóa Bản nháp / Xóa Hồ sơ (Delete Dialog)**:
   - Tiêu đề: `Xóa bản nháp người mẫu?`
   - Mô tả: `Hồ sơ nháp và những ảnh chưa được sử dụng trong dự án sẽ được xóa theo chính sách lưu trữ của hệ thống. Thao tác này không thể hoàn tác.`
   - Nút: `Giữ bản nháp` và `Xóa bản nháp`.
   - Lưu ý: Không hiển thị nút xóa cho hồ sơ đã có dự án tham chiếu.

---

## 7. Đáp ứng Giao diện (Responsive Design)
- **Desktop 1440px**: Model Library hiển thị 3 - 4 card/hàng. Wizard hiển thị stepper ngang rõ ràng. Detail chia 2 cột (thông tin + gallery).
- **Laptop 1366px**: Model Library 3 card/hàng. Ảnh cover giữ tỷ lệ không bị thu nhỏ quá mức.
- **Tablet 1024px**: 2 - 3 card/hàng. Toolbar tối ưu thu gọn.
- **Tablet 768px**: 2 card/hàng. Stepper thu gọn padding.
- **Mobile 390px**: 1 card/hàng. Stepper chuyển sang chỉ báo bước rút gọn (`Bước 2 / 3: Hình ảnh tham chiếu`). Vùng upload hỗ trợ chạm chọn nhiều ảnh từ thiết bị. Dialog co dãn vừa viewport.
- **Toàn bộ trang**: Sử dụng thanh cuộn tự nhiên của trình duyệt, không tạo 2 thanh cuộn lồng nhau.
