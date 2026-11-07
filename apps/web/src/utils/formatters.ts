import {
  JobType,
  JobStatus,
  ProjectStep,
  ProjectStatus,
} from '@/types/overview';

/**
 * Format timestamp into friendly Vietnamese representation:
 * - Today: 'Hôm nay, HH:mm'
 * - Yesterday: 'Hôm qua, HH:mm'
 * - Older: 'DD/MM/YYYY'
 */
export function formatRelativeTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '—';

  const now = new Date();

  // Reset to start of day in local timezone for clean date difference
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = nowDay.getTime() - dateDay.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  if (diffDays === 0) {
    return `Hôm nay, ${timeStr}`;
  }
  if (diffDays === 1) {
    return `Hôm qua, ${timeStr}`;
  }

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Format currency with strict differentiation between missing and 0:
 * - null or undefined -> 'Chưa có thông tin giá'
 * - 0 -> '0 ₫'
 * - 249000 -> '249.000 ₫'
 */
export function formatCurrency(
  price: number | null | undefined,
  currency = 'VND'
): string {
  if (price === null || price === undefined) {
    return 'Chưa có thông tin giá';
  }

  if (price === 0) {
    return currency === 'VND' ? '0 ₫' : `0 ${currency}`;
  }

  if (currency === 'VND') {
    return `${new Intl.NumberFormat('vi-VN').format(price)} ₫`;
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
  }).format(price);
}

/**
 * Format video duration in seconds to MM:SS
 */
export function formatDuration(seconds: number | null | undefined): string | null {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return null;
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatJobType(jobType: JobType): string {
  switch (jobType) {
    case 'video_generation':
      return 'Đang tạo video';
    case 'image_generation':
      return 'Đang tạo ảnh';
    case 'channel_analysis':
      return 'Đang phân tích kênh';
    default:
      return jobType;
  }
}

export function formatJobStatus(status: JobStatus): string {
  switch (status) {
    case 'pending':
      return 'Đang chờ';
    case 'processing':
      return 'Đang xử lý';
    case 'verifying':
      return 'Đang kiểm tra kết quả';
    case 'finishing':
      return 'Đang hoàn tất';
    default:
      return status;
  }
}

export function formatProjectStep(step: ProjectStep): string {
  switch (step) {
    case 'product':
      return 'Sản phẩm';
    case 'model':
      return 'Chọn mẫu';
    case 'image':
      return 'Ảnh';
    case 'video':
      return 'Video';
    case 'initial':
    default:
      return 'Chưa bắt đầu';
  }
}

export function formatProjectStatus(status: ProjectStatus): {
  label: string;
  textColor: string;
} {
  switch (status) {
    case 'draft':
      return { label: 'Bản nháp', textColor: 'text-[#74716D]' };
    case 'in_progress':
      return { label: 'Đang thực hiện', textColor: 'text-[#9A6B26]' };
    case 'completed':
      return { label: 'Hoàn thành', textColor: 'text-[#367458]' };
    case 'error':
      return { label: 'Có lỗi', textColor: 'text-[#A94442]' };
    default:
      return { label: status, textColor: 'text-[#74716D]' };
  }
}
