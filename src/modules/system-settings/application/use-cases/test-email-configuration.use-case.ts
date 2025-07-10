import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SystemSettingsService } from '../../domain/services/system-settings.service';
import { EmailConfigurationException } from '../../domain/exceptions/system-settings.exceptions';

@Injectable()
export class TestEmailConfigurationUseCase {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  async execute(to: string): Promise<void> {
    const settings = await this.systemSettingsService.getSettings();
    const emailConfig = settings.settings.email;

    if (!emailConfig.enabled) {
      throw new EmailConfigurationException(
        'Email is not enabled in system settings',
      );
    }

    if (!emailConfig.smtp.host || !emailConfig.smtp.user) {
      throw new EmailConfigurationException('SMTP configuration is incomplete');
    }

    const transporter = nodemailer.createTransporter({
      host: emailConfig.smtp.host,
      port: emailConfig.smtp.port,
      secure: emailConfig.smtp.secure,
      auth: {
        user: emailConfig.smtp.user,
        pass: emailConfig.smtp.password,
      },
    });

    try {
      await transporter.verify();

      await transporter.sendMail({
        from: `"${emailConfig.from.name}" <${emailConfig.from.address}>`,
        to,
        subject: 'Test Email Configuration',
        text: 'This is a test email to verify the email configuration.',
        html: '<p>This is a test email to verify the email configuration.</p>',
      });
    } catch (error) {
      throw new EmailConfigurationException(
        `Failed to send test email: ${error.message}`,
      );
    }
  }
}
