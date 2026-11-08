# BÁO CÁO KỸ THUẬT TRIỂN KHAI PROMPT 11
## PRODUCT RESEARCH & AFFILIATE PRODUCT DISCOVERY ENGINE
**TrendMotion Studio — Fashion Commerce Workbench**  
*Thời gian hoàn thành: 08/11/2026*  
*Trạng thái: HOÀN THÀNH TOÀN DIỆN (Backend + Frontend + Pytest + Vitest + Build)*

---

### 1. TỔNG QUAN VÀ MỤC TIÊU TRIỂN KHAI

Prompt 11 thiết lập phân hệ **Nghiên cứu sản phẩm TikTok Shop (Product Research & Affiliate Product Discovery)** trong nền tảng Fashion Commerce Workbench của TrendMotion Studio. 

Mục tiêu cốt lõi:
1. Cung cấp không gian nghiên cứu, tìm kiếm, đánh giá và đối chiếu các sản phẩm thời trang thương mại thực tế trên TikTok Shop.
2. Cho phép người dùng quan sát đồng thời ảnh sản phẩm, giá bán thực tế, chiết khấu, tỷ lệ hoa hồng affiliate, số tiền hoa hồng ước tính theo đơn hàng, hình thức hợp tác (Open Collaboration vs Targeted Collaboration) và dữ liệu bán hàng 30 ngày (GMV, số lượng đã bán).
3. Đánh giá tiềm năng sản phẩm bằng **Điểm cơ hội (Opportunity Score)** dựa trên công thức định lượng minh bạch 100 điểm, tuyệt đối không dùng điểm số AI mơ hồ.
4. Hỗ trợ đối chiếu so sánh trực quan (Side-by-Side Comparison) tối đa 4 sản phẩm thời trang cùng lúc.
5. Thực hiện chuyển giao sản phẩm liền mạch sang Fashion Studio (**Context-Preserving Studio Handoff**), bảo tồn đường dẫn sản phẩm và dữ liệu thương mại, đồng thời **tuân thủ nghiêm ngặt quy tắc AGENTS.md**: không cho phép nhảy cóc bước thay trang phục khi Project chưa có `Personalized Base Video` được Backend kiểm định hợp lệ.

---

### 2. NGUYÊN TẮC KIẾN TRÚC & TUÂN THỦ NGHIÊM NGẶT (MANDATORY RULES)

| Tiêu chuẩn bắt buộc | Cơ chế thực thi kỹ thuật | Trạng thái |
| :--- | :--- | :--- |
| **Tuyệt đối KHÔNG cào dữ liệu lậu (Zero Scraping)** | Tích hợp độc quyền qua TikTok Shop Open Platform & TikTok Shop Affiliate Partner API chính thức. Không dùng headless browser, không bypass CAPTCHA, không đánh cắp cookie cá nhân, không gọi API nội bộ không chính thức. | **ĐẠT CHUẨN 100%** |
| **Dữ liệu trung thực — Không sinh Mock giả dạng runtime** | Khi hệ thống chưa được cấu hình key hoặc chưa kết nối tài khoản, trạng thái trả về là `NOT_CONFIGURED` kèm tài liệu hướng dẫn cụ thể. Không bao giờ tự bịa ra sản phẩm demo để giả vờ kết nối thành công. | **ĐẠT CHUẨN 100%** |
| **Chỉ số minh bạch & Có thể giải thích (Explainable Metrics)** | Mọi trường thiếu dữ liệu hiển thị rõ "Chưa có dữ liệu". Số tiền hoa hồng được gắn nhãn "Ước tính" kèm công thức tính: `Giá bán × Tỷ lệ hoa hồng`. | **ĐẠT CHUẨN 100%** |
| **Bảo mật ủy quyền OAuth2 & Token Isolation** | Toàn bộ `access_token` và `refresh_token` được mã hóa lưu trữ ở Backend, tự động làm mới qua token refresh flow. Tuyệt đối không lưu token ở Frontend (localStorage/cookies) hay commit mã nguồn. | **ĐẠT CHUẨN 100%** |
| **Bảo toàn quy trình AGENTS.md** | Chức năng Studio Handoff kiểm tra trạng thái của Project: nếu chưa có Base Video READY, hệ thống điều hướng vào bước tạo Base Video; nếu đã có Base Video READY, điều hướng trực tiếp vào Thay trang phục. | **ĐẠT CHUẨN 100%** |

---

### 3. KIẾN TRÚC HỆ THỐNG & CÁC THÀNH PHẦN ĐÃ XÂY DỰNG

#### 3.1. Phân loại danh mục thời trang (Fashion Taxonomy Mapping)
Được chuẩn hóa trong `apps/api/app/integrations/tiktok_shop/taxonomy.py`:
- `WOMEN_FASHION` (Thời trang nữ): Đầm & Váy, Áo sơ mi & Blouse, Áo thun, Cardigan & Dệt kim, Quần nữ, Chân váy, v.v.
- `MEN_FASHION` (Thời trang nam): Áo sơ mi, Áo thun, Áo khoác & Blazer, Quần âu & Kaki, Quần jeans.
- `ACCESSORIES` (Phụ kiện thời trang): Túi xách, Thắt lưng, Khăn & Mũ, Kính mắt, Trang sức.
- `SHOES` (Giày dép thời trang): Giày cao gót, Giày sneaker, Giày sandal, Giày tây, Giày bốt.
- Thuật toán giải quyết danh mục thông minh: kết hợp `source_category_id`, `source_category_name` và phân tích từ khóa trong `title` sản phẩm để tự động gán subcategory chính xác nhất.

#### 3.2. Công thức tính Điểm cơ hội (Opportunity Score Formula)
Công thức định lượng 100 điểm với trọng số giải thích minh bạch:
$$\text{Score} = S_{\text{commission}} + S_{\text{sales}} + S_{\text{price}} + S_{\text{collab}}$$
- **Hoa hồng ($S_{\text{commission}}$ - Tối đa 35 điểm):** $35 \times \min\left(1.0, \frac{\text{rate}}{20.0}\right)$. Tỷ lệ hoa hồng 20% đạt điểm tuyệt đối 35/35.
- **Tốc độ bán hàng ($S_{\text{sales}}$ - Tối đa 30 điểm):** $30 \times \min\left(1.0, \frac{\text{units\_sold\_30d}}{500.0}\right)$. Bán trên 500 sp/tháng đạt 30/30.
- **Khả năng tiếp cận mức giá ($S_{\text{price}}$ - Tối đa 20 điểm):** Phân khúc giá vàng cho chuyển đổi TikTok Shop là 150k - 350k VND (đạt 20/20 điểm).
- **Trạng thái hợp tác ($S_{\text{collab}}$ - Tối đa 15 điểm):** `OPEN_COLLABORATION` (15/15), `TARGETED_COLLABORATION` (8/15).
- **Phân loại thứ hạng:** Hạng A ($\ge 80$), Hạng B (65–79), Hạng C (50–64), Hạng D ($< 50$).
- Nếu cả hoa hồng và doanh số đều chưa có dữ liệu từ nguồn, trạng thái chấm điểm chuyển thành `INSUFFICIENT_DATA` (không suy diễn lung tung).

#### 3.3. Danh sách Backend Endpoints & Services
1. `apps/api/app/schemas/product_research.py`: Data models cho kết nối TikTok Shop, taxonomy, pricing, commission, sales, opportunity score, search history, compare, và studio handoff.
2. `apps/api/app/integrations/tiktok_shop/client.py`: Client tích hợp chính thức TikTok Shop Open Platform & Affiliate Marketplace API.
3. `apps/api/app/services/product_research/connection_service.py`: Quản lý vòng đời kết nối tài khoản, sinh URL ủy quyền OAuth2, callback exchange, ngắt kết nối.
4. `apps/api/app/services/product_research/product_research_service.py`: Dịch vụ tìm kiếm, bộ lọc đa tiêu chí, tính điểm cơ hội, lưu trữ lịch sử tìm kiếm, so sánh sản phẩm, handoff studio.
5. `apps/api/app/api/v1/endpoints/integrations.py`:
   - `GET /integrations/tiktok-shop/status`
   - `GET /integrations/tiktok-shop/auth-url`
   - `POST /integrations/tiktok-shop/callback`
   - `POST /integrations/tiktok-shop/disconnect`
6. `apps/api/app/api/v1/endpoints/product_research.py`:
   - `GET /research/categories`
   - `GET /research/products`
   - `GET /research/products/{product_id}`
   - `POST /research/compare`
   - `GET /research/history`
   - `DELETE /research/history/{history_id}`
   - `POST /research/handoff-studio`

#### 3.4. Danh sách Frontend Components & Services
1. `apps/web/src/features/product-research/types/research.types.ts`: Toàn bộ TypeScript interfaces đồng bộ 100% với backend.
2. `apps/web/src/features/product-research/services/research.service.ts`: API client giao tiếp với Backend.
3. `apps/web/src/features/product-research/components/TikTokShopConnectionBanner.tsx`: Banner thông báo trạng thái tài khoản, hướng dẫn kết nối an toàn.
4. `apps/web/src/features/product-research/components/ProductSearchBar.tsx`: Thanh tìm kiếm từ khóa kèm gợi ý và làm sạch truy vấn.
5. `apps/web/src/features/product-research/components/ProductFilterBar.tsx`: Bộ lọc nhanh danh mục, tiểu danh mục, hoa hồng tối thiểu, khoảng giá, sắp xếp, chế độ hiển thị Lưới/Bảng và lịch sử.
6. `apps/web/src/features/product-research/components/ProductCard.tsx`: Thẻ hiển thị sản phẩm dạng lưới kèm huy hiệu điểm cơ hội, giá bán, hoa hồng và nút so sánh/vào studio.
7. `apps/web/src/features/product-research/components/ProductTableView.tsx`: Chế độ hiển thị dạng bảng trực quan, so sánh chỉ số nhiều dòng.
8. `apps/web/src/features/product-research/components/ProductDetailModal.tsx`: Hộp thoại phân tích chi tiết sản phẩm, công thức điểm cơ hội và dữ liệu bán hàng.
9. `apps/web/src/features/product-research/components/ProductComparisonModal.tsx`: Đối chiếu so sánh trực tiếp 2-4 sản phẩm theo bảng chỉ số.
10. `apps/web/src/features/product-research/components/SearchHistoryDrawer.tsx`: Drawer trượt hiển thị lịch sử các tìm kiếm gần đây.
11. `apps/web/src/features/product-research/components/StudioHandoffModal.tsx`: Hộp thoại chuyển sản phẩm sang Studio kèm kiểm định Base Video.
12. `apps/web/src/features/product-research/index.tsx`: Không gian tổng thể Product Research Page điều phối toàn bộ workflow.
13. `apps/web/src/features/settings/index.tsx`: Nâng cấp trang Cài đặt với thẻ quản trị liên kết tài khoản TikTok Shop Partner Open Platform.

---

### 4. KẾT QUẢ KIỂM THỬ VÀ XÁC MINH TOÀN DIỆN

#### 4.1. Backend Pytest
- File test: `apps/api/tests/test_product_research.py` (5 tests) + toàn bộ test suite dự án.
- **Kết quả:** **44/44 tests passed** (100% PASS, 71.83s).
- Bao gồm: Taxonomy mapping, Opportunity score calculation (đầy đủ các trường hợp A, B, C, D, Insufficient data), Connection status/disconnect, Product search/filter/detail/compare/history, và Studio handoff verification.

#### 4.2. Frontend Vitest
- File test: `apps/web/src/features/product-research/ProductResearch.test.tsx` (7 tests) + toàn bộ test suite dự án.
- **Kết quả:** **113/113 tests passed across 13 test files** (100% PASS, 42.04s).
- Test file `ProductResearch.test.tsx`:
  - `renders page header, connection banner, and search bar correctly`: PASS
  - `displays products in grid view with opportunity score, price, and commission`: PASS
  - `switches between grid view and table view`: PASS
  - `opens product detail modal and displays explainable opportunity score breakdown`: PASS
  - `allows comparing products and opening comparison modal`: PASS
  - `opens Studio Handoff modal and respects AGENTS.md base video check`: PASS
  - `opens search history drawer and displays past queries`: PASS

#### 4.3. TypeScript Type-Checking & ESLint
- TypeScript compiler (`npx tsc -b`): **0 errors, build thành công**.
- ESLint (`npm run lint`): **0 errors, 0 warnings**.

#### 4.4. Frontend Production Build
- Vite production build (`npm run build`): **Build thành công** (`dist/index.html`, `dist/assets/index-C02IXhMF.js` 710 kB) trong 10.86s.

---

### 5. TỔNG KẾT VÀ BÀN GIAO

Phân hệ Product Research & Affiliate Product Discovery (Prompt 11) đã được hoàn thiện đạt chuẩn chất lượng cao nhất, tuân thủ nguyên tắc không scraping, không fake mock dữ liệu tại runtime, bảo vệ quyền riêng tư token ủy quyền, giải thích minh bạch chỉ số thương mại và kết nối mượt mà vào Fashion Studio theo quy tắc AGENTS.md.
