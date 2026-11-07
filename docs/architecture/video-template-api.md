# Đặc Tả API RESTful: Module Video Template Library

Tài liệu này quy chuẩn toàn bộ hợp đồng API (`/api/v1/templates`) cho module Thư viện Video Mẫu của TrendMotion Studio.

---

## 1. Nguyên Tắc Thiết Kế API

1. **Quyền truy cập:**
   - Video Template Library là tài nguyên mẫu do hệ thống cung cấp (Read-only đối với người dùng cuối).
   - Người dùng cuối **không có quyền** tạo, cập nhật hoặc xóa source video template.
   - Thao tác ghi duy nhất của người dùng cuối là **Lưu / Bỏ lưu yêu thích (Toggle Favorite)**.
2. **Lưu trữ & Phục vụ Media Cục bộ:**
   - Không trả về đường dẫn tệp tuyệt đối trên máy chủ.
   - Trả về endpoint nội bộ để trình duyệt tải/phát video: `/api/v1/templates/{template_id}/stream` hoặc `/api/v1/assets/{asset_id}/view`.
   - Endpoint phát video bắt buộc hỗ trợ **HTTP Range Requests (RFC 7233)** để cho phép trình duyệt tua (seek) mượt mà với mã `206 Partial Content`.
3. **Đồng bộ Tìm kiếm & Bộ Lọc:**
   - Hỗ trợ đầy đủ bộ lọc kết hợp: từ khóa, danh mục, loại chuyển động, khoảng thời lượng, tỷ lệ khung hình, vùng trang phục mục tiêu, trạng thái kiểm định và trạng thái yêu thích.

---

## 2. Danh Sách Endpoints

### 2.1. Tra Cứu & Lọc Danh Sách Video Mẫu
- **Endpoint:** `GET /api/v1/templates`
- **Query Parameters:**
  - `query`: string (tìm theo tiêu đề, mã templateCode, mô tả hoặc tag)
  - `category`: string (ID danh mục, ví dụ: `fashion_walk`, `mirror_outfit`, `studio_pose`)
  - `motion_type`: string (loại chuyển động: `walking`, `turn_around`, `standing_pose`, `mirror_movement`)
  - `duration_range`: string (`under_10s`, `10_20s`, `20_30s`, `over_30s`)
  - `aspect_ratio`: string (`9:16`, `16:9`, `1:1`)
  - `garment_slot`: string (`upper_body`, `lower_body`, `dress_full_body`, `jacket_outerwear`, `accessory`)
  - `assessment_status`: string (`SUPPORTED`, `LIMITED`, `UNSUPPORTED`, `NOT_ASSESSED`)
  - `is_favorite`: boolean (`true` để chỉ lọc các template đã lưu)
  - `sort_by`: string (`updated_at_desc`, `duration_asc`, `duration_desc`, `name_asc`, `usage_desc`)
  - `page`: int (mặc định 1)
  - `limit`: int (mặc định 12, tối đa 50)
- **Response `200 OK`:**
```json
{
  "items": [
    {
      "template_id": "vtp-streetwear-001",
      "template_code": "VTP-000101",
      "title": "Fashion Walk Phong Cách Đường Phố",
      "description": "Người mẫu sải bước tự tin trên phố đi bộ, chuyển động nhịp nhàng, góc máy tracking theo từng bước chân.",
      "category_id": "fashion_walk",
      "category_name": "Fashion Walk",
      "tags": ["streetwear", "walking", "autumn"],
      "poster_url": "/api/v1/assets/asset-poster-001/view",
      "preview_url": "/api/v1/assets/asset-preview-001/view",
      "duration_ms": 14200,
      "width": 1080,
      "height": 1920,
      "aspect_ratio": "9:16",
      "frame_rate": 30,
      "status": "PUBLISHED",
      "is_favorite": false,
      "usage_count": 42,
      "garment_slots_summary": ["upper_body", "lower_body"],
      "published_at": "2026-11-01T08:00:00Z",
      "updated_at": "2026-11-04T12:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 12,
  "total_pages": 1
}
```

---

### 2.2. Chi Tiết Video Mẫu
- **Endpoint:** `GET /api/v1/templates/{template_id}`
- **Response `200 OK`:**
```json
{
  "template_id": "vtp-streetwear-001",
  "template_code": "VTP-000101",
  "title": "Fashion Walk Phong Cách Đường Phố",
  "description": "Người mẫu sải bước tự tin trên phố đi bộ, chuyển động nhịp nhàng, góc máy tracking theo từng bước chân.",
  "category_id": "fashion_walk",
  "category_name": "Fashion Walk",
  "tags": ["streetwear", "walking", "autumn"],
  "stream_url": "/api/v1/templates/vtp-streetwear-001/stream",
  "poster_url": "/api/v1/assets/asset-poster-001/view",
  "preview_url": "/api/v1/assets/asset-preview-001/view",
  "duration_ms": 14200,
  "width": 1080,
  "height": 1920,
  "aspect_ratio": "9:16",
  "frame_rate": 30,
  "video_codec": "h264",
  "audio_codec": "aac",
  "template_version_id": "v1.0.0",
  "status": "PUBLISHED",
  "is_favorite": false,
  "usage_count": 42,
  "published_at": "2026-11-01T08:00:00Z",
  "updated_at": "2026-11-04T12:00:00Z",
  "scenes": [
    {
      "scene_id": "scn-01",
      "template_id": "vtp-streetwear-001",
      "scene_order": 1,
      "start_time_ms": 0,
      "end_time_ms": 5200,
      "action_description": "Người mẫu bước vào khung hình từ phía xa, sải bước tự nhiên về phía ống kính.",
      "camera_movement": "Tracking shot lùi dần giữ khoảng cách trung bình",
      "framing": "full_body",
      "subject_visibility": "Toàn thân rõ nét, ánh sáng tự nhiên ban ngày"
    },
    {
      "scene_id": "scn-02",
      "template_id": "vtp-streetwear-001",
      "scene_order": 2,
      "start_time_ms": 5200,
      "end_time_ms": 10500,
      "action_description": "Người mẫu dừng bước, xoay nhẹ người 45 độ khoe dáng áo và túi quần.",
      "camera_movement": "Gimbal xoay chậm ngang tầm mắt",
      "framing": "medium_shot",
      "subject_visibility": "Thân trên và hông rõ nét"
    },
    {
      "scene_id": "scn-03",
      "template_id": "vtp-streetwear-001",
      "scene_order": 3,
      "start_time_ms": 10500,
      "end_time_ms": 14200,
      "action_description": "Người mẫu tiếp tục bước đi lướt qua camera, tạo hiệu ứng chuyển cảnh tự nhiên.",
      "camera_movement": "Cố định khi nhân vật đi qua",
      "framing": "close_up",
      "subject_visibility": "Chi tiết cổ áo và ngực áo"
    }
  ],
  "garment_slots": [
    {
      "slot_id": "slot-01",
      "template_id": "vtp-streetwear-001",
      "slot_type": "upper_body",
      "slot_name": "Áo thân trên",
      "assessment_status": "SUPPORTED",
      "visibility_level": "FULL",
      "occlusion_status": "Không bị vật cản che khuất",
      "notes": "Hỗ trợ áo sơ mi, áo phông, áo nỉ. Dễ dàng nhận diện vạt áo và nẹp áo."
    },
    {
      "slot_id": "slot-02",
      "template_id": "vtp-streetwear-001",
      "slot_type": "lower_body",
      "slot_name": "Quần / Chân váy",
      "assessment_status": "SUPPORTED",
      "visibility_level": "FULL",
      "occlusion_status": "Rõ nét ở cảnh 1 và cảnh 2",
      "notes": "Hỗ trợ quần jean, quần ống rộng, quần túi hộp."
    },
    {
      "slot_id": "slot-03",
      "template_id": "vtp-streetwear-001",
      "slot_type": "dress_full_body",
      "slot_name": "Đầm toàn thân",
      "assessment_status": "LIMITED",
      "visibility_level": "PARTIAL",
      "occlusion_status": "Cảnh 3 góc quay cận cắt mất phần gấu váy",
      "notes": "Chỉ khuyến nghị cho đầm ngắn hoặc đầm dáng suông."
    }
  ],
  "compatibility": {
    "template_id": "vtp-streetwear-001",
    "supported_aspect_ratios": ["9:16"],
    "supported_model_framings": ["full_body", "medium_shot"],
    "supported_subject_count": 1,
    "supported_motion_types": ["walking", "turn_around"],
    "face_visibility_requirement": "Khuôn mặt rõ nét, góc nhìn chính diện và nghiêng 45 độ.",
    "body_visibility_requirement": "Dáng người cân đối, tỷ lệ toàn thân đầy đủ từ đầu đến chân.",
    "occlusion_level": "LOW",
    "limitations": [
      "Không có góc quay lưng 180 độ, không phù hợp cho sản phẩm có điểm nhấn chính ở lưng.",
      "Bối cảnh ngoài trời có ánh nắng, cần ảnh người mẫu có ánh sáng tự nhiên tương đồng."
    ]
  }
}
```

---

### 2.3. Lưu / Bỏ Lưu Yêu Thích (Toggle Favorite)
- **Endpoint:** `POST /api/v1/templates/{template_id}/favorite`
- **Response `200 OK`:**
```json
{
  "template_id": "vtp-streetwear-001",
  "is_favorite": true,
  "message": "Đã lưu video mẫu vào danh sách yêu thích."
}
```

---

### 2.4. Danh Sách Danh Mục Video Mẫu
- **Endpoint:** `GET /api/v1/templates/categories`
- **Response `200 OK`:**
```json
[
  { "id": "all", "name": "Tất cả" },
  { "id": "fashion_walk", "name": "Fashion Walk" },
  { "id": "mirror_outfit", "name": "Mirror Outfit" },
  { "id": "studio_pose", "name": "Studio Pose" },
  { "id": "runway", "name": "Runway" },
  { "id": "lifestyle", "name": "Lifestyle" },
  { "id": "closeup_product", "name": "Close-up Product" }
]
```

---

### 2.5. Phát Luồng Video Cục Bộ Hỗ Trợ HTTP Range Requests
- **Endpoint:** `GET /api/v1/templates/{template_id}/stream`
- **Request Headers:**
  - `Range: bytes={start}-{end}` (hoặc không có nếu tải từ đầu)
- **Response `206 Partial Content` (Khi có header Range):**
  - `Content-Range: bytes {start}-{end}/{total_size}`
  - `Accept-Ranges: bytes`
  - `Content-Length: {chunk_size}`
  - `Content-Type: video/mp4`
- **Response `200 OK` (Khi không có header Range):**
  - `Accept-Ranges: bytes`
  - `Content-Length: {total_size}`
  - `Content-Type: video/mp4`
- **Response `416 Range Not Satisfiable` (Khi byte range vượt ngoài kích thước file):**
  - `Content-Range: bytes */{total_size}`
