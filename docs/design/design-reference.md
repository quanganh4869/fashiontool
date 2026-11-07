# Định Hướng Thiết Kế & Tài Liệu Tham Khảo (Design Reference)

> **LƯU Ý QUAN TRỌNG:**
> Tài liệu này được biên soạn nhằm thiết lập định hướng kiến trúc trải nghiệm và cơ sở thiết kế cho các giai đoạn phát triển giao diện (UI/UX) tiếp theo.
> Trong giai đoạn hiện tại (Giai đoạn 01), **tuyệt đối không triển khai UI, không tạo trang giao diện, không tải hình ảnh, không sao chép tài nguyên hay áp dụng bảng màu nhận diện** của các bên tham khảo.

---

## 1. Định hướng sản phẩm TrendMotion Studio

- **Tên dự án:** TrendMotion Studio.
- **Định vị cốt lõi:** *Fashion Affiliate Research & Video Production Platform* — Nền tảng chuyên biệt kết hợp giữa nghiên cứu thị trường sản phẩm thời trang TikTok Shop và sản xuất video thương mại điện tử bằng AI.
- **Bản sắc riêng biệt — Fashion Commerce Workbench:**
  TrendMotion Studio không phải là một dashboard quản trị chung chung, mà được định hình như một **Bàn làm việc thương mại thời trang (Fashion Commerce Workbench)**:
  - **Phân hệ Nghiên cứu Thị trường (Market & Product Research):** Ưu tiên khả năng quan sát nhanh sản phẩm, hình ảnh chất lượng cao, thông tin bán hàng trực quan (giá, doanh số, hoa hồng affiliate) và bộ lọc đa chiều (danh mục trang phục, phân khúc giá, tốc độ tăng trưởng).
  - **Phân hệ Sản xuất Nội dung (Creative Studio & Production):** Không gian làm việc trực quan, tối ưu cho quy trình tuần tự: Nhập ảnh sản phẩm thật -> Chọn/phối người mẫu thời trang AI -> Chọn bối cảnh & phong cách -> Tạo chuyển động video 9:16 -> Quản lý các phiên bản biến thể và xuất bản phẩm.

---

## 2. Phân tích tài liệu tham khảo

Hệ thống kiến trúc tham khảo kinh nghiệm từ 3 nền tảng dẫn đầu ngành:

### 2.1. Minea (https://www.minea.com/)
- **Khía cạnh tham khảo:**
  - Cách tổ chức dữ liệu thương mại điện tử quy mô lớn.
  - Cấu trúc bộ lọc sản phẩm linh hoạt (Filter bar: danh mục thời trang, thời gian bắt đầu viral, engagement rate, quốc gia).
  - Bố cục lưới sản phẩm (Product Card Grid): tập trung vào visual sản phẩm, nút xem chi tiết và biểu đồ biến động doanh số.
- **Nguyên tắc phân biệt của TrendMotion Studio:**
  - Tập trung 100% vào ngành hàng **Thời trang & Phụ kiện (Fashion Commerce)** thay vì dàn trải sản phẩm bách hóa.
  - Tích hợp trực tiếp từ việc tìm kiếm sản phẩm sang nút hành động "Đưa vào Studio tạo video" mà không cần chuyển đổi ứng dụng rời rạc.

### 2.2. Creatify (https://creatify.ai/)
- **Khía cạnh tham khảo:**
  - Quy trình sản xuất video thương mại (video generation pipeline) từ đường dẫn sản phẩm hoặc hình ảnh gốc.
  - Cách quản lý các tài nguyên sáng tạo (Creative Assets): kịch bản, lời bình (voiceover/script), người mẫu, video previews.
  - Trải nghiệm theo dõi trạng thái tác vụ sinh video dạng tiến trình bất đồng bộ.
- **Nguyên tắc phân biệt của TrendMotion Studio:**
  - Nhấn mạnh vào yếu tố **Thời trang cao cấp & Thử đồ ảo (Virtual Try-on & AI Models)**: cho phép chọn dáng người, màu da, thần thái phù hợp với từng phân khúc khách hàng thời trang.
  - Tối ưu hóa định dạng video dạng short-form dọc (9:16) theo chuẩn thuật toán đề xuất của TikTok.

### 2.3. Shopify Admin (https://www.shopify.com/)
- **Khía cạnh tham khảo:**
  - Cấu trúc tổ chức ứng dụng quản trị chuẩn mực cao, phân cấp chức năng rõ ràng, không gây choáng ngợp thông tin.
  - Tính nhất quán trong tương tác dữ liệu: bảng biểu, trạng thái thẻ, modal xác nhận, thông báo lỗi/thành công.
  - Khả năng mở rộng không gian làm việc rộng rãi, tối giản đường viền thừa để tập trung vào dữ liệu và tác vụ chính.
- **Nguyên tắc phân biệt của TrendMotion Studio:**
  - Giao diện được tối ưu với chế độ hiển thị tập trung vào hình ảnh lớn và video player chất lượng cao, phục vụ đặc thù ngành thời trang trực quan.

---

## 3. Nguyên tắc thiết kế cho các giai đoạn UI sau

1. **Visual-First (Ưu tiên hình ảnh):** Trong ngành thời trang, hình ảnh và video là yếu tố tiên quyết. Mọi bảng dữ liệu đều phải dành không gian nổi bật cho ảnh xem trước sản phẩm.
2. **Context-Preserving Workflow (Duy trì ngữ cảnh):** Khi chuyển từ nghiên cứu sản phẩm sang tạo video, dữ liệu sản phẩm (tên, mô tả, ảnh gốc) phải tự động được đưa vào Studio mà không bắt người dùng nhập lại thủ công.
3. **Transparent Async State (Trạng thái bất đồng bộ minh bạch):** Quá trình render video bằng AI cần thời gian (vài phút). UI phải luôn hiển thị thanh tiến trình rõ ràng, ước lượng thời gian hoàn tất và cho phép người dùng tiếp tục các tác vụ khác trong lúc chờ.
4. **Zero UI Duplication:** Không sao chép giao diện, icon hay tài nguyên của bất kỳ website tham khảo nào. TrendMotion Studio sở hữu hệ thống thiết kế độc lập phù hợp với thương hiệu riêng.
