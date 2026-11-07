# Phân Tích Nghiên Cứu Website Tham Khảo (Reference Analysis)

> **Mục tiêu nghiên cứu:** Đánh giá chuyên sâu 3 nền tảng chuẩn mực trong ngành — Minea (Ad Spy & Product Research), Creatify (AI Video Generation Workflow) và Shopify Admin (Polaris Enterprise Navigation & UI Architecture) nhằm trích xuất nguyên tắc thiết kế cho bản sắc **Fashion Commerce Workbench** của TrendMotion Studio.

---

## 1. Nghiên cứu Minea (https://www.minea.com)

### 1.1. Các đường dẫn đã khảo sát
- **Trang chủ:** `https://www.minea.com/` (Khảo sát cấu trúc marketing, các nguồn dữ liệu mạng xã hội TikTok, Facebook, Pinterest).
- **Trang AI Product Research:** `https://www.minea.com/ai-product-research` (Khảo sát các tính năng Magic Search, phân tích transcript quảng cáo, Success Radar và bộ lọc thịnh hành).
- **Trang Pricing & Tiering:** `https://www.minea.com/pricing` (Khảo sát cách đóng gói gói dịch vụ, hạn mức credit tìm kiếm và các quyền truy cập tính năng).

### 1.2. Những điểm quan sát thực tế và phân tích cấu trúc
- **Cách trình bày sản phẩm như một đối tượng dữ liệu:**
  Minea hiển thị sản phẩm theo mô hình thẻ dữ liệu đa chỉ số (Multi-metric Data Card). Mỗi sản phẩm được gắn chặt với:
  - Ảnh đại diện sản phẩm chất lượng cao hoặc video quảng cáo đang chạy.
  - Tên sản phẩm, giá bán tham chiếu, số lượng shop đang bán (Competitor count).
  - Tín hiệu quảng cáo: Lượt tương tác (likes, shares, comments), ước tính ngân sách chạy quảng cáo, ngày bắt đầu chạy và mạng xã hội phát tán (TikTok/Facebook/Snapchat).
- **Phân biệt dữ liệu chính và dữ liệu phụ:**
  - *Dữ liệu chính:* Visual sản phẩm (ảnh/video) và 3 chỉ số then chốt (Lượt view/tương tác, thời gian chạy, số shop cạnh tranh).
  - *Dữ liệu phụ:* Chi tiết kịch bản ad, link nguồn AliExpress/Shopify, targeting demographic được ẩn sau popover hoặc modal chi tiết.
- **Tổ chức khu vực tìm kiếm và bộ lọc (Filters Hierarchy):**
  Bộ lọc của Minea nằm ở thanh ngang phía trên danh sách kết quả (Sticky Filter Bar), chia thành các nhóm: Thị trường (Quốc gia), Danh mục ngành hàng, Nền tảng (TikTok Shop/FB), Khoảng thời gian và Ngưỡng tương tác tối thiểu. Việc đặt bộ lọc sát trên danh sách giúp người dùng tinh chỉnh liên tục mà không cần mở drawer riêng.
- **Giới hạn truy cập ghi nhận:**
  Minea giới hạn quyền xem sâu sau paywall và yêu cầu đăng nhập. Do đó, các tính năng chuyên sâu như bảng đối soát doanh số chi tiết theo ngày và Shop Spy chỉ được ghi nhận qua tài liệu mô tả chính thức và demo công khai, không suy đoán phần giao diện sâu chưa được cấp phép.

### 1.3. Bài học áp dụng và cải tiến cho TrendMotion Studio
- **Học hỏi:**
  - Bố cục lưới sản phẩm visual-first: sản phẩm thời trang bắt buộc phải hiển thị ảnh lớn, rõ chất liệu và form dáng.
  - Bộ lọc tức thời (inline quick filters) theo danh mục con thời trang (Váy, Áo sơ mi, Phụ kiện, Giày dép).
- **Không phù hợp / Cần thiết kế lại:**
  - *Minea dàn trải đa ngành hàng:* Bố cục Minea tối ưu cho hàng gia dụng, phụ kiện điện tử (gadgets dropshipping). Đối với thời trang, TrendMotion cần hiển thị thêm thuộc tính người mẫu, bảng kích cỡ (sizing) và tỷ lệ hoa hồng affiliate của TikTok Shop.
  - *Màu sắc và độ chói:* Minea sử dụng nhiều màu tương phản mạnh và huy hiệu dày đặc, gây mỏi mắt khi làm việc lâu dài. TrendMotion sẽ áp dụng bảng màu trung tính #F6F5F2 kết hợp sắc tím trầm #654B7B để tạo không gian làm việc tĩnh tâm, chuẩn mực editorial.

---

## 2. Nghiên cứu Creatify (https://creatify.ai)

### 2.1. Các đường dẫn đã khảo sát
- **Trang chủ & Công cụ Link-to-Video:** `https://creatify.ai/`, `https://app.creatify.ai/tool/link-to-video`.
- **Tài liệu URL-to-Video chính thức:** `https://help.creatify.ai/en/articles/12435455-url-to-video`.
- **Bộ tài liệu Creative Tools:** `https://help.creatify.ai/en/collections/15631647-creative-tools`.
- **Trang tổng hợp hướng dẫn:** `https://help.creatify.ai/en/articles/10463463-tutorials-and-guides`.

### 2.2. Những điểm quan sát thực tế và phân tích quy trình
- **Quy trình tuần tự rõ ràng (Step-driven Pipeline):**
  Creatify không thiết kế trang Studio thành một form kéo dài vô tận. Quy trình được phân thành 4 chặng:
  1. *Đầu vào:* Nhập URL sản phẩm hoặc tải trực tiếp ảnh/video thô (Manual Asset Upload).
  2. *Trích xuất & Kịch bản (Scripting):* AI phân tích cấu trúc bài toán (Hook 3 giây đầu, Thân bài giải quyết vấn đề, Kêu gọi hành động CTA). Cho phép chỉnh sửa từng block kịch bản.
  3. *Chọn người mẫu & Giọng đọc (Avatar & Voiceover):* Thư viện người mẫu UGC dạng dọc, lựa chọn ngôn ngữ và phong cách trình diễn.
  4. *Xem trước & Render (Preview & Render Pipeline):* Khung xem trước video dọc 9:16 chiếm vị trí trung tâm hoặc nửa phải màn hình, các nút cấu hình nằm ở bảng bên cạnh.
- **Cách quản lý trạng thái xử lý bất đồng bộ:**
  Khi nhấn Render, tác vụ được đưa vào hàng đợi với thanh tiến trình rõ ràng (ước lượng ~1-2 phút) và cho phép người dùng quay lại dashboard tiếp tục công việc khác mà không làm gián đoạn tiến trình.
- **Giới hạn truy cập ghi nhận:**
  Khu vực chỉnh sửa nâng cao (AdFlow timeline editor) yêu cầu tài khoản trả phí. Các đặc tả về quy trình xử lý được trích xuất trực tiếp từ bộ tài liệu hướng dẫn chính thức và video hướng dẫn của Creatify Help Center.

### 2.3. Bài học áp dụng và cải tiến cho TrendMotion Studio
- **Học hỏi:**
  - Tách bạch không gian giữa **Vùng Thiết Lập (Settings Panel)** và **Vùng Xem Trước Trực Quan (Live Visual Preview)**.
  - Cơ chế hỗ trợ cả hai phương thức đầu vào: Nhập link sản phẩm TikTok Shop hoặc Tự tải ảnh sản phẩm lên từ máy tính.
- **Không phù hợp / Cần thiết kế lại:**
  - *Creatify tập trung vào avatar nói chuyện (talking head avatar):* Đối với thương mại thời trang TikTok Shop, người mua quan tâm đến **cách trang phục mặc trên người (Virtual Try-on / Model Showcase)**, chuyển động chất vải và cách phối đồ (mix & match) hơn là một avatar chỉ nói trước camera.
  - TrendMotion Studio sẽ thiết kế Creative Workspace chuyên sâu cho việc phối người mẫu thời trang AI với trang phục thật, sinh các góc chụp lookbook và tạo chuyển động catwalk hoặc biến hình ngắn 9:16.

---

## 3. Nghiên cứu Shopify Admin & Polaris Design System

### 3.1. Các đường dẫn đã khảo sát
- **Bài viết thiết kế mới của Shopify Admin:** `https://www.shopify.com/blog/admin-new-look`.
- **Tài liệu Polaris Design System:** `https://polaris.shopify.com/` và `https://shopify.dev/docs/apps/tools/polaris`.
- **Tài liệu Components:** `https://polaris.shopify.com/components` (Button, Page, Navigation, Modal, Table, Tabs).
- **Hướng dẫn điều hướng Admin:** `https://help.shopify.com/vi/manual/shopify-admin/shopify-admin-overview`.

### 3.2. Những điểm quan sát thực tế và phân tích kiến trúc
- **Tối ưu hóa không gian làm việc (Streamlined Workspace):**
  Trong bản nâng cấp thiết kế mới nhất của Shopify Admin:
  - *Collapsible Navigation Sidebar:* Thanh điều hướng bên trái có thể thu gọn mượt mà để trả lại toàn bộ diện tích ngang cho bảng dữ liệu và công việc quản trị.
  - *Giảm thiểu các lớp bọc (Card-in-card reduction):* Loại bỏ các viền bao dày đặc và bóng đổ nặng. Thay vào đó, cấu trúc sử dụng nền canvas nhẹ, viền mảnh 1px và phân tách nhóm bằng khoảng cách (spacing scale) chuẩn xác.
- **Hệ thống phân cấp hành động (Action Hierarchy):**
  - Hành động chính (Primary Action: "Lưu", "Tạo", "Xuất") luôn nằm ở góc phải trên hoặc vị trí xác định rõ ràng, có độ tương phản cao nhất.
  - Hành động phụ (Secondary/Tertiary) dùng nền trong suốt hoặc viền mảnh để không gây nhiễu thị giác.
- **Typography và khả năng đọc lâu dài:**
  - Polaris áp dụng các cấp cỡ chữ vừa vặn (13-14px cho body, 20px cho section, 28-30px cho page title).
  - Sử dụng số dạng Tabular Figures để các cột số tiền, số lượng tồn kho căn thẳng hàng hoàn hảo.
- **Trải nghiệm nhất quán trên thiết bị nhỏ:**
  - Chuyển đổi linh hoạt từ Sidebar cố định sang Drawer có overlay khi màn hình co hẹp, bảo vệ trọn vẹn khả năng thao tác trên máy tính bảng và điện thoại.

### 3.3. Bài học áp dụng và cải tiến cho TrendMotion Studio
- **Học hỏi:**
  - Thiết kế Sidebar có hai trạng thái: Mở rộng (252px) và Thu gọn (72px) với nút toggle ở đáy thanh bên, lưu trạng thái trong `localStorage`.
  - Phân nhóm menu rõ ràng theo mục đích sử dụng (KHÔNG GIAN, NGHIÊN CỨU, SÁNG TẠO, TÀI KHOẢN).
  - Áp dụng cấu trúc Page Container linh hoạt, không khóa cứng chiều rộng trang vào kích thước cố định chật hẹp.
- **Không phù hợp / Cần thiết kế lại:**
  - Shopify Admin thiên về quản trị vận hành (đơn hàng, kho vận, cài đặt kênh bán).
  - TrendMotion Studio là **Workbench phục vụ nghiên cứu & sáng tạo**, do đó khu vực Topbar được tối ưu riêng cho **Chỉ số Credit** (chi phí tính toán AI) và các lối tắt chuyển đổi nhanh giữa Nghiên cứu sản phẩm sang Tạo video.

---

## 4. Bảng tổng hợp quyết định kiến trúc giao diện cho TrendMotion Studio

| Tiêu chí | Minea | Creatify | Shopify Admin | Quyết định của TrendMotion Studio |
| :--- | :--- | :--- | :--- | :--- |
| **Mục đích chính** | Soi quảng cáo & tìm hàng thắng | Tạo video quảng cáo nhanh từ URL | Quản trị cửa hàng & vận hành e-commerce | **Fashion Commerce Workbench:** Nghiên cứu sản phẩm TikTok Shop + Studio tạo video thời trang AI |
| **Bố cục Sidebar** | Thanh bên cố định icon-heavy | Thanh công cụ dạng web-app | Thanh bên có thể thu gọn (Collapsible), gom nhóm khoa học | **Sidebar 252px / 72px thu gọn**, 4 nhóm chức năng rõ ràng, wordmark editorial `trendmotion studio` |
| **Bảng màu chủ đạo** | Xanh dương & đen đậm, tương phản cao | Tím sáng, gradient công nghệ | Trung tính, xám nhạt, xanh lá cây đậm | **Canvas #F6F5F2, Bề mặt #FFFFFF, Viền #E8E5E0, Tím trầm #654B7B** |
| **Không gian làm việc** | Lưới thẻ sản phẩm dày đặc | Chia 2 cột: Cài đặt & Preview dọc 9:16 | Trang mở rộng toàn diện (Fluid Width) | **2 Workspaces độc lập:** Research Workspace (Ưu tiên thông tin) & Creative Workspace (Ưu tiên hình ảnh & Preview) |
| **Quản trị chi phí/tác vụ** | Gói tháng & giới hạn credits | Trừ credits theo video render | Gói thuê bao hàng tháng | **Hiển thị Credit trên Topbar**, cơ chế trừ credit theo từng tác vụ AI minh bạch |
