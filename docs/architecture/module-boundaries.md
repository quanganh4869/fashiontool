# Ranh Giới Trách Nhiệm Module (Module Boundaries)

Tài liệu này xác định rõ phạm vi trách nhiệm (Single Responsibility Principle) và giới hạn tương tác giữa các module nghiệp vụ trong TrendMotion Studio, đảm bảo tính phân tách và khả năng mở rộng lâu dài.

---

## 1. Product Research (Nghiên cứu Sản phẩm)
- **Mục tiêu:** Giúp người dùng phát hiện các sản phẩm thời trang tiềm năng và thịnh hành trên TikTok Shop.
- **Phạm vi trách nhiệm:**
  - Tra cứu, sắp xếp, lọc danh sách sản phẩm theo danh mục thời trang (quần áo nam, nữ, phụ kiện, giày dép).
  - Phân tích các chỉ số thương mại: giá bán, số lượt bán ước tính, tỷ lệ hoa hồng affiliate.
  - Phân tích hiệu suất nội dung quảng cáo gắn liền với sản phẩm.
- **Ranh giới (Không làm):**
  - Không trực tiếp sản xuất video hoặc chỉnh sửa ảnh (thuộc về Studio).
  - Không quản lý tài nguyên cá nhân của người dùng (thuộc về Library).
  - Không thực hiện web scraping trái phép hoặc giả lập số liệu không được kiểm chứng.

---

## 2. Channel Analysis (Phân tích Kênh & Nội dung)
- **Mục tiêu:** Cung cấp thông tin chuyên sâu về xu hướng video, âm thanh và nhà sáng tạo nội dung tiếp thị liên kết.
- **Phạm vi trách nhiệm:**
  - Theo dõi các kênh sáng tạo nội dung thời trang nổi bật qua API chính thức.
  - Đánh giá định dạng video (haul, review, mix & match, biến hình) đang có tỷ lệ chuyển đổi cao.
  - Trích xuất thông điệp chính và xu hướng hashtag thời trang.
- **Ranh giới (Không làm):**
  - Không lưu thông tin bảo mật của người dùng TikTok khác.
  - Không thay đổi hay can thiệp vào tài khoản TikTok của bên thứ ba.

---

## 3. Studio (Fashion Commerce Workbench)
- **Mục tiêu:** Không gian làm việc tích hợp để kết hợp tài nguyên và sản xuất video thương mại thời trang qua quy trình 2 công đoạn độc lập.
- **Phạm vi trách nhiệm:**
  - **Công đoạn 1 (Model Personalization):** Chọn hồ sơ người mẫu (`Model Profile`) và mẫu video (`Video Template`) để tạo bản ghi thế hệ `ModelTemplateGeneration` và kết xuất video nền cá nhân hóa (`Personalized Base Video`).
  - **Công đoạn 2 (Garment Replacement):** Tiếp nhận link sản phẩm thời trang, trích xuất dữ liệu thành `Product Truth Sheet`, và thay thế trang phục mục tiêu trong video nền để tạo video thành phẩm (`Final Product Video`).
  - Quản lý các phiên bản `Personalized Base Video` bất biến để có thể thử nghiệm nhiều sản phẩm thời trang khác nhau mà không phải render lại video nền.
  - Điều phối quá trình xử lý bất đồng bộ qua hàng đợi Celery Worker và kiểm tra chất lượng (Quality Review).
- **Ranh giới (Không làm):**
  - Không gộp công đoạn Personalization và Garment Replacement làm một; không đánh dấu hoàn tất video affiliate khi chưa thay trang phục và kiểm tra chất lượng.
  - Không thực hiện gọi API trực tiếp từ trình duyệt Frontend tới các nhà cung cấp AI.
  - Không trừ credit trực tiếp ở tầng giao diện; mọi yêu cầu phải thông qua xác thực số dư tại Backend.

---

## 4. Models (Model Profile Management)
- **Mục tiêu:** Quản lý hồ sơ người mẫu độc lập do người dùng cung cấp ảnh thật, có thể tái sử dụng cho nhiều video mẫu và nhiều dự án khác nhau.
- **Phạm vi trách nhiệm:**
  - Quản lý danh sách ảnh tham chiếu của cùng một người mẫu thực tế (`referenceAssets`).
  - Quản lý vòng đời trạng thái nghiêm ngặt: `DRAFT` (Bản nháp), `READY` (Sẵn sàng), `ARCHIVED` (Lưu trữ).
  - Duy trì cơ chế snapshot versioning (`modelId`, `modelVersion`) gắn với mỗi generation/project.
- **Ranh giới (Không làm):**
  - Tuyệt đối không tự động tạo người mẫu AI, không sử dụng ảnh stock và không lấy ảnh người khác trên Internet làm người mẫu mẫu.
  - Không dùng nhận diện khuôn mặt sinh trắc học để tự ý phán đoán danh tính; người dùng tự chịu trách nhiệm cam kết ảnh cùng một người và có quyền sử dụng.
  - Không lưu khóa ngoại cố định `templateId` bên trong Model Profile (quan hệ Many-to-Many).
  - Cấm xóa vật lý hồ sơ người mẫu khi đã có generation hoặc dự án video trong lịch sử tham chiếu (`usedInProjectsCount > 0`).

---

## 5. Templates (Video Template Library)
- **Mục tiêu:** Quản lý kho video mẫu có cấu trúc chuyển động, góc máy, nhịp cảnh và vùng trang phục mục tiêu (`garment slot`).
- **Phạm vi trách nhiệm:**
  - Lưu trữ siêu dữ liệu video mẫu: thời lượng, tỷ lệ khung hình, phân tích cảnh (`scenes`), vùng thay trang phục (`garment slots`, mask/segmentation reference).
  - Quản lý trạng thái khả dụng và quyền sử dụng (license/source).
  - Cho phép kết hợp với nhiều người mẫu khác nhau (quan hệ Many-to-Many).
- **Ranh giới (Không làm):**
  - Không lưu khóa ngoại cố định `modelId` bên trong Video Template.
  - Không đưa video chưa rõ bản quyền hoặc không tương thích vào kho template sẵn sàng sản xuất.

---

## 6. Library (Kho Tài nguyên & Sản phẩm Hoàn tất)
- **Mục tiêu:** Không gian lưu trữ có tổ chức toàn bộ sản phẩm sáng tạo của người dùng.
- **Phạm vi trách nhiệm:**
  - Quản lý kho ảnh gốc sản phẩm đã tải lên và các trích xuất Product Truth Sheet.
  - Quản lý danh sách video nền đã cá nhân hóa (`Personalized Base Video`).
  - Quản lý video hoàn thiện (`Final Product Video`), kết quả kiểm duyệt chất lượng (Quality Review) và lịch sử theo dự án.
- **Ranh giới (Không làm):**
  - Không trực tiếp xử lý render; chỉ giữ siêu dữ liệu và đường dẫn tệp tương đối từ `LOCAL_STORAGE_ROOT`.

---

## 7. Credit Wallet (Ví Tín dụng & Quản trị Hạn mức)
- **Mục tiêu:** Quản lý số dư credit cho từng tác vụ AI (sinh ảnh, biến đổi người mẫu, render video chất lượng cao).
- **Phạm vi trách nhiệm:**
  - Ghi nhận biến động số dư theo dạng sổ cái (Ledger Transactions: trừ credit khi tạo task, hoàn credit nếu task thất bại).
  - Kiểm tra điều kiện số dư trước khi cấp phép tác vụ tại Backend.
  - Quản lý các gói nạp và lịch sử giao dịch thanh toán.
- **Ranh giới (Không làm):**
  - Tuyệt đối không để Frontend tự tính toán hay can thiệp vào số dư credit.
