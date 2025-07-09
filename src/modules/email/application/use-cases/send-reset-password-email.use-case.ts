import { Injectable, Inject } from '@nestjs/common';
import { IMailService } from '../../domain/services/mail.service';
import { SendEmailDto } from '../dto/send-email.dto';
import { EmailAddressVO } from '../../domain/value-objects/email-address.vo';
import { MAIL_SERVICE_TOKEN } from '../../domain/constants/injection-tokens';

@Injectable()
export class SendResetPasswordEmailUseCase {
  constructor(
    @Inject(MAIL_SERVICE_TOKEN) private readonly mailService: IMailService,
  ) {}

  async execute(
    email: string,
    resetLink: string,
    firstname: string,
  ): Promise<void> {
    const dto = new SendEmailDto();
    dto.to = new EmailAddressVO(email);
    dto.subject = 'Réinitialisation de votre mot de passe';
    dto.template = 'reset-password';
    dto.context = { prenom: firstname, resetLink };
    await this.mailService.send(dto);
  }
}
