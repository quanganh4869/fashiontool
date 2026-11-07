import { describe, it, expect } from 'vitest';
import {
  formatRelativeTime,
  formatCurrency,
  formatDuration,
  formatJobType,
  formatJobStatus,
  formatProjectStep,
  formatProjectStatus,
} from './formatters';

describe('formatRelativeTime', () => {
  it('formats invalid or null date as dash', () => {
    expect(formatRelativeTime(null)).toBe('—');
    expect(formatRelativeTime(undefined)).toBe('—');
    expect(formatRelativeTime('invalid-date')).toBe('—');
  });

  it('formats today date with prefix "Hôm nay, "', () => {
    const today = new Date();
    const result = formatRelativeTime(today);
    expect(result).toMatch(/^Hôm nay, \d{2}:\d{2}$/);
  });

  it('formats yesterday date with prefix "Hôm qua, "', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = formatRelativeTime(yesterday);
    expect(result).toMatch(/^Hôm qua, \d{2}:\d{2}$/);
  });

  it('formats older date as DD/MM/YYYY', () => {
    const older = new Date(2026, 9, 15, 10, 0); // Oct 15, 2026
    const result = formatRelativeTime(older);
    expect(result).toBe('15/10/2026');
  });
});

describe('formatCurrency', () => {
  it('handles null and undefined with explicit message', () => {
    expect(formatCurrency(null)).toBe('Chưa có thông tin giá');
    expect(formatCurrency(undefined)).toBe('Chưa có thông tin giá');
  });

  it('handles 0 correctly', () => {
    expect(formatCurrency(0)).toBe('0 ₫');
  });

  it('formats VND currency with thousand separators', () => {
    const result = formatCurrency(289000);
    expect(result).toContain('289');
    expect(result).toContain('₫');
  });
});

describe('formatDuration', () => {
  it('returns null for null, undefined, or NaN', () => {
    expect(formatDuration(null)).toBeNull();
    expect(formatDuration(undefined)).toBeNull();
    expect(formatDuration(NaN)).toBeNull();
  });

  it('formats seconds to MM:SS', () => {
    expect(formatDuration(28)).toBe('00:28');
    expect(formatDuration(75)).toBe('01:15');
    expect(formatDuration(3600)).toBe('60:00');
  });
});

describe('Overview Vietnamese Labels Mapping', () => {
  it('maps job types to Vietnamese', () => {
    expect(formatJobType('video_generation')).toBe('Đang tạo video');
    expect(formatJobType('image_generation')).toBe('Đang tạo ảnh');
    expect(formatJobType('channel_analysis')).toBe('Đang phân tích kênh');
  });

  it('maps job statuses to Vietnamese', () => {
    expect(formatJobStatus('pending')).toBe('Đang chờ');
    expect(formatJobStatus('processing')).toBe('Đang xử lý');
    expect(formatJobStatus('verifying')).toBe('Đang kiểm tra kết quả');
    expect(formatJobStatus('finishing')).toBe('Đang hoàn tất');
  });

  it('maps project steps to Vietnamese', () => {
    expect(formatProjectStep('initial')).toBe('Chưa bắt đầu');
    expect(formatProjectStep('product')).toBe('Sản phẩm');
    expect(formatProjectStep('model')).toBe('Chọn mẫu');
    expect(formatProjectStep('image')).toBe('Ảnh');
    expect(formatProjectStep('video')).toBe('Video');
  });

  it('maps project statuses with appropriate styles', () => {
    expect(formatProjectStatus('draft').label).toBe('Bản nháp');
    expect(formatProjectStatus('in_progress').label).toBe('Đang thực hiện');
    expect(formatProjectStatus('completed').label).toBe('Hoàn thành');
    expect(formatProjectStatus('error').label).toBe('Có lỗi');
  });
});
