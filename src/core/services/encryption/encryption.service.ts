import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { EncryptionServiceInterface } from './encryption.interface';

@Injectable()
export class EncryptionService implements EncryptionServiceInterface {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!secretKey) {
      throw new InternalServerErrorException(
        'ENCRYPTION_KEY must be defined in environment variables',
      );
    }

    this.key = crypto.scryptSync(secretKey, 'salt', 32);
  }

  encrypt(plainText: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      let encrypted = cipher.update(plainText, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      const combined = Buffer.concat([
        iv,
        authTag,
        Buffer.from(encrypted, 'hex'),
      ]);

      return combined.toString('base64');
    } catch (error) {
      this.logger.error('Encryption failed:', error);
      throw new InternalServerErrorException('Failed to encrypt data');
    }
  }

  decrypt(encryptedText: string): string {
    try {
      const combined = Buffer.from(encryptedText, 'base64');

      const iv = combined.subarray(0, 16);
      const authTag = combined.subarray(16, 32);
      const encrypted = combined.subarray(32);

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed:', error);
      throw new InternalServerErrorException('Failed to decrypt data');
    }
  }
}
