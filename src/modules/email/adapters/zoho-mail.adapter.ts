import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SendEmailDto } from '../application/dto/send-email.dto';
import { IMailService } from '../domain/services/mail.service';
import { EmailSendFailedException } from '../domain/exceptions/email.exception';

@Injectable()
export class ZohoMailAdapter implements IMailService {
  private readonly logger = new Logger(ZohoMailAdapter.name);

  constructor(private readonly mailer: MailerService) {}

  async send(dto: SendEmailDto): Promise<void> {
    try {
      const enrichedContext = {
        ...dto.context,
        logoUrl:
          process.env.MAIL_LOGO_URL ??
          'https://github.com/Upstra/.github/blob/dcd1f2dc99276f0fd22eea7b8dd7f35902c562cc/PA2025%20Upstra%20Logo.png?raw=true',
        loginUrl: process.env.APP_URL ?? 'http://localhost:3000',
        currentYear: new Date().getFullYear(),
      };

      await this.mailer.sendMail({
        to: dto.to.value,
        subject: dto.subject,
        template: dto.template,
        context: enrichedContext,
      });
      this.logger.log(
        `Email sent to ${dto.to.value} using template ${dto.template}`,
      );
    } catch (err) {
      this.logger.error(`Failed to send email to ${dto.to.value}`, err.stack);
      throw new EmailSendFailedException(dto.to.value, err.message);
    }
  }
}
