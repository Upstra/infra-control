import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SendEmailDto } from '../application/dto/send-email.dto';
import { IMailService } from '../domain/services/mail.service';

@Injectable()
export class ZohoMailAdapter implements IMailService {
  private readonly logger = new Logger(ZohoMailAdapter.name);

  constructor(private readonly mailer: MailerService) {}

  async send(dto: SendEmailDto): Promise<void> {
    try {
      await this.mailer.sendMail({
        to: dto.to.value,
        subject: dto.subject,
        template: dto.template,
        context: dto.context,
      });
      this.logger.log(
        `Email sent to ${dto.to.value} using template ${dto.template}`,
      );
    } catch (err) {
      this.logger.error(`Failed to send email to ${dto.to.value}`, err.stack);
      throw err;
    }
  }
}
