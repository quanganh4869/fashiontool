export const MODEL_UPLOAD_CONFIG = {
  MAX_FILE_SIZE_BYTES: 20 * 1024 * 1024, // 20MB
  MAX_PHOTOS_PER_MODEL: 20,
  MIN_RECOMMENDED_DIMENSION_PX: 512,
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'] as const,
  ACCEPTED_INPUT_STRING: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
} as const;

export const MODEL_VALIDATION_MESSAGES = {
  UNSUPPORTED_FORMAT: 'Định dạng ảnh không được hỗ trợ. Hãy sử dụng JPG, PNG hoặc WebP.',
  FILE_TOO_LARGE: 'Ảnh vượt quá dung lượng cho phép. Mỗi ảnh tối đa 20MB.',
  MAX_PHOTOS_EXCEEDED: 'Hồ sơ đã đạt số lượng ảnh tối đa (tối đa 20 ảnh).',
  NAME_REQUIRED: 'Vui lòng nhập tên người mẫu.',
  NAME_LENGTH: 'Tên người mẫu phải từ 2 đến 60 ký tự.',
  DESCRIPTION_LENGTH: 'Mô tả không được vượt quá 500 ký tự.',
  AT_LEAST_ONE_PHOTO: 'Vui lòng tải lên ít nhất một ảnh người mẫu.',
  UPLOADS_IN_PROGRESS: 'Vui lòng chờ ảnh tải lên hoàn tất trước khi tiếp tục.',
  SAME_MODEL_CONFIRM_REQUIRED: 'Vui lòng xác nhận tất cả ảnh trong hồ sơ thuộc cùng một người mẫu.',
  USAGE_RIGHTS_CONFIRM_REQUIRED: 'Vui lòng xác nhận bạn có quyền sử dụng những hình ảnh này.',
} as const;

export const MODEL_STATUS_MAP = {
  READY: {
    label: 'Sẵn sàng',
    textColor: 'text-[#367458]',
    dotColor: 'bg-[#367458]',
    badgeBg: 'bg-[#EBF5F0]',
  },
  DRAFT: {
    label: 'Bản nháp',
    textColor: 'text-[#74716D]',
    dotColor: 'bg-[#74716D]',
    badgeBg: 'bg-[#F2EDF5]',
  },
  ARCHIVED: {
    label: 'Đã lưu trữ',
    textColor: 'text-[#9A6B26]',
    dotColor: 'bg-[#9A6B26]',
    badgeBg: 'bg-[#FDF6EB]',
  },
} as const;
