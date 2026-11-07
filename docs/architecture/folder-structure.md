# Cấu Trúc Thư Mục Repository TrendMotion Studio

Tài liệu này chuẩn hóa vai trò và loại file được phép đặt trong từng thư mục của repository `trendmotion-studio`. Cấu trúc tuân thủ mô hình monorepo tinh gọn, phân tách triệt để giữa ứng dụng Frontend (`apps/web`), Backend (`apps/api`), hạ tầng (`infra`), tài liệu (`docs`) và cấu hình root.

---

## 1. Cấu trúc tổng thể Monorepo

```text
trendmotion-studio/
├── apps/
│   ├── web/                    # Ứng dụng Frontend (React + Vite + TypeScript)
│   └── api/                    # Ứng dụng Backend (FastAPI + SQLAlchemy + Celery)
├── infra/
│   ├── docker/                 # Cấu hình container đặc thù (nếu có)
│   └── scripts/                # Script hỗ trợ môi trường hạ tầng dev/staging
├── docs/
│   ├── architecture/           # Tài liệu kiến trúc hệ thống và ranh giới module
│   ├── design/                 # Định hướng thiết kế UX/UI & tài liệu tham khảo
│   └── development/            # Hướng dẫn cài đặt, quy ước mã nguồn
├── scripts/                    # Scripts tiện ích cấp repository
├── .github/
│   └── workflows/              # GitHub Actions CI/CD pipelines
├── .env.example                # Bản mẫu biến môi trường chuẩn hóa (không chứa secret)
├── .gitignore                  # Khai báo file/thư mục loại trừ khỏi Git
├── .editorconfig               # Quy chuẩn định dạng file đa nền tảng
├── .prettierrc.json            # Quy chuẩn code formatting (JS/TS/JSON/MD)
├── .prettierignore             # Danh sách loại trừ formatting
├── pnpm-workspace.yaml         # Khai báo pnpm workspace
├── package.json                # Root package quản lý lệnh điều phối monorepo
├── docker-compose.yml          # Dịch vụ hạ tầng cục bộ (PostgreSQL 16, Redis 7)
└── README.md                   # Giới thiệu và hướng dẫn tổng thể dự án
```

---

## 2. Chi tiết Ứng dụng Frontend (`apps/web`)

```text
apps/web/
├── public/                     # Tài nguyên tĩnh thuần túy (favicon, robots.txt)
├── src/
│   ├── app/
│   │   ├── providers/          # React Context Providers cấp ứng dụng (Auth, Query, Theme)
│   │   ├── router/             # Cấu hình định tuyến React Router
│   │   └── config/             # Cấu hình môi trường type-safe (env.ts)
│   ├── assets/
│   │   ├── fonts/              # Phông chữ cục bộ
│   │   ├── images/             # Hình ảnh tĩnh cố định trong source code
│   │   ├── icons/              # Biểu tượng tĩnh (SVG nội bộ)
│   │   └── media/              # Video/audio tĩnh mẫu phục vụ giao diện
│   ├── components/
│   │   ├── ui/                 # UI components nguyên tử dùng chung (Button, Input, Dialog,...)
│   │   ├── layout/             # Khung bố cục (Sidebar, Topbar, AppShell - dựng ở giai đoạn sau)
│   │   └── feedback/           # Trạng thái phản hồi (Toast, EmptyState, Loading, ErrorState)
│   ├── features/               # Các module chức năng độc lập (screaming architecture)
│   │   ├── overview/           # Module tổng quan hiệu suất & hoạt động studio
│   │   ├── product-research/   # Module tra cứu & lọc sản phẩm thời trang
│   │   ├── channel-analysis/   # Module phân tích kênh sáng tạo TikTok
│   │   ├── studio/             # Module không gian làm việc AI Fashion Studio
│   │   ├── models/             # Module quản lý hồ sơ người mẫu thời trang (User-provided reference photos)
│   │   │   ├── components/     # UI components nội bộ (Card, Grid, Uploader, Dialogs, Stepper, Lightbox)
│   │   │   ├── constants/      # Hằng số upload limits, file types, nhãn trạng thái DRAFT/READY/ARCHIVED
│   │   │   ├── fixtures/       # Mock data chuẩn cho môi trường local/dev
│   │   │   ├── hooks/          # React hooks quản lý danh sách, chi tiết, upload queue, wizard state
│   │   │   ├── pages/          # Trang màn hình: Library, Setup Wizard (3 bước), Detail, Edit
│   │   │   ├── schemas/        # Zod validation schemas cho form tạo & sửa
│   │   │   ├── services/       # Service giao tiếp API Backend & Local Filesystem Storage
│   │   │   ├── types/          # TypeScript interfaces: ModelProfile, ModelAsset, Wizard, Lifecycle
│   │   │   └── utils/          # Helpers kiểm tra ảnh hợp lệ, format dung lượng, tính tiến độ
│   │   ├── video-templates/    # Module thư viện video mẫu thời trang (Video Template Library - Local Filesystem)
│   │   │   ├── components/     # UI components: TemplateCard, Grid, Player, SceneTimeline, Filters, Compatibility
│   │   │   ├── constants/      # Hằng số danh mục, loại chuyển động, tỷ lệ khung hình, khoảng thời lượng
│   │   │   ├── fixtures/       # Mock/dev catalog data chuẩn bị cho môi trường dev & test
│   │   │   ├── hooks/          # React hooks: useTemplates, useTemplateDetail, useTemplateFavorite
│   │   │   ├── pages/          # Trang màn hình: VideoTemplateLibraryPage, VideoTemplateDetailPage
│   │   │   ├── services/       # Service giao tiếp API Backend & local media streaming
│   │   │   ├── types/          # TypeScript interfaces: VideoTemplate, TemplateScene, GarmentSlot, Compatibility
│   │   │   └── utils/          # Helpers định dạng thời lượng (mm:ss), tỷ lệ khung hình, badge trạng thái
│   │   ├── library/            # Module kho tài nguyên & thành phẩm
│   │   ├── credit-wallet/      # Module ví tín dụng & nạp credit
│   │   └── settings/           # Module thiết lập người dùng & hệ thống
│   ├── hooks/                  # Custom React Hooks dùng chung toàn ứng dụng
│   ├── lib/                    # Cấu hình thư viện bên ngoài (utils, twMerge helpers)
│   ├── services/
│   │   └── api/                # HTTP client wrapper và base communication
│   ├── styles/                 # Tailwind CSS directives và global styles
│   ├── types/                  # Kiểu dữ liệu TypeScript dùng chung cấp ứng dụng
│   ├── utils/                  # Hàm tiện ích thuần túy (pure utility functions)
│   ├── constants/              # Hằng số cấu hình toàn cục
│   ├── App.tsx                 # Root React Component tối thiểu
│   ├── main.tsx                # Điểm khởi động ứng dụng React (mount root DOM)
│   └── vite-env.d.ts           # Khai báo kiểu dữ liệu môi trường cho Vite
├── index.html                  # HTML entrypoint
├── package.json                # Dependencies và scripts của Frontend
├── tsconfig.json               # TypeScript project references root
├── tsconfig.app.json           # Cấu hình TypeScript cho mã nguồn ứng dụng
├── tsconfig.node.json          # Cấu hình TypeScript cho cấu hình build tool (Vite)
├── vite.config.ts              # Cấu hình bundler Vite
├── tailwind.config.js          # Cấu hình Tailwind CSS
├── postcss.config.js           # Cấu hình PostCSS
└── eslint.config.js            # Cấu hình kiểm tra cú pháp ESLint v9 flat config
```

---

## 3. Chi tiết Ứng dụng Backend (`apps/api`)

```text
apps/api/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/      # HTTP handlers phân chia theo tài nguyên (/health,...)
│   │       ├── router.py       # Gom cụm các router con của v1
│   │       └── __init__.py
│   ├── core/                   # Cấu hình settings, security, logging nền tảng
│   ├── db/                     # Quản lý SQLAlchemy engine, sessionmaker và Base
│   ├── models/                 # SQLAlchemy ORM models (sẽ dựng ở giai đoạn database)
│   ├── schemas/                # Pydantic models xác thực request/response
│   ├── repositories/           # Lớp truy xuất dữ liệu trừu tượng (Data Access Layer)
│   ├── services/               # Lớp xử lý nghiệp vụ chính (Business Logic)
│   ├── integrations/           # Provider Adapters giao tiếp dịch vụ ngoài:
│   │   ├── tiktok/             # TikTok Display API adapter
│   │   ├── tiktok_shop/        # TikTok Shop Affiliate API adapter
│   │   ├── image_generation/   # Image Generation AI provider adapter
│   │   ├── video_generation/   # Video Generation AI provider adapter
│   │   ├── storage/            # Cloudflare R2 / S3 storage adapter
│   │   └── payments/           # Payment gateway adapter
│   ├── workers/                # Cấu hình Celery application và tác vụ nền
│   ├── middleware/             # Custom FastAPI middlewares (CORS, Auth, Logs)
│   ├── utils/                  # Utility functions thuần túy
│   ├── __init__.py             # Định nghĩa version gói ứng dụng
│   └── main.py                 # Điểm khởi tạo FastAPI Application
├── migrations/                 # Alembic migration engine
│   ├── versions/               # Lưu các tệp migration qua từng phiên bản
│   ├── env.py                  # Script kết nối schema DB với Alembic
│   └── script.py.mako          # Mẫu sinh tệp migration tự động
├── tests/                      # Bộ kiểm thử tự động
│   ├── unit/                   # Kiểm thử đơn vị
│   ├── integration/            # Kiểm thử tích hợp luồng
│   └── contract/               # Kiểm thử hợp đồng API
├── pyproject.toml              # Quản lý dependencies, package metadata và tool configs
├── alembic.ini                 # Cấu hình kết nối công cụ Alembic
└── README.md                   # Hướng dẫn phát triển Backend độc lập
```
