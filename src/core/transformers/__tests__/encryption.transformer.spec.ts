import {
  EncryptionTransformer,
  setEncryptionService,
} from '../encryption.transformer';
import { EncryptionService } from '../../services/encryption';

describe('EncryptionTransformer', () => {
  let transformer: EncryptionTransformer;
  let mockEncryptionService: jest.Mocked<EncryptionService>;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    transformer = new EncryptionTransformer();
    mockEncryptionService = {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    } as any;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    setEncryptionService(null as any);
  });

  describe('setEncryptionService', () => {
    it('should set the encryption service', () => {
      setEncryptionService(mockEncryptionService);

      mockEncryptionService.encrypt.mockReturnValue('encrypted');
      const result = transformer.to('test');

      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('test');
      expect(result).toBe('encrypted');
    });
  });

  describe('to (encryption)', () => {
    it('should return null for null value', () => {
      const result = transformer.to(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined value', () => {
      const result = transformer.to(undefined);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = transformer.to('');
      expect(result).toBeNull();
    });

    it('should encrypt value when encryption service is available', () => {
      setEncryptionService(mockEncryptionService);
      mockEncryptionService.encrypt.mockReturnValue('encrypted_value');

      const result = transformer.to('plain_text');

      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('plain_text');
      expect(result).toBe('encrypted_value');
    });

    it('should return plain text and log error when encryption service is not initialized', () => {
      const result = transformer.to('plain_text');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'EncryptionService not initialized. Storing password in plain text.',
      );
      expect(result).toBe('plain_text');
    });

    it('should throw error when encryption fails', () => {
      setEncryptionService(mockEncryptionService);
      const error = new Error('Encryption failed');
      mockEncryptionService.encrypt.mockImplementation(() => {
        throw error;
      });

      expect(() => transformer.to('plain_text')).toThrow(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to encrypt value:',
        error,
      );
    });

    it('should handle special characters in value', () => {
      setEncryptionService(mockEncryptionService);
      mockEncryptionService.encrypt.mockReturnValue('encrypted_special');

      const result = transformer.to('!@#$%^&*()_+');

      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(
        '!@#$%^&*()_+',
      );
      expect(result).toBe('encrypted_special');
    });
  });

  describe('from (decryption)', () => {
    it('should return null for null value', () => {
      const result = transformer.from(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined value', () => {
      const result = transformer.from(undefined);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = transformer.from('');
      expect(result).toBeNull();
    });

    it('should decrypt value when encryption service is available', () => {
      setEncryptionService(mockEncryptionService);
      mockEncryptionService.decrypt.mockReturnValue('decrypted_value');

      const result = transformer.from('encrypted_text');

      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith(
        'encrypted_text',
      );
      expect(result).toBe('decrypted_value');
    });

    it('should return encrypted value and log error when encryption service is not initialized', () => {
      const result = transformer.from('encrypted_text');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'EncryptionService not initialized. Returning encrypted value.',
      );
      expect(result).toBe('encrypted_text');
    });

    it('should throw error when decryption fails', () => {
      setEncryptionService(mockEncryptionService);
      const error = new Error('Decryption failed');
      mockEncryptionService.decrypt.mockImplementation(() => {
        throw error;
      });

      expect(() => transformer.from('encrypted_text')).toThrow(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to decrypt value:',
        error,
      );
    });

    it('should handle base64 encoded values', () => {
      setEncryptionService(mockEncryptionService);
      mockEncryptionService.decrypt.mockReturnValue('decrypted_base64');

      const result = transformer.from('SGVsbG8gV29ybGQ=');

      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith(
        'SGVsbG8gV29ybGQ=',
      );
      expect(result).toBe('decrypted_base64');
    });
  });

  describe('round trip encryption/decryption', () => {
    it('should handle round trip for normal values', () => {
      setEncryptionService(mockEncryptionService);
      mockEncryptionService.encrypt.mockReturnValue('encrypted');
      mockEncryptionService.decrypt.mockReturnValue('original');

      const encrypted = transformer.to('original');
      const decrypted = transformer.from(encrypted);

      expect(encrypted).toBe('encrypted');
      expect(decrypted).toBe('original');
    });

    it('should handle multiple transformers with same service', () => {
      const transformer2 = new EncryptionTransformer();
      setEncryptionService(mockEncryptionService);

      mockEncryptionService.encrypt.mockReturnValue('encrypted1');
      mockEncryptionService.decrypt.mockReturnValue('decrypted1');

      const result1 = transformer.to('test1');
      const result2 = transformer2.from('encrypted1');

      expect(result1).toBe('encrypted1');
      expect(result2).toBe('decrypted1');
    });
  });
});
