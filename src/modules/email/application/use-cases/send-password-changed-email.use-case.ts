import { Injectable, Inject } from '@nestjs/common';
import { IMailService } from '../../domain/services/mail.service';
import { SendEmailDto } from '../dto/send-email.dto';
import { EmailAddressVO } from '../../domain/value-objects/email-address.vo';
import { MAIL_SERVICE_TOKEN } from '../../domain/constants/injection-tokens';

@Injectable()
export class SendPasswordChangedEmailUseCase {
  constructor(
    @Inject(MAIL_SERVICE_TOKEN) private readonly mailService: IMailService,
  ) {}

  async execute(
    email: string,
    firstname: string,
    ipAddress?: string,
    userAgent?: string,
    location?: string,
  ): Promise<void> {
    const dto = new SendEmailDto();
    dto.to = new EmailAddressVO(email);
    dto.subject = 'Votre mot de passe a été changé';
    dto.template = 'password-changed';
    dto.context = {
      prenom: firstname,
      email,
      changeDate: new Date().toLocaleDateString('fr-FR'),
      changeTime: new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      ipAddress: ipAddress ?? 'Adresse IP non disponible',
      userAgent: userAgent ?? 'Agent utilisateur non disponible',
      location: location ?? 'Localisation non disponible',
    };
    await this.mailService.send(dto);
  }
}
