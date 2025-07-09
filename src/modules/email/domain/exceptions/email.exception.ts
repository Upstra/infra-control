import { BadRequestException } from '@nestjs/common';

export class InvalidEmailAddressException extends BadRequestException {
  constructor(email: string) {
    super({
      statusCode: 400,
      message: `Invalid email address: ${email}`,
      error: 'InvalidEmailAddress',
    });
  }
}

export class EmailSendFailedException extends BadRequestException {
  constructor(email: string, reason?: string) {
    super({
      statusCode: 400,
      message: `Failed to send email to ${email}${reason ? `: ${reason}` : ''}`,
      error: 'EmailSendFailed',
    });
  }
}