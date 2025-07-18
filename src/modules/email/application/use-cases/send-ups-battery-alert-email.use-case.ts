import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IMailService } from '../../domain/services/mail.service';
import { SendEmailDto } from '../dto/send-email.dto';
import { MAIL_SERVICE_TOKEN } from '../../domain/constants/injection-tokens';
import { UserTypeormRepository } from '@/modules/users/infrastructure/repositories/user.typeorm.repository';
import { EmailAddressVO } from '../../domain/value-objects/email-address.vo';

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
    @Inject(MAIL_SERVICE_TOKEN) private mailService: IMailService,
    private configService: ConfigService,
    @Inject('UserRepository') private userRepository: UserTypeormRepository,
  ) {}

  async execute(dto: SendUpsBatteryAlertEmailDto): Promise<void> {
    const adminUsers = await this.userRepository.findAll(['roles']);
    const adminEmails = adminUsers
      .filter(
        (user) =>
          user.isActive && user.roles?.some((role) => role.isAdmin === true),
      )
      .map((user) => user.email);
    if (adminEmails.length === 0) return;

    const sendPromises = adminEmails.map((email) => {
      const emailDto = new SendEmailDto();
      emailDto.to = EmailAddressVO.create(email);
      emailDto.subject = `[${dto.alertLevel.toUpperCase()}] UPS ${dto.upsName} - ${dto.minutesRemaining} minutes restantes`;
      emailDto.template = 'ups-battery-alert';
      emailDto.context = {
        ...dto,
        actionRequired: dto.alertLevel === 'critical',
        dashboardUrl: `${this.configService.get('FRONTEND_URL')}/ups`,
      };

      return this.mailService.send(emailDto);
    });

    await Promise.all(sendPromises);
  }
}
