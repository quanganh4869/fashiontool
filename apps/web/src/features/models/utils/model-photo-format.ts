import { ModelStatus } from '../types/model-management.types';
import { MODEL_STATUS_MAP } from '../constants/model-management.constants';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatModelStatus(status: ModelStatus) {
  return MODEL_STATUS_MAP[status] || {
    label: status,
    textColor: 'text-[#74716D]',
    dotColor: 'bg-[#74716D]',
    badgeBg: 'bg-[#F6F5F2]',
  };
}
