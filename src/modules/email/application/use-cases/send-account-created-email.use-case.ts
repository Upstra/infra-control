import { Injectable, Inject } from '@nestjs/common';
import { IMailService } from '../../domain/services/mail.service';
import { SendEmailDto } from '../dto/send-email.dto';
import { EmailAddressVO } from '../../domain/value-objects/email-address.vo';
import { MAIL_SERVICE_TOKEN } from '../../domain/constants/injection-tokens';

@Injectable()
export class SendAccountCreatedEmailUseCase {
  constructor(
    @Inject(MAIL_SERVICE_TOKEN) private readonly mailService: IMailService,
  ) {}

  async execute(email: string, firstName: string): Promise<void> {
    const dto = new SendEmailDto();
    dto.to = new EmailAddressVO(email);
    dto.subject = 'Bienvenue sur Upstra !';
    dto.template = 'account-created';
    dto.context = { prenom: firstName, email };
    await this.mailService.send(dto);
  }
}
