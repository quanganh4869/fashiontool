# Nghiên cứu Tham khảo & Thiết kế Trải nghiệm Upload cho Module Model Management

Tài liệu này ghi lại kết quả nghiên cứu các giải pháp upload và quản lý tài nguyên số hàng đầu (Uppy, Cloudinary Upload Widget, Cloudflare R2 Presigned URLs) và quy định cách vận dụng vào Design System của TrendMotion Studio.

---

## 1. Phân tích Uppy (https://uppy.io/docs/dashboard/)

### Đặc điểm cốt lõi quan sát được
1. **Kiến trúc State-Driven cho nhiều file**:
   - Mỗi file được coi là một đối tượng độc lập với vòng đời rõ ràng: `idle` → `queued` → `uploading` (với bytes uploaded / total bytes) → `paused` → `complete` | `error`.
   - Một lỗi ở file A không làm gián đoạn tiến trình của file B.
2. **Khả năng Retry đơn lẻ**:
   - Cung cấp nút thử lại ngay trên từng item file bị lỗi mà không bắt người dùng phải chọn lại file hoặc khởi động lại toàn bộ batch upload.
3. **Xem trước (Instant Thumbnail Preview)**:
   - Sử dụng `URL.createObjectURL(file)` để hiển thị thumbnail ngay lập tức khi file vừa vào hàng đợi, người dùng không phải đợi upload xong mới thấy ảnh.
4. **Khu vực Kéo - Thả trực quan (Drag & Drop Zone)**:
   - Visual feedback rõ ràng khi con trỏ kéo file vào vùng hợp lệ (border đổi màu, hiển thị lời mời thả file).
   - Hỗ trợ cả thao tác click mở file picker hệ điều hành và kéo thả thư mục/nhiều file.

### Nguyên tắc vận dụng vào TrendMotion Studio
- Xây dựng hàng đợi upload với trạng thái riêng cho từng file ảnh tham chiếu.
- Sử dụng Design System tokens của TrendMotion: nền canvas `#FBFAF8`, border nét đứt `#D8D4CE`, khi drag-over đổi thành màu thương hiệu `#654B7B` với border `#654B7B` và nền `#F2EDF5`.
- Tránh đưa các widget bên ngoài làm lệch font chữ (Be Vietnam Pro) và ngôn ngữ giao diện tiếng Việt.

---

## 2. Phân tích Cloudinary Upload Widget (https://cloudinary.com/documentation/upload_widget)

### Đặc điểm cốt lõi quan sát được
1. **Quản lý giới hạn tải lên (File Constraints)**:
   - Kiểm tra MIME type và dung lượng file ngay tại trình duyệt (pre-upload validation) trước khi gửi request mạng, giúp người dùng nhận thông báo lỗi tức thì thay vì chờ upload xong mới bị từ chối.
2. **Tương tác trên Thumbnail đã tải lên**:
   - Cho phép người dùng xóa, xem ảnh phóng to hoặc đánh dấu ảnh chính (cover) trực tiếp trên grid ảnh đã hoàn tất.
3. **Phản hồi lỗi thân thiện**:
   - Thông báo rõ ràng: quá dung lượng cho phép, định dạng không được hỗ trợ, vượt quá số lượng tối đa.

### Nguyên tắc vận dụng vào TrendMotion Studio
- Kiểm tra 3 tiêu chí tại Frontend trước khi upload:
  - Định dạng: Chỉ cho phép `image/jpeg`, `image/png`, `image/webp`.
  - Dung lượng: Tối đa 20MB / ảnh.
  - Số lượng: Tối đa 20 ảnh tham chiếu cho một Model Profile.
- Khuyến nghị kích thước cạnh ngắn tối thiểu 512px để đảm bảo chất lượng tạo video thời trang.
- Lưu ý quan trọng: Chỉ sử dụng nguyên tắc trải nghiệm người dùng từ Cloudinary, **toàn bộ hạ tầng lưu trữ của TrendMotion Studio sử dụng Local Filesystem Storage theo cấu hình `LOCAL_STORAGE_ROOT`**, tuyệt đối không sử dụng cloud object storage theo quy định AGENTS.md 11.1.

---

## 3. Kiến trúc Lưu trữ Local Filesystem Storage (LOCAL_STORAGE_ROOT)

### Cơ chế bảo mật và luồng Upload trực tiếp Backend
1. **Local Filesystem Isolation**:
   - Thư mục lưu trữ `./data/storage` được quản lý bởi Backend trên máy chủ. Trình duyệt không truy cập trực tiếp filesystem.
2. **Luồng Upload Multipart/form-data**:
   - Frontend gửi file nhị phân qua `multipart/form-data` tới Backend FastAPI: `POST /api/v1/models/{modelId}/assets/upload`.
   - Client theo dõi tiến trình upload thực tế qua `XMLHttpRequest.upload.onprogress`, tuyệt đối không tạo số % giả mạo.
3. **Xử lý và Kiểm tra An toàn tại Backend**:
   - Backend stream file vào thư mục tạm `data/storage/temp/`, kiểm tra magic bytes thực tế (JPEG, PNG, WebP), giới hạn dung lượng 15MB, chống path traversal.
   - Sử dụng atomic move để chuyển file an toàn vào `data/storage/users/{user_id}/models/{model_id}/versions/{version}/original/{asset_id}.{ext}`.
   - Trả về asset metadata với endpoint nội bộ an toàn `/api/v1/assets/{asset_id}/view` hỗ trợ HTTP Range streaming RFC 7233.

---

## 4. Bảng So sánh Trạng thái Upload trong Module Model Management

| Trạng thái | Hiển thị giao diện | Hành vi & Tương tác |
| :--- | :--- | :--- |
| **Đang chờ** (`queued`) | Tên file, dung lượng, thumbnail preview | Chuẩn bị upload lên Backend |
| **Đang tải lên** (`uploading`) | Thanh tiến trình thực tế + % | Client POST multipart/form-data lên Backend |
| **Đang kiểm tra** (`verifying`) | Spinner nhẹ, chữ "Đang kiểm tra" | Backend stream, xác thực magic bytes và atomic rename |
| **Đã tải lên** (`completed`) | Badge "Ảnh đại diện" (nếu là cover), menu hành động | Xem ảnh, đặt làm cover, xóa ảnh, đổi thứ tự |
| **Tải lên thất bại** (`error`) | Dòng lỗi màu đỏ `#A94442`, nút "Thử lại" | Nhấn "Thử lại" để upload lại file |
