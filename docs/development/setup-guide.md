# Hướng Dẫn Cài Đặt Môi Trường Phát Triển (Setup Guide)

Tài liệu này hướng dẫn chi tiết cách thiết lập môi trường phát triển cục bộ (Local Development Environment) cho dự án **TrendMotion Studio**.

---

## 1. Yêu cầu công cụ và phiên bản khuyến nghị

| Công cụ | Phiên bản khuyến nghị | Mục đích |
| :--- | :--- | :--- |
| **Node.js** | `>= 20.0.0` (Khuyên dùng v20 LTS hoặc v24) | Môi trường runtime cho công cụ Frontend |
| **pnpm** | `>= 9.0.0` (Khuyên dùng v12+) | Quản lý package và monorepo workspace |
| **Python** | `>= 3.11.0` (Khuyên dùng 3.11 - 3.13) | Runtime cho Backend FastAPI |
| **Docker & Docker Compose** | Phiên bản mới nhất | Chạy các dịch vụ cơ sở hạ tầng (PostgreSQL, Redis) |
| **Git** | `>= 2.40.0` | Quản lý phiên bản mã nguồn |

---

## 2. Kiểm tra môi trường cục bộ

Hệ thống cung cấp sẵn script kiểm tra phiên bản các công cụ đã cài đặt:

### Trên Windows (PowerShell):
```powershell
.\infra\scripts\check-env.ps1
```

### Trên Linux / macOS (Bash):
```bash
bash infra/scripts/check-env.sh
```

---

## 3. Khởi tạo cấu hình biến môi trường

Trước khi khởi chạy các ứng dụng, sao chép file mẫu `.env.example` thành file `.env` tại thư mục gốc:

```bash
cp .env.example .env
```

> **LƯU Ý:** Không commit tệp `.env` thực tế vào Git repository. Tệp này đã được cấu hình trong `.gitignore`.

---

## 4. Khởi động Cơ sở hạ tầng (PostgreSQL 16 & Redis 7)

Dự án sử dụng Docker Compose để quản lý PostgreSQL và Redis phục vụ môi trường phát triển:

### Cách 1: Sử dụng Docker Compose trực tiếp
```bash
# Khởi động dịch vụ ở chế độ background
docker compose up -d

# Kiểm tra trạng thái sức khỏe của các container
docker compose ps

# Dừng các dịch vụ khi không sử dụng
docker compose down
```

### Cách 2: Sử dụng script tự động
```powershell
# PowerShell:
.\infra\scripts\docker-dev.ps1

# Bash:
bash infra/scripts/docker-dev.sh
```

- **PostgreSQL 16:** Đang lắng nghe tại cổng `localhost:5432` (Database: `trendmotion_db`, User: `trendmotion_user`).
- **Redis 7:** Đang lắng nghe tại cổng `localhost:6379`.

---

## 5. Khởi động Backend API (`apps/api`)

### Bước 1: Tạo và kích hoạt môi trường ảo Python
Di chuyển vào thư mục `apps/api`:
```bash
cd apps/api

# Tạo virtual environment
python -m venv .venv

# Kích hoạt trên Windows:
.venv\Scripts\activate

# Kích hoạt trên macOS/Linux:
source .venv/bin/activate
```

### Bước 2: Cài đặt dependencies
```bash
pip install --upgrade pip
pip install -e ".[dev]"
```

### Bước 3: Chạy server FastAPI
```bash
python -m uvicorn app.main:app --reload --port 8000
```
- API Health Check: `http://localhost:8000/health`
- Swagger UI (tài liệu tương tác): `http://localhost:8000/api/v1/docs`
- ReDoc: `http://localhost:8000/api/v1/redoc`

---

## 6. Khởi động Frontend Web (`apps/web`)

### Bước 1: Cài đặt dependencies với pnpm
Tại thư mục gốc monorepo (`trendmotion-studio`):
```bash
pnpm install
```

### Bước 2: Khởi động Vite Dev Server
```bash
# Khởi động thông qua root script
pnpm dev:web

# Hoặc di chuyển trực tiếp vào apps/web:
cd apps/web
pnpm dev
```
- Frontend truy cập tại: `http://localhost:5173`

---

## 7. Các lệnh kiểm tra chất lượng mã nguồn (Verification Commands)

Tại thư mục gốc monorepo:

```bash
# Frontend
pnpm lint:web          # Kiểm tra cú pháp ESLint
pnpm type-check:web     # Kiểm tra kiểu dữ liệu TypeScript (tsc --noEmit)
pnpm build:web          # Biên dịch thử nghiệm Frontend Vite

# Backend
pnpm test:api           # Chạy bộ kiểm thử tự động Pytest
pnpm lint:api           # Kiểm tra cú pháp Python bằng Ruff
```
