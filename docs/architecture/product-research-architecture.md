# KIẾN TRÚC PHÂN HỆ PRODUCT RESEARCH & AFFILIATE PRODUCT DISCOVERY
## FashionTool (TrendMotion Studio) — Prompt 11 Architecture Document

---

## 1. MỤC TIÊU VÀ RANH GIỚI NGHIỆP VỤ

Theo tài liệu [module-boundaries.md](file:///d:/Work/Freelance/ToolFashion/trendmotion-studio/docs/architecture/module-boundaries.md) và [AGENTS.md](file:///d:/Work/Freelance/ToolFashion/trendmotion-studio/AGENTS.md), phân hệ **Product Research** đóng vai trò là công cụ nghiên cứu, sàng lọc và đánh giá cơ hội thương mại cho nhà sáng tạo nội dung thời trang tiếp thị liên kết (Fashion TikTok Shop Affiliate).

### Ranh giới trách nhiệm (Single Responsibility Principle):
- **Phạm vi sở hữu:**
  1. Kết nối và ủy quyền tài khoản TikTok Shop chính thức (TikTok Shop Open Platform OAuth2).
  2. Tra cứu, tìm kiếm, lọc và chuẩn hóa dữ liệu sản phẩm thời trang từ nguồn chính thức.
  3. Phân tích các chỉ số thương mại: Giá bán thực tế, giá khuyến mãi, tỷ lệ hoa hồng affiliate, số tiền hoa hồng ước tính, tình trạng hợp tác (Open / Targeted Collaboration), dữ liệu bán hàng (Units Sold, GMV) khi nguồn cung cấp.
  4. Tính toán điểm cơ hội sản phẩm (**Opportunity Score**) bằng công thức thống kê minh bạch có thể giải thích.
  5. Không gian so sánh sản phẩm đối chiếu trực quan (Product Comparison Workspace).
  6. Lưu trữ và khôi phục lịch sử truy vấn (Search History).
  7. Chuyển giao ngữ cảnh an toàn sang Studio (**Context-Preserving Studio Handoff**).
- **Ranh giới nghiêm ngặt (Tuyệt đối không làm):**
  1. Không trực tiếp sinh video, ghép ảnh hay thay trang phục (thuộc Studio & Garment Engine).
  2. Không thay thế quy trình Product Asset Extraction & Product Truth Sheet (thuộc Prompt 07/09).
  3. Không quản lý kho tài nguyên cá nhân thay cho Library.
  4. Không cào dữ liệu web trái phép (No Scraping), không dùng cookie cá nhân, không vượt CAPTCHA.
  5. Tuyệt đối không sinh dữ liệu giả (fake/mock data) trên môi trường hoạt động để giả vờ rằng marketplace search đã thành công khi tài khoản chưa được phê duyệt Affiliate API.

---

## 2. KẾT NỐI TÀI KHOẢN TIKTOK SHOP & QUY TRÌNH OAUTH2

### 2.1. Phân loại tài khoản & Quyền truy cập (Account Types & Scopes)
1. **Creator Authorization:**
   - Dùng cho nhà sáng tạo nội dung tiếp thị liên kết.
   - Cho phép tìm kiếm sản phẩm đang mở hợp tác công khai (**Open Collaboration**) trong Marketplace.
   - Scopes: `affiliate_creator.open_collaboration.read`, `affiliate_creator.product.read`.
2. **Seller Authorization:**
   - Dùng cho chủ cửa hàng đã ủy quyền cho FashionTool.
   - Cho phép truy cập danh mục sản phẩm của shop (`seller_catalog`).
   - Scopes: `product.list`, `product.read`.
3. **Partner / ISV Authorization:**
   - Ứng dụng đối tác của TikTok Shop Open Platform.
   - Cung cấp dịch vụ giá trị gia tăng thông qua quyền đã được phê duyệt.

### 2.2. Trạng thái kết nối (Connection State Machine)
```
       +-----------------------+
       |     NOT_CONFIGURED    |  (Thiếu App Key / Secret trong .env)
       +-----------+-----------+
                   | Cấu hình App Key & Secret
                   v
       +-----------------------+
       |     DISCONNECTED      |  (Sẵn sàng kết nối OAuth)
       +-----------+-----------+
                   | User nhấn "Kết nối TikTok Shop"
                   v
       +-----------------------+
       | PENDING_AUTHORIZATION |  (Đang chuyển hướng OAuth & chờ callback)
       +-----------+-----------+
                   |
       +-----------+-----------+
       |                       |
       | Thành công            | Chưa được duyệt Affiliate Scope
       v                       v
+---------------+    +-----------------------+
|   CONNECTED   |    | WAITING_FOR_APPROVAL  |
+-------+-------+    +-----------------------+
        | Token hết hạn / Lỗi 401
        v
+---------------+
|REAUTH_REQUIRED|
+---------------+
```

### 2.3. Bảo mật thông tin xác thực (Token Security Mandate)
- **Backend-Only Storage:** `access_token` và `refresh_token` chỉ được lưu trữ an toàn tại Backend (trong `data/db/tiktok_shop_connections.json` hoặc database bảo mật), được mã hóa.
- **Frontend Isolation:** Tuyệt đối **KHÔNG BAO GIỜ** trả `access_token` hoặc `refresh_token` về cho Frontend. Frontend chỉ nhận thông tin định danh: `connection_id`, `account_name`, `account_type`, `market` (VN), `status`, `expires_at`, `scopes`.
- **Zero Log Exposure:** Cấm ghi token vào console log, terminal hoặc HTTP response.

---

## 3. DANH MỤC THỜI TRANG & TAXONOMY MAPPING

Hệ thống cung cấp bảng ánh xạ hai chiều giữa danh mục của TikTok Shop và danh mục chuẩn hóa của TrendMotion Studio:

```
+-----------------------------------------------------------------------------------------+
|                  TIKTOK SHOP CATEGORY  --->  TRENDMOTION TAXONOMY                       |
+-----------------------------------------------------------------------------------------+
| Women's Clothing (601134)              --->  WOMEN_FASHION                              |
|   - Shirts & Blouses                   --->    - shirts_blouses                         |
|   - T-Shirts & Tops                    --->    - t_shirts_tops                          |
|   - Cardigans & Knitwear               --->    - cardigans_knitwear                     |
|   - Dresses                            --->    - dresses                                |
|   - Skirts                             --->    - skirts                                 |
|   - Jeans & Pants                      --->    - pants_jeans                            |
|   - Outerwear & Jackets                --->    - outerwear_jackets                      |
| Men's Clothing (601135)                --->  MEN_FASHION                                |
|   - Shirts                             --->    - shirts                                 |
|   - T-Shirts & Polos                   --->    - t_shirts_polos                         |
|   - Pants & Jeans                      --->    - pants_jeans                            |
|   - Jackets & Coats                    --->    - outerwear_jackets                      |
| Fashion Accessories (601136)           --->  ACCESSORIES                                |
| Footwear & Shoes (601137)              --->  SHOES                                      |
+-----------------------------------------------------------------------------------------+
```
Nếu danh mục nguồn không thể ánh xạ chắc chắn, hệ thống giữ nguyên mã và tên danh mục gốc từ TikTok Shop, đồng thời gắn cờ `INTERNAL_CATEGORY_UNMAPPED` để tiếp tục phân tích sau.

---

## 4. CÔNG THỨC ĐIỂM CƠ HỘI SẢN PHẨM (EXPLAINABLE OPPORTUNITY SCORE)

Không dùng các điểm số AI trừu tượng không có căn cứ. Điểm **Opportunity Score** (thang điểm 100) được tính toán dựa trên các tham số có thể giải thích minh bạch:

$$Score = w_{comm} \cdot S_{comm} + w_{sales} \cdot S_{sales} + w_{price} \cdot S_{price} + w_{collab} \cdot S_{collab}$$

Trong đó:
- **Trọng số ($w$):**
  - Hoa hồng ($w_{comm} = 0.35$): Tỷ lệ hoa hồng từ 5% đến 25%+.
  - Doanh số ($w_{sales} = 0.30$): Số lượng bán đã kiểm chứng trong 30 ngày gần nhất.
  - Phân khúc giá dễ tiếp cận ($w_{price} = 0.20$): Phân khúc giá phù hợp với thị trường thời trang Việt Nam (150.000 VND – 500.000 VND).
  - Tình trạng hợp tác ($w_{collab} = 0.15$): Sản phẩm có sẵn Open Collaboration với điều kiện tham gia thuận lợi.
- **Quy tắc thiếu dữ liệu:**
  Nếu một thành phần quan trọng (ví dụ doanh số hoặc hoa hồng) không được API trả về, hệ thống **KHÔNG** tự gán bằng 0 hoặc phóng đại, mà chuyển sang trạng thái `INSUFFICIENT_DATA` kèm danh sách các trường còn thiếu để người dùng nắm rõ.

---

## 5. BÀN GIAO NGỮ CẢNH SANG STUDIO (CONTEXT-PRESERVING STUDIO HANDOFF)

Khi người dùng quyết định đưa sản phẩm vào sản xuất video thời trang ("Đưa vào Studio"):
1. Hệ thống đóng gói **Handoff Payload**:
   - `product_id`, `product_title`, `product_url`, `primary_image_url`, `reference_images`.
   - `price`, `currency`, `commission_rate`.
   - `shop_name`, `source_category`, `internal_category`.
2. **Kiểm tra điều kiện dự án:**
   - **Trường hợp A:** Người dùng chọn một Project hiện có đã có `Personalized Base Video` ở trạng thái **READY/COMPLETED**.
     -> Chuyển thẳng sang Step 6 (Product Link & Extraction) của Project đó, tự động điền `product_url` và metadata để tiến hành trích xuất Product Asset và tạo Product Truth Sheet.
   - **Trường hợp B:** Người dùng chưa có Project phù hợp.
     -> Điều hướng người dùng tạo Project mới hoặc hoàn thành các bước bắt buộc (Model Profile -> Video Template -> Model Personalization) theo đúng trật tự nghiệp vụ trong AGENTS.md.
   - Tuyệt đối không cho phép bỏ qua bước kiểm tra người mẫu và video nền.
