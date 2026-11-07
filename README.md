# TrendMotion Studio

> **Fashion Affiliate Research & Video Production Platform**  
> Nền tảng SaaS chuyên biệt nghiên cứu sản phẩm TikTok Shop, phân tích xu hướng thương mại điện tử và sản xuất video thời trang ứng dụng AI theo mô hình **Fashion Commerce Workbench**.

---

## 1. Giới thiệu Dự án

TrendMotion Studio được kiến trúc để phục vụ các nhà sáng tạo nội dung, affiliate marketer và các thương hiệu thời trang:
- **Nghiên cứu thị trường & sản phẩm:** Tra cứu sản phẩm thời trang tiềm năng, lọc theo các chỉ số hoa hồng affiliate, doanh số và dữ liệu video thịnh hành.
- **Không gian làm việc sáng tạo (Fashion Commerce Workbench):** Tích hợp quy trình từ ảnh sản phẩm thật, ghép người mẫu ảo AI (Virtual Try-on), phối bối cảnh và tạo video thương mại chuẩn định dạng 9:16 cho TikTok.

---

## 2. Tech Stack

### Frontend (`apps/web`):
- **Core:** React 18, TypeScript, Vite.
- **Routing:** React Router v6.
- **Styling & Icons:** Tailwind CSS, Lucide React.
- **Package Manager:** pnpm (Workspace Monorepo).

### Backend (`apps/api`):
- **Core:** Python 3.11+, FastAPI, Pydantic v2, Pydantic Settings.
- **Database & ORM:** PostgreSQL 16, SQLAlchemy 2.0, Alembic.
- **Cache & Async Queue:** Redis 7, Celery.
- **Code Quality:** Ruff, Pytest, Pytest-Asyncio.

### Media & External Adapters (Định hướng kiến trúc):
- **Media Engine:** FFmpeg cho pipeline cắt ghép và xử lý video.
- **Object Storage:** Cloudflare R2 (tương thích chuẩn S3 API).
- **AI Integrations:** Provider Adapter Pattern linh hoạt (không vendor lock-in).

---

## 3. Cấu trúc Repository Monorepo

```text
trendmotion-studio/
├── apps/
│   ├── web/                    # React + Vite + TypeScript Frontend
│   └── api/                    # FastAPI + SQLAlchemy + Celery Backend
├── infra/
│   ├── docker/                 # Cấu hình container đặc thù
│   └── scripts/                # Scripts kiểm tra môi trường và quản lý hạ tầng
├── docs/
│   ├── architecture/           # Tài liệu kiến trúc hệ thống và ranh giới module
│   ├── design/                 # Định hướng thiết kế Fashion Commerce Workbench
│   └── development/            # Hướng dẫn cài đặt và quy chuẩn lập trình
├── scripts/                    # Scripts tiện ích cấp monorepo
├── .github/
│   └── workflows/              # GitHub Actions CI pipelines
├── .env.example                # Bản mẫu biến môi trường chuẩn hóa
├── .gitignore                  # Cấu hình loại trừ file của Git
├── .editorconfig               # Quy chuẩn định dạng file đa nền tảng
├── .prettierrc.json            # Quy chuẩn formatting mã nguồn
├── pnpm-workspace.yaml         # Khai báo pnpm workspace
├── package.json                # Root package và scripts điều phối
├── docker-compose.yml          # Hạ tầng PostgreSQL 16 và Redis 7 cho Local Dev
└── README.md                   # Tài liệu giới thiệu tổng thể dự án
```

---

## 4. Hướng dẫn Bắt đầu Nhanh (Quick Start)

### 4.1. Yêu cầu Tiên quyết
- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Python >= 3.11.0
- Docker & Docker Compose

Kiểm tra nhanh phiên bản môi trường:
```powershell
.\infra\scripts\check-env.ps1
```

### 4.2. Khởi tạo Biến Môi trường
Sao chép cấu hình mẫu sang `.env`:
```bash
cp .env.example .env
```

### 4.3. Khởi động Cơ sở hạ tầng (PostgreSQL & Redis)
```bash
docker compose up -d
```

### 4.4. Cài đặt và Chạy Frontend Web
Tại thư mục gốc `trendmotion-studio`:
```bash
# Cài đặt toàn bộ dependencies
pnpm install

# Khởi động máy chủ phát triển Frontend
pnpm dev:web
```
Ứng dụng Web khởi chạy tại: `http://localhost:5173`

### 4.5. Cài đặt và Chạy Backend API
Tại thư mục `apps/api`:
```bash
cd apps/api
python -m venv .venv

# Kích hoạt venv (Windows):
.venv\Scripts\activate
# Kích hoạt venv (Linux/macOS):
source .venv/bin/activate

# Cài đặt dependencies
pip install -e ".[dev]"

# Khởi động máy chủ FastAPI
python -m uvicorn app.main:app --reload --port 8000
```
- API Endpoint: `http://localhost:8000/health`
- Swagger UI Documentation: `http://localhost:8000/api/v1/docs`

---

## 5. Các Lệnh Kiểm Thử & Kiểm Soát Chất Lượng

Từ thư mục gốc `trendmotion-studio`:

| Lệnh | Mô tả |
| :--- | :--- |
| `pnpm dev:web` | Khởi động máy chủ Vite Frontend |
| `pnpm build:web` | Kiểm tra biên dịch ứng dụng Frontend |
| `pnpm type-check:web` | Kiểm tra kiểu dữ liệu TypeScript (`tsc --noEmit`) |
| `pnpm lint:web` | Kiểm tra định dạng và quy chuẩn ESLint cho Frontend |
| `pnpm test:api` | Chạy bộ kiểm thử tự động Pytest cho Backend API |
| `pnpm lint:api` | Kiểm tra cú pháp và quy chuẩn PEP 8 bằng Ruff |
| `pnpm docker:up` | Khởi động PostgreSQL 16 và Redis 7 qua Docker Compose |
| `pnpm docker:down` | Dừng các container cơ sở hạ tầng |

---

## 6. Tài Liệu Chi Tiết

- [Tổng quan kiến trúc hệ thống](docs/architecture/system-overview.md)
- [Ranh giới trách nhiệm các module](docs/architecture/module-boundaries.md)
- [Mô tả chi tiết cấu trúc thư mục](docs/architecture/folder-structure.md)
- [Định hướng thiết kế & Tham khảo (Minea, Creatify, Shopify Admin)](docs/design/design-reference.md)
- [Hướng dẫn thiết lập môi trường chi tiết](docs/development/setup-guide.md)
- [Quy ước lập trình & Coding conventions](docs/development/coding-conventions.md)
