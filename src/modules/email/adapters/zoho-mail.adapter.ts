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
      const logoUrl = this.validateAndGetLogoUrl();
      const enrichedContext = {
        ...dto.context,
        logoUrl,
        loginUrl: process.env.APP_URL ?? 'http://localhost:3000',
        currentYear: new Date().getFullYear(),
        supportEmail: process.env.SUPPORT_EMAIL || 'support@upstra.com',
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

  private validateAndGetLogoUrl(): string {
    const defaultLogoUrl =
      'https://github.com/Upstra/.github/blob/dcd1f2dc99276f0fd22eea7b8dd7f35902c562cc/PA2025%20Upstra%20Logo.png?raw=true';
    const configuredLogoUrl = process.env.MAIL_LOGO_URL;

    if (!configuredLogoUrl) {
      return defaultLogoUrl;
    }

    try {
      const url = new URL(configuredLogoUrl);

      if (url.protocol !== 'https:') {
        this.logger.warn(
          `Logo URL is not HTTPS: ${configuredLogoUrl}, using default`,
        );
        return defaultLogoUrl;
      }

      return configuredLogoUrl;
    } catch (error) {
      this.logger.warn(`Invalid logo URL: ${configuredLogoUrl}, using default`);
      return defaultLogoUrl;
    }
  }
}
