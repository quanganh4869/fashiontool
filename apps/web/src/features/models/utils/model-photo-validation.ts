import {
  MODEL_UPLOAD_CONFIG,
  MODEL_VALIDATION_MESSAGES,
} from '../constants/model-management.constants';

export interface PhotoFileValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export function validateModelPhotoFile(
  file: File,
  currentCount: number,
  pendingCount = 0
): PhotoFileValidationResult {
  // Check quota
  if (currentCount + pendingCount >= MODEL_UPLOAD_CONFIG.MAX_PHOTOS_PER_MODEL) {
    return {
      isValid: false,
      error: MODEL_VALIDATION_MESSAGES.MAX_PHOTOS_EXCEEDED,
    };
  }

  // Check MIME type
  const isAllowedMime = (MODEL_UPLOAD_CONFIG.ALLOWED_MIME_TYPES as readonly string[]).includes(
    file.type.toLowerCase()
  );

  // Check file extension as secondary guard
  const hasAllowedExt = (MODEL_UPLOAD_CONFIG.ALLOWED_EXTENSIONS as readonly string[]).some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );

  if (!isAllowedMime && !hasAllowedExt) {
    return {
      isValid: false,
      error: MODEL_VALIDATION_MESSAGES.UNSUPPORTED_FORMAT,
    };
  }

  // Check size limit (20MB)
  if (file.size > MODEL_UPLOAD_CONFIG.MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: MODEL_VALIDATION_MESSAGES.FILE_TOO_LARGE,
    };
  }

  return { isValid: true };
}
