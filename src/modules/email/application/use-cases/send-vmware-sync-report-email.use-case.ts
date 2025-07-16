import { Inject, Injectable } from '@nestjs/common';
import { MAIL_SERVICE_TOKEN } from '../../domain/constants/injection-tokens';
import { IMailService } from '../../domain/services/mail.service';
import { EmailAddressVO } from '../../domain/value-objects/email-address.vo';
import { SendEmailDto } from '../dto/send-email.dto';

@Injectable()
export class SendVmwareSyncReportEmailUseCase {
  constructor(
    @Inject(MAIL_SERVICE_TOKEN)
    private readonly mailService: IMailService,
  ) {}

  async execute(
    adminEmails: string[],
    date: string,
    duration: string,
    totalServers: number,
    successfulServers: number,
    failedServers: number,
    vmsUpdated: number,
    errors: string[],
  ): Promise<void> {
    const sendPromises = adminEmails.map(email => {
      const dto = new SendEmailDto();
      dto.to = EmailAddressVO.create(email);
      dto.subject = 'VMware Sync Report - Errors Detected';
      dto.template = 'vmware-sync-report';
      dto.context = {
        date,
        duration,
        totalServers,
        successfulServers,
        failedServers,
        vmsUpdated,
        errors,
        currentYear: new Date().getFullYear(),
      };
      return this.mailService.send(dto);
    });

    await Promise.all(sendPromises);
  }
}