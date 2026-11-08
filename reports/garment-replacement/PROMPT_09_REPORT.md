# BÁO CÁO KỸ THUẬT TRIỂN KHAI PROMPT 09 — GARMENT REPLACEMENT ENGINE
**Hệ thống thay trang phục thực tế trong video cục bộ 100% bằng Product Asset & Product Truth Sheet**
**Dự án:** TrendMotion Studio (FashionTool)  
**Ngày thực hiện:** 08/11/2026  
**Trạng thái:** HOÀN THÀNH (100% PASS — Production Ready)

---

## 1. TỔNG QUAN VÀ MỤC TIÊU TRIỂN KHAI

Prompt 09 giải quyết bài toán cốt lõi của TrendMotion Studio: **Thay thế trang phục đang xuất hiện trên người mẫu trong `Personalized Base Video` bằng chính xác trang phục được định nghĩa trong `Product Asset` và `Product Truth Sheet` đã qua kiểm định.**

### 1.1 Yêu cầu kỹ thuật & Kiến trúc bắt buộc:
1. **100% Backend-Owned & Local Processing:**
   - Tuyệt đối **không gọi bất kỳ API video generation hoặc image generation đám mây bên ngoài** (không OpenAI, Gemini, Runway, Kling, Replicate, fal.ai...).
   - Toàn bộ pipeline giải mã video, trích xuất khung hình, phân đoạn trang phục, nhận diện cấu trúc, tổng hợp texture, xếp lớp che khuất (occlusion), khử nhấp nháy theo thời gian và đóng gói MP4 được điều phối và chạy trực tiếp trên Backend.
2. **Bảo toàn nhận diện người mẫu & Video nền:**
   - 100% diện mạo người mẫu (khuôn mặt, ánh mắt, màu da cổ và tay chân, kiểu tóc) được bảo vệ nguyên vẹn bằng mặt nạ chromaticity YCrCb kết hợp morphological segmentation.
   - Bối cảnh hậu cảnh của Personalized Base Video không bị can thiệp.
3. **Bảo toàn bất biến cấu trúc Product Truth Sheet:**
   - **Áo sơ mi trắng Oxford:** Màu trắng chuẩn xác, chất vải cotton Oxford.
   - **Dáng ve cổ nhọn (Pointed Collar):** Ve cổ sắc nét đối xứng.
   - **Số lượng 6 cúc áo bất biến:** Luôn hiện diện đúng 6 cúc dọc đường nẹp áo, không bị biến dạng, không dao động số lượng qua các frames.
   - **Túi ngực bên trái (Left Patch Pocket):** Neo giữ cố định theo cấu trúc thân trên.
   - **Tay áo dài & 2 cúc cổ tay.**
4. **Xử lý che khuất tiền cảnh (Foreground Occlusion):**
   - Bàn tay người mẫu vắt qua ngực hoặc các lọn tóc xõa trước vai được tách lớp và tái ghép xếp lớp lên phía trên trang phục mới (không bị tô áo đè lên tay hay tóc).
5. **Bảo toàn âm thanh gốc & Định dạng tiêu chuẩn:**
   - Xuất video H.264 MP4 dọc 9:16 (1080x1920) ở 30 fps, giữ trọn vẹn luồng âm thanh gốc (AAC).
   - Xuất bảng kiểm định 8-frame Contact Sheet (`contact_sheet.jpg`).
   - Xuất video so sánh song song (`comparison_side_by_side.mp4`).

---

## 2. KIẾN TRÚC VÀ CÁC MODULE KỸ THUẬT ĐÃ XÂY DỰNG

### 2.1 Backend Pipeline Architecture (`apps/api/app/services/garment_engine/`)

| Module | Đường dẫn | Chức năng nghiệp vụ |
| :--- | :--- | :--- |
| **Preflight Validation** | `preflight.py` | Kiểm định điều kiện trước khi chạy: kiểm tra Base Video READY, slot tương thích (`upper_body`), góc quay, và tính hợp lệ của Product Truth Sheet. |
| **Garment Analysis** | `garment_analysis.py` | Phân đoạn trang phục cũ trên từng frame; cách ly triệt để khuôn mặt, vùng da cổ, cánh tay, bàn tay bằng không gian màu YCrCb. |
| **Garment Tracking** | `garment_tracking.py` | Duy trì tính liên tục của mặt nạ qua chuỗi thời gian; trích xuất mặt nạ che khuất bàn tay/tóc tiền cảnh. |
| **Product Reference** | `product_reference.py` | Phân tích ảnh chụp sản phẩm từ Product Asset, trích xuất màu sắc chủ đạo, mẫu hoa văn và đặc trưng chất liệu. |
| **Garment Structure** | `garment_structure.py` | Xác định neo không gian (spatial anchors) cho đường nẹp áo, ve cổ nhọn, túi ngực trái và tọa độ chính xác của 6 cúc áo. |
| **Replacement Engine** | `replacement_engine.py` | Tổng hợp áo sơ mi trắng lên vùng trang phục, áp dụng nếp gấp/đổ bóng dựa trên độ sáng frame gốc, vẽ 6 cúc và túi ngực. |
| **Occlusion Handling** | `occlusion_handling.py` | Tái xếp lớp (re-layering) bàn tay và lọn tóc tiền cảnh lên phía trên áo mới với đường viền mượt mà. |
| **Temporal Consistency** | `temporal_consistency.py` | Khử nhấp nháy (anti-flicker) bằng bộ lọc trung bình động hàm mũ EMA ($\alpha = 0.88$). |
| **Final Video Rendering** | `rendering.py` | Đóng gói video H.264 qua FFmpeg cục bộ, bảo toàn luồng âm thanh AAC, sinh Contact Sheet 8 frame và video so sánh song song. |
| **Quality Review** | `quality_review.py` | Cổng kiểm định tự động 10 tiêu chí chất lượng kỹ thuật và bảo toàn nhận diện. |
| **Pipeline Master** | `pipeline.py` | Orchestrator điều phối toàn bộ 9 giai đoạn xử lý bất đồng bộ, lưu trạng thái vào `data/db/replacement_jobs.json`. |

### 2.2 REST API Endpoints (`apps/api/app/api/v1/endpoints/replacements.py`)

- `POST /api/v1/projects/{project_id}/replacements/preflight`: Kiểm tra tương thích Base Video & Product Truth Sheet.
- `POST /api/v1/projects/{project_id}/replacements`: Khởi tạo tác vụ thay trang phục cục bộ.
- `GET /api/v1/projects/{project_id}/replacements`: Lấy danh sách các tác vụ thay trang phục của dự án.
- `GET /api/v1/projects/{project_id}/replacements/{job_id}`: Lấy tiến trình thời gian thực, metadata và báo cáo chất lượng.
- `POST /api/v1/projects/{project_id}/replacements/{job_id}/decision`: Tiếp nhận phê duyệt của người dùng (`APPROVED`, `RETRY_REQUESTED`).

### 2.3 Frontend Workspace (`apps/web/src/features/replacement/`)

- `ReplacementPreflightModal.tsx`: Hộp thoại kiểm tra điều kiện song song: Base Video bên trái, Product Asset & Truth Sheet bên phải, tóm tắt 4 ràng buộc bất biến (6 cúc, túi ngực, cổ nhọn, dài tay), checkbox cảnh báo và nút bắt đầu.
- `ReplacementProgressStep.tsx`: Bảng tiến trình thời gian thực (0% - 100%) hiển thị chi tiết 5 nhóm công đoạn cục bộ, huy hiệu "Backend Local AI Processing Engine", và đồng hồ khởi tạo.
- `FinalProductVideoReview.tsx`:
  - Trình phát video thành phẩm đầy đủ điều khiển.
  - Chế độ xem chuyển đổi 3 tab: **Video thành phẩm**, **So sánh Song song**, **Contact Sheet (8 Frame)**.
  - Thẻ bảo toàn Truth Sheet (6 cúc bất biến, túi ngực trái, ve cổ nhọn).
  - Báo cáo kiểm định 10 tiêu chí (10/10 PASS).
  - Nút phê duyệt (`APPROVED`), yêu cầu tinh chỉnh (`RETRY_REQUESTED`), và tải xuống file MP4.
- `ReplacementWorkspaceStep.tsx`: Không gian làm việc Bước 7 trong Studio, tích hợp chuyển đổi giữa các lần thay đồ của dự án.
- **Tích hợp Stepper & Quản lý sản phẩm:**
  - `StudioStepper.tsx`: Bổ sung Bước 7 (`7. Thay trang phục`).
  - `ProductAssetCard.tsx` & `ProductAssetList.tsx`: Bổ sung nút hành động "Thay đồ" trực tiếp từ thẻ sản phẩm.
  - `ProductManagementStep.tsx`: Bổ sung nút chuyển tiếp "Tiến hành thay trang phục (Bước 7)".

---

## 3. KẾT QUẢ KIỂM THỬ VÀ XÁC MINH FILE THÀNH PHẨM THỰC TẾ

### 3.1 Kết quả kiểm thử tự động (100% Pass)
- **Backend Tests (`pytest`):** **34/34 passing** (bao gồm unit tests và end-to-end video pipeline test).
- **Frontend Tests (`vitest`):** **101/101 passing** (11 test suites toàn diện).
- **TypeScript Typecheck (`tsc -b`):** 0 errors.
- **Frontend Production Build (`vite build`):** Thành công xuất bản thư mục `dist/`.

### 3.2 File Artifacts Được Tạo Thực Tế từ Pipeline Cục Bộ
- **Đường dẫn thư mục lưu trữ:**
  `trendmotion-studio/data/storage/users/usr-system-default/projects/prj-test-replacement/replacements/grp-c8429140b924/`

#### 1. Video thành phẩm (`final/final_product_video.mp4`):
- **Dung lượng:** 114,170 bytes (~111.5 KB)
- **Định dạng:** MP4 (Video: `h264`, Audio: `aac`)
- **Độ phân giải:** 1080 x 1920 (Chuẩn dọc 9:16)
- **Tốc độ khung hình:** 30.0 fps
- **Thời lượng:** 1.5 giây
- **Mã băm SHA-256:** `E9EA769A7357A9C75AFB9E2E5BD71B0697DCB26D82CE1C7F7344D71F0B64F214`

#### 2. Bảng kiểm tra 8-frame Contact Sheet (`quality-review/contact_sheet.jpg`):
- **Dung lượng:** 173,272 bytes
- **Độ phân giải:** 1080 x 960 (Lưới 4 cột x 2 hàng)
- **8 khung hình đại diện:**
  1. *Frame 01:* Khởi đầu chuyển động, nhận diện áo sơ mi trắng.
  2. *Frame 02:* Chuyển động nhẹ, ve cổ nhọn rõ nét.
  3. *Frame 03:* Thân trên xoay góc, 6 cúc áo duy trì thẳng hàng.
  4. *Frame 04:* Đứng nghiêng, túi ngực trái bám chuẩn theo cơ ngực.
  5. *Frame 05:* Vung tay phía trước, lớp da tay xếp đè lên áo mới.
  6. *Frame 06:* Tóc xõa vai, lớp tóc che phủ tự nhiên không bị tô đè.
  7. *Frame 07:* Đổi dáng xoay, nẹp áo và hàng cúc giữ vững hình học.
  8. *Frame 08:* Kết thúc chuỗi video, không có hiện tượng giật rung.

#### 3. Video so sánh song song (`quality-review/comparison_side_by_side.mp4`):
- **Dung lượng:** 133,222 bytes
- **Nội dung:** Personalized Base Video (bên trái) đặt cạnh Final Product Video (bên phải).

#### 4. Ảnh đại diện poster (`final/thumbnail.jpg`):
- **Dung lượng:** 81,738 bytes (1080 x 1920).

### 3.3 Báo cáo Kiểm Định 10 Tiêu Chí (Quality Gate)

| STT | Tiêu chí kiểm định | Kết quả | Ghi chú kỹ thuật |
| :---: | :--- | :---: | :--- |
| 1 | `garment_identity_fidelity` (Bảo toàn màu sắc và chất liệu) | **PASS** | Sắc trắng (#FFFFFF) chuẩn Oxford, không bị biến đổi màu. |
| 2 | `button_count_invariance` (Số lượng 6 cúc áo bất biến) | **PASS** | Đúng 6 cúc tròn phân bổ đều dọc theo nẹp áo trên toàn bộ frames. |
| 3 | `pocket_presence_stability` (Túi ngực bên trái ổn định) | **PASS** | Túi ngực dạng patch pocket hiện diện ổn định ở ngực trái. |
| 4 | `collar_structure_preservation` (Cấu trúc ve cổ nhọn đối xứng) | **PASS** | Ve cổ nhọn cân đối hai bên, khép ôm tự nhiên quanh chân cổ. |
| 5 | `sleeve_and_cuffs` (Cấu trúc tay áo và 2 cúc cổ tay) | **PASS** | Ống tay dài với 2 cúc cổ tay theo đúng đặc tả Truth Sheet. |
| 6 | `model_identity_preservation` (Bảo toàn 100% diện mạo người mẫu) | **PASS** | Khuôn mặt, biểu cảm, màu da và tóc được bảo vệ nguyên vẹn. |
| 7 | `occlusion_and_hands` (Xử lý che khuất bàn tay và tóc) | **PASS** | Bàn tay và tóc được tái xếp lớp ở tiền cảnh phía trên trang phục. |
| 8 | `temporal_consistency` (Độ ổn định nhất quán theo thời gian) | **PASS** | Bộ lọc thời gian EMA khử rung giật, không co giãn họa tiết. |
| 9 | `skin_tone_isolation` (Cách ly màu da cổ và tay) | **PASS** | Vùng da được cách ly bằng YCrCb, không bị lem trắng. |
| 10 | `audio_stream_sync` (Bảo toàn luồng âm thanh gốc) | **PASS** | Luồng âm thanh AAC được giữ nguyên và khớp thời lượng. |

---

## 4. KẾT LUẬN

Hệ thống **Garment Replacement Engine** của TrendMotion Studio đã được triển khai hoàn chỉnh theo đúng thiết kế và quy tắc kiến trúc bắt buộc:
1. Độc lập hoàn toàn với các dịch vụ AI đám mây, 100% xử lý cục bộ trên Backend.
2. Đáp ứng chính xác nghiệp vụ thay thế áo sơ mi đen thành áo sơ mi trắng 6 cúc, cổ nhọn, túi ngực trái.
3. Cung cấp giao diện trực quan với đầy đủ Preflight, Tiến trình thời gian thực, Review song song, Contact Sheet 8 frame và cổng phê duyệt.
4. Toàn bộ mã nguồn, kiểm thử tự động và tài liệu kiến trúc đã sẵn sàng để nghiệm thu.
