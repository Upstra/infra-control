import { EmailAddressVO } from '../email-address.vo';
import { InvalidEmailAddressException } from '../../exceptions/email.exception';

describe('EmailAddressVO', () => {
  describe('constructor', () => {
    it('should create a valid email address value object', () => {
      const email = 'test@example.com';
      const emailVO = new EmailAddressVO(email);

      expect(emailVO.value).toBe(email);
    });

    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@sub.example.com',
        'first.last@example.org',
        'test@localhost',
        'admin@company.io',
      ];

      validEmails.forEach((email) => {
        const emailVO = new EmailAddressVO(email);
        expect(emailVO.value).toBe(email);
      });
    });

    it('should throw error for invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example .com',
        '',
        '   ',
        'user@@example.com',
        'user.example.com',
        'user@.com',
        'user@example.',
      ];

      invalidEmails.forEach((email) => {
        expect(() => new EmailAddressVO(email)).toThrow(InvalidEmailAddressException);
      });
    });

    it('should throw error for null or undefined', () => {
      expect(() => new EmailAddressVO(null as any)).toThrow(
        InvalidEmailAddressException,
      );
      expect(() => new EmailAddressVO(undefined as any)).toThrow(
        InvalidEmailAddressException,
      );
    });

    it('should handle email with uppercase letters', () => {
      const email = 'User@Example.COM';
      const emailVO = new EmailAddressVO(email);

      expect(emailVO.value).toBe(email);
    });

    it('should handle email with numbers', () => {
      const email = 'user123@example456.com';
      const emailVO = new EmailAddressVO(email);

      expect(emailVO.value).toBe(email);
    });

    it('should handle email with special characters in local part', () => {
      const email = 'user.name+tag@example.com';
      const emailVO = new EmailAddressVO(email);

      expect(emailVO.value).toBe(email);
    });
  });

  describe('toString', () => {
    it('should return the email address as string', () => {
      const email = 'test@example.com';
      const emailVO = new EmailAddressVO(email);

      expect(emailVO.toString()).toBe(email);
      expect(String(emailVO)).toBe(email);
    });
  });

  describe('equals', () => {
    it('should return true for same email addresses', () => {
      const email = 'test@example.com';
      const emailVO1 = new EmailAddressVO(email);
      const emailVO2 = new EmailAddressVO(email);

      expect(emailVO1.equals(emailVO2)).toBe(true);
    });

    it('should return false for different email addresses', () => {
      const emailVO1 = new EmailAddressVO('test1@example.com');
      const emailVO2 = new EmailAddressVO('test2@example.com');

      expect(emailVO1.equals(emailVO2)).toBe(false);
    });

    it('should be case sensitive in comparison', () => {
      const emailVO1 = new EmailAddressVO('Test@Example.com');
      const emailVO2 = new EmailAddressVO('test@example.com');

      expect(emailVO1.equals(emailVO2)).toBe(false);
    });
  });
});