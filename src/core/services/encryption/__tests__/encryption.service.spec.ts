import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let configService: jest.Mocked<ConfigService>;

  const mockEncryptionKey = 'test-encryption-key-32-characters-long';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(mockEncryptionKey),
          },
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should throw error if ENCRYPTION_KEY is not defined', () => {
      configService.get.mockReturnValue(undefined);
      
      expect(() => new EncryptionService(configService)).toThrow(
        'ENCRYPTION_KEY must be defined in environment variables',
      );
    });
  });

  describe('encrypt', () => {
    it('should encrypt plain text successfully', () => {
      const plainText = 'mySecretPassword123';
      
      const encrypted = service.encrypt(plainText);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plainText);
      expect(encrypted.length).toBeGreaterThan(0);
      // Should be base64 encoded
      expect(() => Buffer.from(encrypted, 'base64')).not.toThrow();
    });

    it('should generate different encrypted values for same input', () => {
      const plainText = 'mySecretPassword123';
      
      const encrypted1 = service.encrypt(plainText);
      const encrypted2 = service.encrypt(plainText);
      
      // Due to random IV, encrypted values should be different
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle empty string', () => {
      const encrypted = service.encrypt('');
      
      expect(encrypted).toBeDefined();
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should handle special characters', () => {
      const plainText = '!@#$%^&*()_+-=[]{}|;\':",./<>?`~';
      
      const encrypted = service.encrypt(plainText);
      
      expect(encrypted).toBeDefined();
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should handle unicode characters', () => {
      const plainText = '🔒 Sécurité 密码 パスワード';
      
      const encrypted = service.encrypt(plainText);
      
      expect(encrypted).toBeDefined();
      expect(encrypted.length).toBeGreaterThan(0);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted text back to original', () => {
      const plainText = 'mySecretPassword123';
      
      const encrypted = service.encrypt(plainText);
      const decrypted = service.decrypt(encrypted);
      
      expect(decrypted).toBe(plainText);
    });

    it('should handle empty string encryption/decryption', () => {
      const plainText = '';
      
      const encrypted = service.encrypt(plainText);
      const decrypted = service.decrypt(encrypted);
      
      expect(decrypted).toBe(plainText);
    });

    it('should handle special characters encryption/decryption', () => {
      const plainText = '!@#$%^&*()_+-=[]{}|;\':",./<>?`~';
      
      const encrypted = service.encrypt(plainText);
      const decrypted = service.decrypt(encrypted);
      
      expect(decrypted).toBe(plainText);
    });

    it('should handle unicode characters encryption/decryption', () => {
      const plainText = '🔒 Sécurité 密码 パスワード';
      
      const encrypted = service.encrypt(plainText);
      const decrypted = service.decrypt(encrypted);
      
      expect(decrypted).toBe(plainText);
    });

    it('should throw error for invalid encrypted text', () => {
      const invalidEncrypted = 'invalid-base64-string!@#';
      
      expect(() => service.decrypt(invalidEncrypted)).toThrow(
        'Failed to decrypt data',
      );
    });

    it('should throw error for corrupted encrypted text', () => {
      const plainText = 'test';
      const encrypted = service.encrypt(plainText);
      // Corrupt the encrypted data
      const corrupted = encrypted.slice(0, -10) + 'corrupted';
      
      expect(() => service.decrypt(corrupted)).toThrow(
        'Failed to decrypt data',
      );
    });

    it('should throw error for empty encrypted text', () => {
      expect(() => service.decrypt('')).toThrow(
        'Failed to decrypt data',
      );
    });
  });

  describe('encrypt/decrypt cycle', () => {
    it('should handle multiple encrypt/decrypt cycles', () => {
      const plainText = 'testPassword123';
      
      for (let i = 0; i < 10; i++) {
        const encrypted = service.encrypt(plainText);
        const decrypted = service.decrypt(encrypted);
        expect(decrypted).toBe(plainText);
      }
    });

    it('should handle large text', () => {
      const plainText = 'a'.repeat(10000);
      
      const encrypted = service.encrypt(plainText);
      const decrypted = service.decrypt(encrypted);
      
      expect(decrypted).toBe(plainText);
    });
  });
});