import {
  InvalidEmailAddressException,
  EmailSendFailedException,
} from '../email.exception';

describe('Email Exceptions', () => {
  describe('InvalidEmailAddressException', () => {
    it('should create exception with correct message', () => {
      const email = 'invalid-email';
      const exception = new InvalidEmailAddressException(email);

      expect(exception).toBeInstanceOf(InvalidEmailAddressException);
      expect(exception.getStatus()).toBe(400);
      expect(exception.getResponse()).toEqual({
        statusCode: 400,
        message: `Invalid email address: ${email}`,
        error: 'InvalidEmailAddress',
      });
    });

    it('should handle empty email', () => {
      const email = '';
      const exception = new InvalidEmailAddressException(email);

      expect(exception.getResponse()).toEqual({
        statusCode: 400,
        message: 'Invalid email address: ',
        error: 'InvalidEmailAddress',
      });
    });

    it('should handle special characters in email', () => {
      const email = '<script>alert("xss")</script>';
      const exception = new InvalidEmailAddressException(email);

      expect(exception.getResponse()).toEqual({
        statusCode: 400,
        message: `Invalid email address: ${email}`,
        error: 'InvalidEmailAddress',
      });
    });
  });

  describe('EmailSendFailedException', () => {
    it('should create exception with email only', () => {
      const email = 'test@example.com';
      const exception = new EmailSendFailedException(email);

      expect(exception).toBeInstanceOf(EmailSendFailedException);
      expect(exception.getStatus()).toBe(400);
      expect(exception.getResponse()).toEqual({
        statusCode: 400,
        message: `Failed to send email to ${email}`,
        error: 'EmailSendFailed',
      });
    });

    it('should create exception with email and reason', () => {
      const email = 'test@example.com';
      const reason = 'SMTP connection timeout';
      const exception = new EmailSendFailedException(email, reason);

      expect(exception.getResponse()).toEqual({
        statusCode: 400,
        message: `Failed to send email to ${email}: ${reason}`,
        error: 'EmailSendFailed',
      });
    });

    it('should handle empty reason', () => {
      const email = 'test@example.com';
      const reason = '';
      const exception = new EmailSendFailedException(email, reason);

      expect(exception.getResponse()).toEqual({
        statusCode: 400,
        message: `Failed to send email to ${email}`,
        error: 'EmailSendFailed',
      });
    });

    it('should handle undefined reason', () => {
      const email = 'test@example.com';
      const exception = new EmailSendFailedException(email, undefined);

      expect(exception.getResponse()).toEqual({
        statusCode: 400,
        message: `Failed to send email to ${email}`,
        error: 'EmailSendFailed',
      });
    });
  });
});