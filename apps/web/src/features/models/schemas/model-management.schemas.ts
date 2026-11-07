import { MODEL_VALIDATION_MESSAGES } from '../constants/model-management.constants';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateModelName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: MODEL_VALIDATION_MESSAGES.NAME_REQUIRED };
  }
  if (trimmed.length < 2 || trimmed.length > 60) {
    return { isValid: false, error: MODEL_VALIDATION_MESSAGES.NAME_LENGTH };
  }
  return { isValid: true };
}

export function validateModelDescription(description?: string | null): ValidationResult {
  if (!description) return { isValid: true };
  if (description.length > 500) {
    return { isValid: false, error: MODEL_VALIDATION_MESSAGES.DESCRIPTION_LENGTH };
  }
  return { isValid: true };
}
