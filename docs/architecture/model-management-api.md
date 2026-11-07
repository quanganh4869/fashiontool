# Kiến trúc Nghiệp vụ & API Contract: Module Model Management

Tài liệu này xác định kiến trúc dữ liệu, quan hệ thực thể, cơ chế versioning snapshot và API Contract cho module Quản lý Người mẫu (Model Management) trong TrendMotion Studio.

---

## 1. Khái niệm & Kiến trúc Nghiệp vụ

### 1.1. Model Profile
- **Định nghĩa**: Một `Model Profile` là hồ sơ đại diện cho một người mẫu duy nhất do người dùng cung cấp ảnh thật.
- **Tính chất**:
  - Không phải là một ảnh đơn lẻ hay một video ngắn.
  - Một hồ sơ sở hữu một tập hợp nhiều ảnh tham chiếu (`referenceAssets`) của cùng một người ở nhiều góc chụp, trang phục, bố cảnh khác nhau.
  - Là tài sản độc lập, có thể tái sử dụng cho nhiều dự án sản xuất video thời trang trong tương lai.
  - Tuyệt đối không tự động tạo người mẫu AI, không dùng ảnh stock từ internet để làm dữ liệu mặc định.

### 1.2. Vòng đời Trạng thái Hồ sơ (Model Lifecycle)
Hệ thống chỉ sử dụng 3 trạng thái nghiệp vụ chính xác:
```
           [Tạo mới]
               │
               ▼
           ┌─────────┐    Đủ ảnh + xác nhận quyền
           │  DRAFT  │ ─────────────────────────────► ┌─────────┐
           └─────────┘                                │  READY  │
               │                                      └─────────┘
               │ Xóa bản nháp                             │    ▲
               ▼                                  Lưu trữ │    │ Khôi phục
          [Đã xóa hẳn]                                    ▼    │
                                                      ┌──────────┐
                                                      │ ARCHIVED │
                                                      └──────────┘
```
1. **DRAFT (Bản nháp)**: Hồ sơ đang trong quy trình thiết lập 3 bước, chưa hoàn tất tên, chưa đủ ảnh tham chiếu hoặc chưa ký cam kết bản quyền. Chưa thể chọn vào dự án Studio.
2. **READY (Sẵn sàng)**: Hồ sơ đã được hoàn thiện đầy đủ, Backend xác nhận có ít nhất 1 ảnh hợp lệ, có ảnh đại diện, và người dùng đã đồng ý cả hai xác nhận bắt buộc. Có thể được chọn vào nhiều dự án video.
3. **ARCHIVED (Đã lưu trữ)**: Người dùng cất hồ sơ vào kho lưu trữ. Không xuất hiện trong bộ chọn người mẫu của dự án mới, nhưng vẫn bảo toàn đầy đủ dữ liệu lịch sử của các dự án đã sử dụng trước đó. Có thể khôi phục lại trạng thái READY.

### 1.3. Tính Bất biến, Snapshot Versioning & Quan hệ Many-to-Many
- **Quan hệ Many-to-Many (Nhiều - Nhiều):**
  - Một `Model Profile` có thể kết hợp với nhiều `Video Template` khác nhau để tạo ra các video nền khác nhau.
  - Ngược lại, một `Video Template` có thể được kết hợp với nhiều `Model Profile` khác nhau.
  - Tuyệt đối **không** lưu khóa ngoại `templateId` cố định trong Model Profile; không lưu `modelId` cố định trong Video Template.
  - Hai tài nguyên gốc hoàn toàn độc lập và được liên kết thông qua một thực thể trung gian là một lần kết hợp cụ thể (`ModelTemplateGeneration`).
- **Cơ chế Snapshot Versioning cho Video Projects:**
  - Khi một project trong Studio kết hợp người mẫu `modelId` tại thời điểm `modelVersion = 1` với video mẫu `templateId` tại `templateVersion = 1`:
    - Bản ghi `ModelTemplateGeneration` lưu lại snapshot bất biến gồm: `modelId`, `modelVersion`, `templateId`, `templateVersion`, cấu hình generation và danh sách `assetIds` đã được chọn.
    - Kết xuất của lần kết hợp này là một `Personalized Base Video` độc lập.
    - Khi người dùng vào `/models/:modelId/edit` để bổ sung ảnh mới hoặc thay đổi thông tin:
      - Hồ sơ tăng phiên bản `modelVersion = 2`.
      - Các project/generation mới sẽ sử dụng phiên bản `v2`.
      - Các video nền và project cũ đã tạo trước đó vẫn giữ nguyên vẹn liên kết với snapshot `v1`.
- **Chính sách Xóa & Toàn vẹn Dữ liệu:**
  - Hồ sơ `DRAFT` chưa từng liên kết generation hoặc project: Được phép xóa vĩnh viễn.
  - Hồ sơ `READY` hoặc `ARCHIVED` đã được generation, project hoặc video lịch sử tham chiếu: **CẤM XÓA VẬT LÝ** (`usedInProjectsCount > 0`). Backend sẽ chặn thao tác xóa và hướng dẫn người dùng chuyển sang `ARCHIVED`.

---

## 2. Mô hình Dữ liệu (Data Models)

### ModelProfile
```typescript
interface ModelProfile {
  modelId: string; // UUID v4 do Backend tạo
  modelCode: string; // Mã hiển thị duy nhất (MOD-000123)
  displayName: string; // Tên do người dùng đặt (2-60 ký tự)
  description?: string | null; // Ghi chú quản lý (tối đa 500 ký tự)
  coverAssetId?: string | null; // ID của ảnh đại diện được chọn
  referenceAssets: ModelAsset[]; // Danh sách ảnh tham chiếu của cùng 1 người
  status: 'DRAFT' | 'READY' | 'ARCHIVED';
  modelVersion: number; // Tăng khi có cập nhật ảnh/thông tin cốt lõi
  sameModelConfirmed: boolean; // Xác nhận cùng 1 người mẫu
  usageRightsConfirmed: boolean; // Xác nhận có quyền sử dụng hình ảnh
  createdBy: string; // ID tài khoản sở hữu
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
  usedInProjectsCount?: number; // Số dự án / video đã sử dụng (read-only)
}
```

### ModelAsset
Theo quy tắc `AGENTS.md` (Mục 11.1), TrendMotion Studio ưu tiên lưu trữ local filesystem (`LOCAL_STORAGE_ROOT`):
```typescript
interface ModelAsset {
  assetId: string; // UUID v4
  modelId: string; // UUID liên kết hồ sơ
  originalFilename: string; // Tên file gốc người dùng tải lên
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  fileSizeBytes: number; // Dung lượng bytes (tối đa 15MB)
  width?: number | null; // Chiều rộng pixel
  height?: number | null; // Chiều cao pixel
  storagePath: string; // Đường dẫn tương đối trong LOCAL_STORAGE_ROOT (ví dụ: users/{userId}/models/{modelId}/versions/{version}/original/{assetId}.jpg)
  viewUrl: string; // URL truy xuất tệp nội bộ
  thumbnailUrl?: string | null; // URL ảnh xem nhanh
  orderIndex: number; // Thứ tự hiển thị trong bộ sưu tập
  isCover: boolean; // Có phải ảnh đại diện không
  createdAt: string;
}
```

### ModelTemplateGeneration (Thực thể liên kết Many-to-Many)
```typescript
interface ModelTemplateGeneration {
  generationId: string; // UUID v4
  projectId?: string | null; // ID dự án liên kết (nếu có)
  modelId: string; // ID hồ sơ người mẫu tham chiếu
  modelVersion: number; // Snapshot phiên bản người mẫu
  templateId: string; // ID video mẫu tham chiếu
  templateVersion: number; // Snapshot phiên bản template
  selectedAssetIds: string[]; // Danh sách ảnh tham chiếu được dùng
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  baseVideoAssetId?: string | null; // ID của Personalized Base Video kết xuất
  errorMessage?: string | null;
  createdAt: string;
  completedAt?: string | null;
}
```

---

## 3. API Contract Specifications (`/api/v1/models`)

Tất cả các endpoint yêu cầu xác thực người dùng. Dữ liệu trả về chỉ thuộc phạm vi tài khoản hiện tại.

### 3.1. Danh sách & Tìm kiếm
- **Endpoint**: `GET /api/v1/models`
- **Query Parameters**:
  - `query`: string (tìm theo tên hoặc `modelCode`)
  - `status`: `'ALL' | 'READY' | 'DRAFT' | 'ARCHIVED'` (mặc định `'ALL'`)
  - `sort_by`: `'updated_at_desc' | 'created_at_desc' | 'name_asc'` (mặc định `'updated_at_desc'`)
  - `page`: int (mặc định 1)
  - `limit`: int (mặc định 12)
- **Response**:
```json
{
  "items": [
    {
      "model_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "model_code": "MOD-000101",
      "display_name": "Linh Fashion",
      "description": "Người mẫu ảnh lookbook mùa hè",
      "cover_asset_id": "c1f7b8d4-5b6d-4bad-9bdd-2b0d7b3dcb6e",
      "cover_image_url": "https://storage.trendmotion.ai/...",
      "status": "READY",
      "model_version": 1,
      "reference_assets_count": 5,
      "used_in_projects_count": 2,
      "created_at": "2026-11-04T10:00:00Z",
      "updated_at": "2026-11-05T01:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 12,
  "total_pages": 1
}
```

### 3.2. Khởi tạo Bản nháp (Create Draft)
- **Endpoint**: `POST /api/v1/models/draft`
- **Description**: Khởi tạo hồ sơ DRAFT mới và cấp `model_id` cùng `model_code` trước khi người dùng vào Wizard.
- **Response**: Trả về `ModelProfile` ở trạng thái DRAFT.

### 3.3. Xem Chi tiết Hồ sơ
- **Endpoint**: `GET /api/v1/models/{model_id}`
- **Response**: Đầy đủ thông tin `ModelProfile` cùng danh sách `referenceAssets`.

### 3.4. Cập nhật Thông tin Nhận diện (Bước 1 Identity hoặc Edit)
- **Endpoint**: `PATCH /api/v1/models/{model_id}/identity`
- **Request Body**:
```json
{
  "display_name": "Linh Fashion",
  "description": "Ghi chú phân biệt mẫu"
}
```

### 3.5. Upload Ảnh Tham Chiếu Trực Tiếp vào Local Filesystem
- **Endpoint**: `POST /api/v1/models/{model_id}/assets/upload`
- **Request**: `multipart/form-data` chứa file ảnh (`file`)
- **Validation**: Kiểm tra Magic Bytes thực tế (JPEG, PNG, WebP), dung lượng <= 15MB, chống path traversal, lưu vào `./data/storage/users/{user_id}/models/{model_id}/versions/{version}/original/{asset_id}.{ext}` bằng cơ chế atomic move.
- **Response**: Trả về `ModelAsset` với `storage_path` tương đối và `view_url` nội bộ `/api/v1/assets/{asset_id}/view`:
```json
{
  "asset_id": "a91b2c3d-...",
  "model_id": "mod_456-...",
  "original_filename": "model-front-01.jpg",
  "mime_type": "image/jpeg",
  "file_size_bytes": 4502010,
  "storage_path": "users/default_user/models/mod_456/versions/1/original/a91b2c3d.jpg",
  "view_url": "/api/v1/assets/a91b2c3d-.../view",
  "order_index": 0,
  "is_cover": true,
  "created_at": "2026-11-05T01:00:00Z"
}
```

### 3.7. Cập nhật Thứ tự & Ảnh đại diện
- **Endpoint**: `PATCH /api/v1/models/{model_id}/assets/order`
- **Request Body**:
```json
{
  "asset_ids_in_order": ["asset-1", "asset-2", "asset-3"],
  "cover_asset_id": "asset-2"
}
```

### 3.8. Xóa Ảnh khỏi Hồ sơ
- **Endpoint**: `DELETE /api/v1/models/{model_id}/assets/{asset_id}`
- **Validation**: Với hồ sơ READY, cấm xóa nếu chỉ còn đúng 1 ảnh tham chiếu duy nhất.

### 3.9. Hoàn tất Hồ sơ (Bước 3 Finalize: DRAFT → READY)
- **Endpoint**: `POST /api/v1/models/{model_id}/finalize`
- **Request Body**:
```json
{
  "same_model_confirmed": true,
  "usage_rights_confirmed": true
}
```
- **Validation Backend**: Kiểm tra tên không rỗng, ít nhất 1 ảnh tham chiếu đã xác nhận, coverAssetId hợp lệ, cả 2 xác nhận đều là `true`. Chuyển trạng thái sang `READY`.

### 3.10. Lưu trữ & Khôi phục
- **Endpoint**: `POST /api/v1/models/{model_id}/archive` (chuyển sang `ARCHIVED`)
- **Endpoint**: `POST /api/v1/models/{model_id}/restore` (chuyển về `READY`)

### 3.11. Xóa Bản nháp / Xóa Hồ sơ
- **Endpoint**: `DELETE /api/v1/models/{model_id}`
- **Validation**: Kiểm tra nếu hồ sơ đã có project tham chiếu → Trả về HTTP 400 kèm thông báo "Không thể xóa hồ sơ đã được sử dụng trong dự án lịch sử. Vui lòng sử dụng tính năng Lưu trữ."
