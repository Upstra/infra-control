import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserPreferencesExceptions } from '../user-preferences.exception';

describe('UserPreferencesExceptions', () => {
  describe('notFound', () => {
    it('should return NotFoundException with correct message', () => {
      const exception = UserPreferencesExceptions.notFound();

      expect(exception).toBeInstanceOf(NotFoundException);
      expect(exception.message).toBe('User preferences not found');
    });
  });

  describe('invalidTimezone', () => {
    it('should return BadRequestException with timezone in message', () => {
      const timezone = 'Invalid/Timezone';
      const exception = UserPreferencesExceptions.invalidTimezone(timezone);

      expect(exception).toBeInstanceOf(BadRequestException);
      expect(exception.message).toBe(`Invalid timezone: ${timezone}`);
    });
  });

  describe('invalidRefreshInterval', () => {
    it('should return BadRequestException for interval too low', () => {
      const interval = 10;
      const exception = UserPreferencesExceptions.invalidRefreshInterval(interval);

      expect(exception).toBeInstanceOf(BadRequestException);
      expect(exception.message).toBe(
        `Refresh interval must be between 15 and 300 seconds. Got: ${interval}`,
      );
    });

    it('should return BadRequestException for interval too high', () => {
      const interval = 500;
      const exception = UserPreferencesExceptions.invalidRefreshInterval(interval);

      expect(exception).toBeInstanceOf(BadRequestException);
      expect(exception.message).toBe(
        `Refresh interval must be between 15 and 300 seconds. Got: ${interval}`,
      );
    });
  });

  describe('invalidWebhookUrl', () => {
    it('should return BadRequestException with service and URL', () => {
      const service = 'Slack';
      const url = 'http://insecure.com/webhook';
      const exception = UserPreferencesExceptions.invalidWebhookUrl(service, url);

      expect(exception).toBeInstanceOf(BadRequestException);
      expect(exception.message).toBe(
        `Invalid webhook URL for ${service}: ${url}. URL must be HTTPS`,
      );
    });
  });

  describe('invalidEmail', () => {
    it('should return BadRequestException with email in message', () => {
      const email = 'invalid-email';
      const exception = UserPreferencesExceptions.invalidEmail(email);

      expect(exception).toBeInstanceOf(BadRequestException);
      expect(exception.message).toBe(`Invalid email format: ${email}`);
    });
  });

  describe('webhookUrlTooLong', () => {
    it('should return BadRequestException with service name', () => {
      const service = 'Discord';
      const exception = UserPreferencesExceptions.webhookUrlTooLong(service);

      expect(exception).toBeInstanceOf(BadRequestException);
      expect(exception.message).toBe(
        `Webhook URL for ${service} exceeds maximum length of 500 characters`,
      );
    });
  });

  describe('failedToCreate', () => {
    it('should return BadRequestException with generic message', () => {
      const exception = UserPreferencesExceptions.failedToCreate();

      expect(exception).toBeInstanceOf(BadRequestException);
      expect(exception.message).toBe('Failed to create user preferences');
    });
  });

  describe('failedToUpdate', () => {
    it('should return BadRequestException with generic message', () => {
      const exception = UserPreferencesExceptions.failedToUpdate();

      expect(exception).toBeInstanceOf(BadRequestException);
      expect(exception.message).toBe('Failed to update user preferences');
    });
  });

  describe('failedToReset', () => {
    it('should return BadRequestException with generic message', () => {
      const exception = UserPreferencesExceptions.failedToReset();

      expect(exception).toBeInstanceOf(BadRequestException);
      expect(exception.message).toBe('Failed to reset user preferences');
    });
  });

  describe('Exception types', () => {
    it('should all be NestJS HTTP exceptions', () => {
      const exceptions = [
        UserPreferencesExceptions.notFound(),
        UserPreferencesExceptions.invalidTimezone('test'),
        UserPreferencesExceptions.invalidRefreshInterval(10),
        UserPreferencesExceptions.invalidWebhookUrl('test', 'url'),
        UserPreferencesExceptions.invalidEmail('test'),
        UserPreferencesExceptions.webhookUrlTooLong('test'),
        UserPreferencesExceptions.failedToCreate(),
        UserPreferencesExceptions.failedToUpdate(),
        UserPreferencesExceptions.failedToReset(),
      ];

      exceptions.forEach((exception) => {
        expect(exception).toHaveProperty('getStatus');
        expect(exception).toHaveProperty('message');
      });
    });
  });
});