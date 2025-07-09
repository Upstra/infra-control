import { BadRequestException, NotFoundException } from '@nestjs/common';

export class UserPreferencesExceptions {
  static notFound(): NotFoundException {
    return new NotFoundException('User preferences not found');
  }

  static invalidTimezone(timezone: string): BadRequestException {
    return new BadRequestException(`Invalid timezone: ${timezone}`);
  }

  static invalidRefreshInterval(interval: number): BadRequestException {
    return new BadRequestException(
      `Refresh interval must be between 15 and 300 seconds. Got: ${interval}`,
    );
  }

  static invalidWebhookUrl(service: string, url: string): BadRequestException {
    return new BadRequestException(
      `Invalid webhook URL for ${service}: ${url}. URL must be HTTPS`,
    );
  }

  static invalidEmail(email: string): BadRequestException {
    return new BadRequestException(`Invalid email format: ${email}`);
  }

  static webhookUrlTooLong(service: string): BadRequestException {
    return new BadRequestException(
      `Webhook URL for ${service} exceeds maximum length of 500 characters`,
    );
  }

  static failedToCreate(): BadRequestException {
    return new BadRequestException('Failed to create user preferences');
  }

  static failedToUpdate(): BadRequestException {
    return new BadRequestException('Failed to update user preferences');
  }

  static failedToReset(): BadRequestException {
    return new BadRequestException('Failed to reset user preferences');
  }
}
