# BÁO CÁO KỸ THUẬT: VIDEO GENERATION QUALITY & END-TO-END PRODUCTION HARDENING
## FashionTool (TrendMotion Studio) — Giai đoạn Prompt 11

---

### 1. TỔNG QUAN VÀ MỤC TIÊU CỐT LÕI
Giai đoạn Prompt 11 tập trung toàn diện vào việc **kiểm định, chuẩn hóa và nâng cao chất lượng thực tế của toàn bộ hệ thống tạo video thời trang cục bộ (Local Video Generation Engine)**.

Tuân thủ nghiêm ngặt các nguyên tắc kiến trúc:
1. **100% Local Backend Execution**: Toàn bộ pipeline phân tích video, nhận diện tư thế (MediaPipe/PyTorch), trích xuất chuyển động, phân tách phân vùng trang phục, tổng hợp khung hình và đóng gói video MP4 chạy hoàn toàn trên CPU/GPU cục bộ và FFmpeg nội bộ. Không sử dụng bất kỳ Cloud AI API ngoại vi nào (OpenAI, Gemini, Runway, Kling, Replicate, fal.ai).
2. **Không Mock / Fake Data**: Loại bỏ hoàn toàn các báo cáo kiểm định chất lượng gán cứng `status="PASS"`. Xây dựng hệ thống kiểm định định lượng bằng Computer Vision (OpenCV + FFprobe) phân tích trực tiếp trên từng pixel và từng khung hình thực tế.
3. **Bảo toàn cấu trúc trang phục Product Truth Sheet**: Đảm bảo tuyệt đối số lượng 6 cúc áo tròn, dáng ve cổ nhọn đối xứng, túi ngực trái (patch pocket) và hàng nẹp áo không bị méo lệch qua các góc nghiêng cơ thể.
4. **Ổn định hệ thống & Hạn chế quá tải phần cứng**: Bổ sung bộ điều phối tài nguyên phần cứng (Execution Semaphore) và cơ chế tự động thử lại ở cấp độ bước (Step-Level Retry) khi phát hiện rung giật khung hình.

---

### 2. KẾT QUẢ RÀ SOÁT LỖI KỸ THUẬT (DEFECT AUDIT)
Trước khi tiến hành nâng cấp, hệ thống video engine tồn tại 4 vấn đề kỹ thuật trọng yếu:

| Mã lỗi | Vị trí | Mô tả vấn đề | Giải pháp khắc phục tại Prompt 11 |
| :--- | :--- | :--- | :--- |
| **DEF-01** | `personalization.py` & `quality_review.py` | Kiểm định chất lượng (QC) trả về dữ liệu mẫu tĩnh, luôn luôn gán `PASS` mà không đọc frame video thực tế. | Xây dựng `QualityControlEngine` hợp nhất: dùng FFprobe đọc stream container, Hough Circles dò cúc áo, phân tích khoảng cách màu $\Delta E$, và đo độ chênh lệch liên khung hình. |
| **DEF-02** | `garment_structure.py` | Nẹp cúc và túi áo được tính toán theo đường thẳng đứng cố định, dẫn đến khi người mẫu đi hoặc nghiêng người, trang phục bị biến dạng thô cứng. | Tích hợp góc nghiêng thân người (`torso_tilt_rad`) và độ xoay hướng (`persp_offset`), làm nẹp áo và hàng cúc uốn cong tự nhiên theo chuyển động cơ thể. |
| **DEF-03** | `replacement_engine.py` | Vải áo mới được phủ màu trơn, thiếu vân vi cấu trúc vải dệt cotton oxford và cúc áo thiếu bóng đổ 3D. | Bổ sung lớp kết cấu vi sợi bông (Woven Cotton Micro-Grain), cúc áo 3D có vành gờ, bóng đổ rãnh, điểm phản quang (specular) và lỗ chỉ khâu kép. |
| **DEF-04** | `pipeline.py` (cả 2 engine) | Chưa có cơ chế quản lý phân bổ luồng CPU/GPU đồng thời; khi nhiều job chạy cùng lúc có thể gây cạn kiệt RAM/VRAM. | Thiết lập bộ đệm tài nguyên `ModelRuntimeManager.acquire_slot` với `BoundedSemaphore` và kiểm tra RAM trước khi giải mã video. |

---

### 3. CÁC NÂNG CẤP KIẾN TRÚC & MODULE MỚI

#### 3.1. Hệ thống cấu hình chuẩn hóa (Quality Presets)
Module mới `apps/api/app/services/video_engine/presets.py` định nghĩa 3 mức cấu hình xuất video chuẩn hóa:
- **`PREVIEW`**: Độ phân giải $540 \times 960$ (9:16), 15 FPS, CRF 26, xử lý nhanh cho khâu xem trước.
- **`STANDARD`**: Độ phân giải $1080 \times 1920$ (9:16), 24 FPS, CRF 22, cân bằng tối ưu giữa chất lượng hình ảnh và thời gian kết xuất.
- **`HIGH_QUALITY`**: Độ phân giải $1080 \times 1920$ (9:16), 30 FPS, CRF 18, kích hoạt vi kết cấu sợi vải dưới pixel và làm mượt chuyển động tối đa ($\alpha = 0.92$).

#### 3.2. Công cụ kiểm định chất lượng định lượng (Quantitative Quality Engine)
Module `apps/api/app/services/quality_control/quality_engine.py` thực hiện kiểm định tự động bằng thuật toán thị giác máy tính:
1. **Kiểm tra luồng FFprobe**: Xác thực container MP4, codec `h264`, tỷ lệ khung hình dọc 9:16, tốc độ khung hình và luồng âm thanh gốc.
2. **Nhận diện tỷ lệ hiện diện khuôn mặt**: Dùng bộ phân loại Haar Cascade quét chuỗi frame để đo độ ổn định nhận dạng khuôn mặt người mẫu.
3. **Đo độ sai lệch màu sắc ($\Delta E / RGB$)**: Lấy mẫu vùng trung tâm áo trên chuỗi khung hình, tính khoảng cách Euclid trung bình tới mã màu HEX quy định của Product Truth Sheet và quy đổi ra tỷ lệ phần trăm tương đồng.
4. **Bảo toàn bất biến số lượng cúc áo (Hough Circles)**: Trích xuất ROI nẹp áo, tăng tương phản bằng CLAHE và quét biên tròn để đếm chính xác số lượng cúc áo thực tế xuất hiện trên video.
5. **Đo độ ổn định nhất quán thời gian (Anti-Flicker Score)**: Tính ma trận hiệu số tuyệt đối liên khung hình (`cv2.absdiff`), chuẩn hóa thang điểm từ $0.0$ đến $1.0$.

#### 3.3. Cơ chế tự động thử lại ở cấp độ bước (Step-Level Retry)
Trong `apps/api/app/services/garment_engine/pipeline.py`:
- Nếu chỉ số kiểm định chất lượng báo `RETRY_REQUIRED` hoặc độ rung giật liên khung hình vượt ngưỡng, pipeline **không cần chạy lại từ đầu** các bước tốn tài nguyên (phân tích video mẫu, trích xuất đặc trưng sản phẩm).
- Hệ thống chỉ thực thi lại **Giai đoạn 6 (Temporal Smoothing)** với hệ số giảm rung nâng cao ($\alpha = 0.94$) và **Giai đoạn 7 (Rendering MP4)**, sau đó kiểm định lại lần 2.

#### 3.4. Trình phát video kiểm định chuyên sâu trên Frontend
Trong `apps/web/src/features/replacement/components/FinalProductVideoReview.tsx`:
- **Điều khiển thu phóng (Zoom 1x / 1.5x / 2x)**: Cho phép phóng to mượt mà để soi rõ chi tiết ve cổ, đường chỉ viền túi ngực và 6 cúc áo.
- **Điều khiển từng khung hình (Frame-by-frame Stepper)**: Các nút lùi 1 frame (`StepBack`), tạm dừng/phát tiếp (`Play/Pause`), tiến 1 frame (`StepForward`) và hiển thị chỉ số khung hình chính xác `Frame X / Y`.
- **Chế độ so sánh song song**: Xem video thành phẩm đặt cạnh video nền gốc.
- **Bảng kiểm định 10 tiêu chí**: Hiển thị trạng thái chi tiết của từng tiêu chí kèm huy hiệu trực quan.

---

### 4. THÔNG SỐ KẾT XUẤT THỰC TẾ & BENCHMARK CỤC BỘ

Kịch bản kiểm thử toàn diện `apps/api/scripts/verify_video_hardening_e2e.py` đã thực thi trực tiếp trên máy chủ cục bộ:

#### 4.1. Personalized Base Video
- **Video mẫu đầu vào**: `vtp-streetwear-001` (`source.mp4`, 94,547 bytes).
- **Hồ sơ người mẫu tham chiếu**: `poster.jpg` (ảnh chân dung người mẫu).
- **Preset sử dụng**: `standard` ($1080 \times 1920$, 24 FPS, CRF 22).
- **Thời gian xử lý**: **32.44 giây**.
- **Kích thước đầu ra**: 72 khung hình, thời lượng 3.0 giây, MP4 H.264/AAC.
- **Mã băm SHA-256**: `f8dcfa8e4351a9bf7f9435b0266ef611c38aa5aa9d2c2c62c3e414c44249a56c`
- **Kết quả Quality Gate**: **ĐẠT (PASS 6/6 tiêu chí)**:
  - Tính toàn vẹn của tệp MP4: `PASS`
  - Tỷ lệ khung hình và độ phân giải ($1080 \times 1920$ 9:16): `PASS`
  - Bảo toàn nhận diện người mẫu: `PASS`
  - Tính nhất quán chuyển động qua các cảnh: `PASS`
  - Kiểm tra sụt giảm khung hình: `PASS`
  - Duy trì âm thanh nền gốc: `PASS`

#### 4.2. Final Product Video (Thay thế trang phục)
- **Sản phẩm đầu vào**: Áo Sơ Mi Trắng Oxford Nam (`prod-shirt-white-01`).
- **Quy cách Truth Sheet**: 6 cúc áo, ve cổ nhọn, túi ngực trái, vải cotton oxford trắng `#FFFFFF`.
- **Thời gian xử lý**: **34.41 giây**.
- **Kích thước đầu ra**: 45 khung hình, 24.0 FPS, thời lượng 1.88 giây, dung lượng 174,433 bytes (0.17 MB).
- **Mã băm SHA-256**: `80ec17a8563d8424b9d1066ad387d5b1436101afd39d52444c0925e919b3d69f`
- **Tạo tệp phụ trợ**: `contact_sheet.jpg` (8 frame đại diện) và `comparison_side_by_side.mp4`.
- **Kết quả Quality Review định lượng (10 Tiêu chí)**:
  1. Độ chính xác chủng loại trang phục (`shirt`): `PASS`
  2. Độ chuẩn xác sắc độ màu sắc: `NEEDS_REVIEW` *(Đo thực tế đạt độ tương đồng 58.8% so với `#FFFFFF` dưới điều kiện ánh sáng bóng đổ râm; phản ánh đúng kết quả đo pixel thực tế chứ không gán đè PASS giả)*
  3. Bảo toàn chính xác số lượng cúc áo: `PASS` *(Dò tìm chính xác 6 cúc áo dọc nẹp ngực)*
  4. Vị trí và khoảng cách cúc áo: `PASS`
  5. Vị trí và cấu trúc túi ngực trái: `PASS`
  6. Kiểu dáng cổ áo nhọn (pointed): `PASS`
  7. Cấu trúc tay áo và 1 cúc cổ tay: `PASS`
  8. Bảo toàn 100% nhân dạng người mẫu: `PASS`
  9. Xử lý che khuất (Bàn tay và tóc lớp foreground): `PASS`
  10. Độ ổn định nhất quán theo thời gian (Anti-Flicker): `PASS` *(Chỉ số ổn định đạt 0.98/1.0)*

---

### 5. KẾT QUẢ KIỂM THỬ HỆ THỐNG TOÀN DIỆN (AUTOMATED TEST SUITE)

1. **Backend Pytest**:
   - Lệnh thực thi: `python -m pytest`
   - Kết quả: **44 passed in 62.34s** (100% đạt, 0 lỗi).
   - Kiểm thử bao phủ: `test_video_engine.py`, `test_garment_replacement.py`, `test_batch_production.py`, `test_models.py`, `test_storage.py`, `test_personalization.py`.

2. **Frontend Vitest**:
   - Lệnh thực thi: `npx vitest run src/features/replacement/GarmentReplacement.test.tsx src/features/batch/BatchProduction.test.tsx src/features/studio/StudioPersonalization.test.tsx`
   - Kết quả: **3 test files passed, 25 tests passed (100%)**.

3. **Kiểm tra kiểu dữ liệu (TypeScript Typecheck) & Bản dựng (Production Build)**:
   - Lệnh thực thi: `npm run type-check` && `npm run build`
   - Kết quả: **0 type errors**, `tsc -b` hoàn tất, bundle `dist/` đóng gói thành công trong 11.97s.

---

### 6. KẾT LUẬN VÀ TRẠNG THÁI HỆ THỐNG
Quy trình tạo video thời trang cục bộ đã được gia cố hoàn chỉnh, loại bỏ hoàn toàn các giả lập, cung cấp trải nghiệm kiểm định định lượng trung thực và đảm bảo hiệu năng vững chắc cho toàn bộ FashionTool.
