# Quy Ước Mã Nguồn & Tiêu Chuẩn Lập Trình (Coding Conventions)

Tài liệu này xác định các quy chuẩn lập trình bắt buộc áp dụng trong toàn bộ repository **TrendMotion Studio** cho cả Frontend (TypeScript/React) và Backend (Python/FastAPI).

---

## 1. Quy ước đặt tên (Naming Conventions)

### 1.1. Frontend (TypeScript / React)
- **Thư mục (Directories):** `kebab-case` (ví dụ: `product-research/`, `credit-wallet/`).
- **Tệp mã nguồn (Files):**
  - Component React: `PascalCase.tsx` (ví dụ: `ProductCard.tsx`, `AppProviders.tsx`).
  - Hooks: `camelCase.ts` bắt đầu bằng `use` (ví dụ: `useDebounce.ts`, `useAuth.ts`).
  - Utilities / Services / Constants: `camelCase.ts` hoặc `kebab-case.ts` (ví dụ: `formatDate.ts`, `apiClient.ts`).
  - Entrypoint: `index.ts` hoặc `index.tsx`.
- **Components:** `PascalCase` (ví dụ: `function VideoPlayerCanvas() {}`).
- **Biến & Hàm (Variables & Functions):** `camelCase` (ví dụ: `fetchAffiliateProducts`, `isLoading`).
- **Hằng số (Constants):** `UPPER_SNAKE_CASE` (ví dụ: `API_BASE_URL`, `MAX_RETRIES`).
- **Interfaces & Types:** `PascalCase`, không dùng tiền tố `I` (ví dụ: `ProductItem`, `VideoGenerationTask`).

### 1.2. Backend (Python / FastAPI)
- **Thư mục (Packages) & Tệp (Modules):** `snake_case` (ví dụ: `image_generation/`, `video_generation/`, `celery_app.py`).
- **Lớp (Classes):** `PascalCase` (ví dụ: `BaseTikTokClient`, `HealthCheckResponse`).
- **Hàm & Phương thức (Functions & Methods):** `snake_case` (ví dụ: `get_creator_profile`, `generate_fashion_image`).
- **Biến (Variables):** `snake_case` (ví dụ: `task_id`, `database_url`).
- **Hằng số (Constants):** `UPPER_SNAKE_CASE` (ví dụ: `DEFAULT_TIMEOUT`, `JWT_ALGORITHM`).
- **Pydantic Schemas:** Hậu tố `Request` hoặc `Response` (ví dụ: `CreateTaskRequest`, `HealthCheckResponse`).

---

## 2. Cấu trúc tổ chức Import (Import Organization)

### 2.1. Frontend (TypeScript)
Imports được gom nhóm theo thứ tự ưu tiên, cách nhau bởi một dòng trống:
1. Thư viện React và bên thứ ba (ví dụ: `react`, `react-router-dom`, `lucide-react`).
2. Module cấu hình & providers cấp ứng dụng (ví dụ: `@/app/config`, `@/app/providers`).
3. Services và API clients (ví dụ: `@/services/api`).
4. Components & Layouts (ví dụ: `@/components/ui/Button`).
5. Hooks, Utilities & Constants (ví dụ: `@/utils`, `@/constants`).
6. Types & Interfaces (ví dụ: `import type { ApiResponse } from '@/types'`).
7. Styles (ví dụ: `./styles.css`).

### 2.2. Backend (Python)
Tuân thủ chuẩn PEP 8 và cấu hình `ruff` tự động (`isort` rules):
1. Thư viện chuẩn Python (`sys`, `os`, `abc`, `pathlib`).
2. Thư viện bên thứ ba (`fastapi`, `pydantic`, `sqlalchemy`, `celery`).
3. Module nội bộ ứng dụng (`app.core`, `app.db`, `app.schemas`, `app.services`).

---

## 3. Quy tắc kiểm soát chất lượng mã nguồn

1. **Strict Type-Checking:**
   - Frontend: Bật chế độ `strict: true` trong TypeScript. Tuyệt đối không sử dụng `any` vô cớ (dùng `unknown` hoặc generic nếu chưa rõ type).
   - Backend: Toàn bộ endpoint và method nghiệp vụ phải có type hint đầy đủ cho cả tham số và giá trị trả về.
2. **Không nén code quá mức (No monolithic files):**
   - Giữ kích thước mỗi tệp dưới 300 dòng.
   - Router chỉ làm nhiệm vụ parse request và gọi service. Không viết câu lệnh SQL hoặc logic nghiệp vụ phức tạp trực tiếp trong file endpoint.
3. **Quản lý biến môi trường an toàn:**
   - Tuyệt đối không hardcode API key, mật khẩu database hay bí mật trong source code.
   - Luôn định nghĩa giá trị mặc định an toàn cho môi trường development và yêu cầu bắt buộc qua biến môi trường khi triển khai staging/production.
4. **Xử lý bất đồng bộ (Async/Await):**
   - Frontend: Xử lý Promise với async/await, bọc trong try/catch hoặc sử dụng React Query / custom fetcher có error boundary.
   - Backend: Toàn bộ API endpoint và I/O task sử dụng hàm `async def` kết hợp non-blocking I/O.
