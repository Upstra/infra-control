import { Test, TestingModule } from '@nestjs/testing';
import { RecoveryCodeService } from '../recovery-code.domain.service';
import * as crypto from 'crypto';

const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn(),
};

const mockRandomInt = jest.fn();

describe('RecoveryCodeService', () => {
  let service: RecoveryCodeService;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.resetModules();

    jest.doMock('bcryptjs', () => mockBcrypt);

    jest.spyOn(crypto, 'randomInt').mockImplementation(mockRandomInt);

    const module: TestingModule = await Test.createTestingModule({
      providers: [RecoveryCodeService],
    }).compile();

    service = module.get<RecoveryCodeService>(RecoveryCodeService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generate()', () => {
    it('should generate exactly 10 codes', () => {
      mockRandomInt.mockReturnValue(0);

      const codes = service.generate();

      expect(codes).toHaveLength(10);
    });

    it('should generate codes with correct format (XXXX-XXXX)', () => {
      mockRandomInt.mockReturnValue(0);

      const codes = service.generate();

      codes.forEach((code) => {
        expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
        expect(code).toHaveLength(9);
      });
    });

    it('should only use allowed characters', () => {
      const allowedChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789';

      let callCount = 0;
      mockRandomInt.mockImplementation((max: number) => {
        return callCount++ % max;
      });

      const codes = service.generate();
      const allCharsUsed = codes.join('').replace(/-/g, '');

      for (const char of allCharsUsed) {
        expect(allowedChars).toContain(char);
      }
    });

    it('should call randomInt with correct parameter (characters length)', () => {
      const expectedLength = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789'.length; // 34
      mockRandomInt.mockReturnValue(0);

      service.generate();

      expect(mockRandomInt).toHaveBeenCalledWith(expectedLength);
      expect(mockRandomInt).toHaveBeenCalledTimes(80);
    });

    it('should generate different patterns with different random values', () => {
      mockRandomInt.mockReturnValueOnce(0);
      mockRandomInt.mockReturnValue(1);

      const codes = service.generate();
      const firstCode = codes[0];

      expect(firstCode.charAt(0)).toBe('A');
      expect(firstCode.charAt(1)).toBe('B');
    });

    it('should handle edge case where match returns null', () => {
      const originalMatch = String.prototype.match;
      String.prototype.match = jest.fn().mockReturnValue(null);

      mockRandomInt.mockReturnValue(0);

      try {
        const codes = service.generate();

        codes.forEach((code) => {
          expect(code).toHaveLength(8);
        });
      } finally {
        String.prototype.match = originalMatch;
      }
    });

    it('should generate codes with varied random indices', () => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789';

      const mockValues = [0, 5, 10, 15, 20, 25, 30, 33];
      let callIndex = 0;
      mockRandomInt.mockImplementation(
        () => mockValues[callIndex++ % mockValues.length],
      );

      const codes = service.generate();
      const firstCode = codes[0].replace('-', '');

      const expectedChars = mockValues.map((index) => characters[index]);
      expect(firstCode.charAt(0)).toBe(expectedChars[0]);
      expect(firstCode.charAt(1)).toBe(expectedChars[1]);
    });
  });

  describe('hash()', () => {
    beforeEach(() => {
      mockBcrypt.hash.mockImplementation((code: string, rounds: number) =>
        Promise.resolve(`hashed_${code}_rounds_${rounds}`),
      );
    });

    it('should hash all codes with bcrypt', async () => {
      const codes = ['ABCD-EFGH', 'IJKL-MNOP'];

      const result = await service.hash(codes);

      expect(mockBcrypt.hash).toHaveBeenCalledTimes(2);
      expect(mockBcrypt.hash).toHaveBeenCalledWith('ABCD-EFGH', 10);
      expect(mockBcrypt.hash).toHaveBeenCalledWith('IJKL-MNOP', 10);
      expect(result).toEqual([
        'hashed_ABCD-EFGH_rounds_10',
        'hashed_IJKL-MNOP_rounds_10',
      ]);
    });

    it('should handle empty array', async () => {
      const result = await service.hash([]);

      expect(mockBcrypt.hash).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle single code', async () => {
      const codes = ['ABCD-EFGH'];

      const result = await service.hash(codes);

      expect(mockBcrypt.hash).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
    });

    it('should use salt rounds 10', async () => {
      const codes = ['TEST-CODE'];

      await service.hash(codes);

      expect(mockBcrypt.hash).toHaveBeenCalledWith('TEST-CODE', 10);
    });

    it('should handle bcrypt errors gracefully', async () => {
      const codes = ['ABCD-EFGH'];
      mockBcrypt.hash.mockRejectedValue(new Error('Bcrypt failed'));

      await expect(service.hash(codes)).rejects.toThrow('Bcrypt failed');
    });

    it('should handle special characters in codes', async () => {
      const codes = ['ABCD-EFGH', 'TEST@CODE', '1234-5678'];

      await service.hash(codes);

      expect(mockBcrypt.hash).toHaveBeenCalledWith('ABCD-EFGH', 10);
      expect(mockBcrypt.hash).toHaveBeenCalledWith('TEST@CODE', 10);
      expect(mockBcrypt.hash).toHaveBeenCalledWith('1234-5678', 10);
    });
  });

  describe('compare()', () => {
    beforeEach(() => {
      mockBcrypt.compare.mockImplementation((code: string, hash: string) => {
        return Promise.resolve(hash.includes(code));
      });
    });

    it('should return true when code matches one of the hashed codes', async () => {
      const code = 'ABCD-EFGH';
      const hashedCodes = [
        'hash_of_other_code',
        'hash_of_ABCD-EFGH_match',
        'hash_of_another_code',
      ];

      mockBcrypt.compare
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const result = await service.compare(code, hashedCodes);

      expect(result).toBe(true);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        code,
        'hash_of_other_code',
      );
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        code,
        'hash_of_ABCD-EFGH_match',
      );
    });

    it('should return false when code does not match any hashed codes', async () => {
      const code = 'WRONG-CODE';
      const hashedCodes = ['hash_of_code1', 'hash_of_code2', 'hash_of_code3'];

      mockBcrypt.compare.mockResolvedValue(false);

      const result = await service.compare(code, hashedCodes);
      expect(result).toBe(false);
    });

    it('should handle empty hashed codes array', async () => {
      const code = 'ABCD-EFGH';
      const hashedCodes: string[] = [];

      const result = await service.compare(code, hashedCodes);
      expect(result).toBe(false);
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should call bcrypt.compare for each hashed code until match found', async () => {
      const code = 'ABCD-EFGH';
      const hashedCodes = [
        'hash_of_wrong_code',
        'hash_of_ABCD-EFGH_correct',
        'hash_of_another_code',
      ];

      mockBcrypt.compare
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const result = await service.compare(code, hashedCodes);

      expect(result).toBe(true);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        code,
        'hash_of_wrong_code',
      );
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        code,
        'hash_of_ABCD-EFGH_correct',
      );
    });

    it('should handle bcrypt.compare throwing errors', async () => {
      const code = 'ABCD-EFGH';
      const hashedCodes = ['hash1', 'hash2'];

      mockBcrypt.compare.mockRejectedValue(new Error('Compare failed'));

      await expect(service.compare(code, hashedCodes)).rejects.toThrow();
    });

    it('should work with single hashed code that matches', async () => {
      const code = 'ABCD-EFGH';
      const hashedCodes = ['hash_of_ABCD-EFGH_match'];

      mockBcrypt.compare.mockResolvedValue(true);

      const result = await service.compare(code, hashedCodes);

      expect(result).toBe(true);
      expect(mockBcrypt.compare).toHaveBeenCalledTimes(1);
    });

    it('should work with single hashed code that does not match', async () => {
      const code = 'ABCD-EFGH';
      const hashedCodes = ['hash_of_wrong_code'];

      mockBcrypt.compare.mockResolvedValue(false);

      const result = await service.compare(code, hashedCodes);
      expect(result).toBe(false);
    });

    it('should work correctly with compare - finds match in middle', async () => {
      const code = 'TEST-CODE';
      const hashedCodes = [
        'wrong_hash_1',
        'correct_hash_TEST-CODE',
        'wrong_hash_2',
      ];

      mockBcrypt.compare
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result = await service.compare(code, hashedCodes);

      expect(result).toBe(true);
      expect(mockBcrypt.compare).toHaveBeenCalledTimes(2);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(code, hashedCodes[0]);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(code, hashedCodes[1]);
    });

    it('should only work if the FIRST hash matches', async () => {
      const code = 'TEST-CODE';
      const hashedCodes = [
        'correct_hash_TEST-CODE',
        'wrong_hash_2',
        'wrong_hash_3',
      ];

      mockBcrypt.compare.mockResolvedValueOnce(true);

      const result = await service.compare(code, hashedCodes);

      expect(result).toBe(true);
      expect(mockBcrypt.compare).toHaveBeenCalledTimes(1);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(code, hashedCodes[0]);
    });
  });

  describe('Integration Tests', () => {
    let realService: RecoveryCodeService;

    beforeEach(async () => {
      jest.restoreAllMocks();

      const module: TestingModule = await Test.createTestingModule({
        providers: [RecoveryCodeService],
      }).compile();

      realService = module.get<RecoveryCodeService>(RecoveryCodeService);
    });

    it('should generate valid codes that can be hashed and compared', async () => {
      mockBcrypt.hash.mockImplementation((code: string) =>
        Promise.resolve(`real_hash_of_${code}`),
      );
      mockBcrypt.compare.mockImplementation((code: string, hash: string) =>
        Promise.resolve(hash === `real_hash_of_${code}`),
      );

      const codes = realService.generate();
      expect(codes).toHaveLength(10);

      const hashedCodes = await realService.hash(codes);
      expect(hashedCodes).toHaveLength(10);

      const firstCode = codes[0];
      const result = await realService.compare(firstCode, hashedCodes);
      expect(result).toBe(true);
    });

    it('should generate codes with proper randomness', () => {
      const codes1 = realService.generate();
      const codes2 = realService.generate();

      const hasDifference = codes1.some(
        (code, index) => code !== codes2[index],
      );
      expect(hasDifference).toBe(true);
    });

    it('should generate codes with correct character set', () => {
      const codes = realService.generate();
      const allowedChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789';

      codes.forEach((code) => {
        const cleanCode = code.replace('-', '');
        for (const char of cleanCode) {
          expect(allowedChars).toContain(char);
        }
      });
    });

    it('should generate codes with correct format consistently', () => {
      for (let i = 0; i < 5; i++) {
        const codes = realService.generate();
        expect(codes).toHaveLength(10);

        codes.forEach((code) => {
          expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
          expect(code).toHaveLength(9);
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle dynamic import returning undefined methods', async () => {
      jest.doMock('bcryptjs', () => ({}));

      const module: TestingModule = await Test.createTestingModule({
        providers: [RecoveryCodeService],
      }).compile();
      const testService = module.get<RecoveryCodeService>(RecoveryCodeService);

      const codes = ['TEST-CODE'];

      await expect(testService.hash(codes)).rejects.toThrow();
    });

    it('should handle dynamic import returning undefined methods for compare', async () => {
      jest.doMock('bcryptjs', () => ({}));

      const module: TestingModule = await Test.createTestingModule({
        providers: [RecoveryCodeService],
      }).compile();
      const testService = module.get<RecoveryCodeService>(RecoveryCodeService);

      const code = 'TEST-CODE';
      const hashedCodes = ['hash'];

      await expect(testService.compare(code, hashedCodes)).rejects.toThrow();
    });

    it('should handle bcrypt methods that are not functions', async () => {
      jest.doMock('bcryptjs', () => ({
        hash: 'not-a-function',
        compare: 'also-not-a-function',
      }));

      const module: TestingModule = await Test.createTestingModule({
        providers: [RecoveryCodeService],
      }).compile();
      const testService = module.get<RecoveryCodeService>(RecoveryCodeService);

      const codes = ['TEST-CODE'];
      await expect(testService.hash(codes)).rejects.toThrow();

      const hashedCodes = ['hash'];
      await expect(testService.compare('CODE', hashedCodes)).rejects.toThrow();
    });
  });
});
