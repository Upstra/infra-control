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
    const baseMessage = `Failed to send email to ${email}`;
    const fullMessage = reason ? `${baseMessage}: ${reason}` : baseMessage;
    
    super({
      statusCode: 400,
      message: fullMessage,
      error: 'EmailSendFailed',
    });
  }
}
