import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../domain/services/mail.service';
import { SendEmailDto } from '../dtos/send-email.dto';

export interface SendUpsBatteryAlertEmailDto {
  upsName: string;
  upsIp: string;
  minutesRemaining: number;
  alertLevel: 'warning' | 'critical';
  statusLabel: string;
}

@Injectable()
export class SendUpsBatteryAlertEmailUseCase {
  constructor(
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  async execute(dto: SendUpsBatteryAlertEmailDto): Promise<void> {
    const adminEmails = this.configService
      .get<string>('ADMIN_EMAILS', '')
      .split(',')
      .filter(Boolean);

    if (adminEmails.length === 0) return;

    const emailDto: SendEmailDto = {
      to: adminEmails,
      subject: `[${dto.alertLevel.toUpperCase()}] UPS ${dto.upsName} - ${dto.minutesRemaining} minutes restantes`,
      template: 'ups-battery-alert',
      context: {
        ...dto,
        actionRequired: dto.alertLevel === 'critical',
        dashboardUrl: `${this.configService.get('FRONTEND_URL')}/ups`,
      },
    };

    await this.mailService.send(emailDto);
  }
}