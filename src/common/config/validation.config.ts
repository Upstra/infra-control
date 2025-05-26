import { CustomValidationPipe } from '@/core/pipes/custom-valiation.pipe';

export function setupValidationPipe(): CustomValidationPipe {
  return new CustomValidationPipe();
}
