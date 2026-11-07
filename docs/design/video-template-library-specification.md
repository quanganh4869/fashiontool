# Đặc Tả Giao Diện & Trải Nghiệm Người Dùng: Video Template Library

Tài liệu này xác định quy chuẩn thiết kế UI/UX, tokens màu sắc, bố cục responsive và trạng thái tương tác cho module Thư viện Video Mẫu của TrendMotion Studio.

---

## 1. Bản Sắc Thiết Kế (Design System Alignment)

- **Phông chữ chuẩn:** `Be Vietnam Pro` (toàn bộ tiêu đề, nhãn, văn bản và thông số).
- **Bảng màu chủ đạo (Tokens):**
  - Text chính (Heading / Body): `#242321`
  - Text phụ (Mô tả, nhãn phụ, thông số): `#74716D`
  - Nền trang (Page Background): `#F6F5F2`
  - Nền thẻ / Bảng điều khiển (Card Background): `#FFFFFF`
  - Đường viền phân cách (Borders): `#E8E5E0`
  - Màu nhấn thương hiệu (Brand Accent): `#654B7B` (Tím than thanh lịch)
  - Màu nhấn bổ trợ (Secondary Accent): `#2F5249` (Xanh ngọc sẫm)

---

## 2. Trang Thư Viện Video Mẫu (`/templates`)

### 2.1. Page Header & Toolbar
- **Tiêu đề trang (H1):** `Video mẫu` (Font `Be Vietnam Pro`, 30px, Bold 700, `#242321`).
- **Mô tả:** `Khám phá các video thời trang mẫu để sử dụng cùng người mẫu của bạn.` (Font 14px, Regular 400, `#74716D`).
- **Thanh tìm kiếm:**
  - Nhãn truy cập ẩn hoặc gợi ý: `Tìm video mẫu`
  - Placeholder: `Nhập tên video, mã mẫu hoặc từ khóa chuyển động`
  - Icon kính lúp ở đầu trường nhập.
  - Cơ chế tìm kiếm: Debounce 350ms khi gõ hoặc bấm phím `Enter` để thực thi ngay lập tức.
  - Nút xóa từ khóa (icon `X`) chỉ xóa chuỗi tìm kiếm, không làm mất các bộ lọc khác.
- **Thanh công cụ lọc (Filter Bar):**
  - **Select Danh mục:** Lấy dữ liệu động từ API (`Tất cả`, `Fashion Walk`, `Mirror Outfit`, `Studio Pose`, `Runway`, `Lifestyle`, `Close-up Product`).
  - **Bộ lọc Chuyển động:** `Đi bộ`, `Xoay người`, `Tạo dáng`, `Di chuyển trước gương`, `Chuyển động nhẹ`.
  - **Bộ lọc Thời lượng:** `Dưới 10 giây`, `10 – 20 giây`, `20 – 30 giây`, `Trên 30 giây`.
  - **Bộ lọc Tỷ lệ khung hình:** `9:16`, `16:9`, `1:1`.
  - **Bộ lọc Vùng trang phục:** `Áo thân trên`, `Quần / Chân váy`, `Đầm toàn thân`, `Áo khoác`, `Phụ kiện`.
  - **Bộ lọc Trạng thái đánh giá:** `Đã kiểm tra`, `Có giới hạn`, `Không hỗ trợ`, `Chưa đánh giá`.
  - **Bộ lọc Yêu thích:** Nút bấm nhanh hiển thị `Đã lưu`.
  - **Sắp xếp (Sort Dropdown):** `Mới cập nhật`, `Thời lượng ngắn nhất`, `Thời lượng dài nhất`, `Tên A–Z`, `Được sử dụng nhiều`.
  - **Active Filter Pills & Reset:** Hiển thị danh sách các điều kiện đang lọc, cho phép tắt từng điều kiện hoặc nhấn `Xóa tất cả bộ lọc`.

### 2.2. Lưới Thẻ Video (Template Grid) & Quy Chuẩn Thẻ (Template Card)
- **Cột hiển thị theo Viewport:**
  - Desktop 1440px: 3 hoặc 4 cột tùy kích thước (khuyến nghị 3-4 cột rộng rãi để thấy rõ chi tiết người mẫu).
  - Laptop 1366px: 3 cột.
  - Tablet 1024px / 768px: 2 cột.
  - Mobile 390px: 1 cột (tối ưu chiều rộng, cuộn dọc mượt mà).
- **Quy chuẩn thẻ Video (Template Card):**
  - **Khung chứa hình ảnh:** Giữ nguyên tỷ lệ gốc của video (Aspect Ratio). Video 9:16 giữ dáng dọc tỉ lệ 9:16, video 16:9 giữ dáng ngang. Không ép méo hoặc crop mất góc của video.
  - **Poster tĩnh:** Là frame ảnh thật trích xuất từ chính video mẫu.
  - **Xem trước khi rê chuột (Hover Preview):**
    - Kích hoạt sau khi con trỏ chuột dừng trên thẻ quá 300ms.
    - Phát video preview nhẹ, tắt âm thanh hoàn toàn (muted), lặp lại (loop).
    - Chỉ có tối đa 1 video preview được phát trên toàn màn hình tại một thời điểm.
    - Khi chuột rời khỏi thẻ, lập tức dừng phát và hiển thị lại poster tĩnh.
  - **Nút Bookmark Yêu thích:**
    - Vị trí: Góc trên bên phải của poster.
    - Thiết kế: Nền bán trong suốt `rgba(0,0,0,0.4)` bo tròn, icon Bookmark chuyển tím khi đã lưu.
    - Tương tác: Có hiệu ứng loading nhẹ, chặn double click, gọi API thật, hiển thị Toast xác nhận.
    - Sự kiện: Bấm Bookmark được ngăn chặn nổi bọt (`e.stopPropagation()`) để không mở nhầm trang chi tiết.
  - **Thời lượng (Duration Badge):** Ghim ở góc dưới bên phải poster (ví dụ: `0:14`, nền tối mờ chữ trắng dễ nhìn).
  - **Khối thông tin bên dưới poster:**
    - Tiêu đề video: Font 15-16px, Semibold 600, màu `#242321`, tối đa 2 dòng kèm `line-clamp-2`.
    - Danh mục & Tỷ lệ: Font 12px, Regular 400, màu `#74716D`.
    - Thẻ Tags: Hiển thị tối đa 3 tag thực tế có sẵn trong metadata.
    - Không hiển thị badge trang trí giả tạo như `HOT` hay `VIRAL`.
  - **Điều hướng:** Click vào bất kỳ vị trí hợp lệ nào trên card sẽ mở trang `/templates/:templateId`.

---

## 3. Trang Chi Tiết Video Mẫu (`/templates/:templateId`)

### 3.1. Bố Cục Hai Cột Desktop (60% / 40%)
- **Breadcrumb:** `Video mẫu` / `{Tên video mẫu}`. Bấm `Video mẫu` quay về thư viện và bảo toàn đầy đủ các tham số bộ lọc, tìm kiếm, trang hiện tại.
- **Tiêu đề trang (H1):** Tên đầy đủ của video mẫu (Font 26px, Bold 700, `#242321`).
- **Dòng thông tin phụ:** Mã mẫu (`VTP-000101`), Danh mục, Phiên bản (`v1.0.0`), Lượt dùng (nếu có dữ liệu thực tế).
- **Cột Trái (Khoảng 58% – 62% chiều rộng):**
  1. **Trình phát Video (HTML5 Player):**
     - Nguồn phát từ backend endpoint nội bộ có xác thực: `/api/v1/templates/{id}/stream`.
     - Điều khiển hoàn chỉnh: Nút Play/Pause lớn giữa màn hình và thanh bar điều khiển, thanh kéo tua (Seek Bar), thời gian hiện tại / tổng thời lượng, thanh chỉnh âm lượng / tắt tiếng, nút mở toàn màn hình (Fullscreen).
     - Hỗ trợ phím tắt: `Space` (Play/Pause), Mũi tên trái/phải ($\pm 5$ giây), Phím `M` (Mute).
     - Không tự động phát có âm thanh.
     - Trạng thái tải: Hiện poster gốc và spinner tải.
     - Trạng thái lỗi: Thông báo `Không thể tải video mẫu` và nút `Thử lại`.
  2. **Cấu trúc cảnh (Scene Timeline):**
     - Danh sách các cảnh phân tích thực tế: Thứ tự, thời gian bắt đầu – kết thúc, mô tả hành động, góc máy và cự ly (Full-body, Medium-shot).
     - **Tương tác thông minh:** Click vào một cảnh bất kỳ sẽ ra lệnh cho Player tua ngay lập tức đến mốc thời gian bắt đầu của cảnh đó.
- **Cột Phải (Khoảng 38% – 42% chiều rộng):**
  1. **Nút Thao Tác:** Nút Lưu yêu thích (Bookmark) lớn, thể hiện rõ trạng thái Đã lưu / Chưa lưu.
  2. **Khối Thông số kỹ thuật:** Thời lượng, tỷ lệ khung hình, độ phân giải gốc, tốc độ khung hình (fps), chuẩn nén video (codec), thông tin âm thanh.
  3. **Khối Vùng trang phục có thể thay thế (Garment Slots):**
     - Liệt kê các vị trí: Áo thân trên, Quần / Chân váy, Đầm toàn thân, Áo khoác.
     - Nhãn trạng thái đánh giá đi kèm: `Đã kiểm tra`, `Có giới hạn`, `Không hỗ trợ`, `Chưa đánh giá`.
     - Ghi chú cụ thể về mức độ che khuất hoặc lưu ý góc quay.
  4. **Khối Yêu cầu đối với người mẫu (Compatibility & Model Requirements):**
     - Giải thích rõ ràng loại ảnh người mẫu cần chuẩn bị (ảnh chính diện, toàn thân, góc nghiêng).
     - Các hạn chế đã xác nhận của video (ví dụ: không có góc lưng, chuyển động nhanh).

---

## 4. Các Trạng Thái Phản Hồi Đặc Thù

1. **Catalog rỗng:**
   - Tiêu đề: `Chưa có video mẫu`
   - Mô tả: `Video mẫu do hệ thống cung cấp sẽ xuất hiện tại đây khi thư viện được cập nhật.`
2. **Không có kết quả tìm kiếm:**
   - Tiêu đề: `Không tìm thấy video mẫu phù hợp`
   - Mô tả: `Thử thay đổi từ khóa hoặc điều chỉnh bộ lọc.`
   - Nút hành động: `Xóa tất cả bộ lọc`
3. **Skeleton Loading:**
   - Khi API đang tải, hiển thị lưới các khung card Skeleton giả lập đúng tỷ lệ khung hình và thông tin để tránh giật giao diện (layout shift).
4. **Lỗi tải dữ liệu:**
   - Banner cảnh báo thân thiện kèm nút `Thử lại` gọi lại API tương ứng.
