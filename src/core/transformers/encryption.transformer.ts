import { ValueTransformer } from 'typeorm';
import { EncryptionService } from '../services/encryption';

let encryptionService: EncryptionService;

export function setEncryptionService(service: EncryptionService): void {
  encryptionService = service;
}

export class EncryptionTransformer implements ValueTransformer {
  to(value: string | null | undefined): string | null {
    if (!value) return null;

    if (!encryptionService) {
      console.error(
        'EncryptionService not initialized. Storing password in plain text.',
      );
      return value;
    }

    try {
      return encryptionService.encrypt(value);
    } catch (error) {
      console.error('Failed to encrypt value:', error);
      throw error;
    }
  }

  from(value: string | null | undefined): string | null {
    if (!value) return null;

    if (!encryptionService) {
      console.error(
        'EncryptionService not initialized. Returning encrypted value.',
      );
      return value;
    }

    try {
      return encryptionService.decrypt(value);
    } catch (error) {
      console.error('Failed to decrypt value:', error);
      throw error;
    }
  }
}
