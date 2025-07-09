import { Injectable } from '@nestjs/common';
import { IMailService } from '../../domain/services/mail.service';
import { SendEmailDto } from '../dto/send-email.dto';
import { EmailAddressVO } from '../../domain/value-objects/email-address.vo';

@Injectable()
export class SendAccountCreatedEmailUseCase {
  constructor(private readonly mailService: IMailService) {}

  async execute(email: string, firstname: string): Promise<void> {
    const dto = new SendEmailDto();
    dto.to = new EmailAddressVO(email);
    dto.subject = 'Bienvenue sur Upstra !';
    dto.template = 'account-created';
    dto.context = { prenom: firstname };
    await this.mailService.send(dto);
  }
}
