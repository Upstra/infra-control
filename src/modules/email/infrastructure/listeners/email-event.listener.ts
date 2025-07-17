import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EmailEventType,
  AccountCreatedEvent,
  PasswordChangedEvent,
  PasswordResetEvent,
  VmwareSyncReportEvent,
} from '../../domain/events/email.events';
import { SendAccountCreatedEmailUseCase } from '../../application/use-cases/send-account-created-email.use-case';
import { SendPasswordChangedEmailUseCase } from '../../application/use-cases/send-password-changed-email.use-case';
import { SendResetPasswordEmailUseCase } from '../../application/use-cases/send-reset-password-email.use-case';
import { SendVmwareSyncReportEmailUseCase } from '../../application/use-cases/send-vmware-sync-report-email.use-case';

@Injectable()
export class EmailEventListener {
  private readonly logger = new Logger(EmailEventListener.name);

  constructor(
    private readonly sendAccountCreatedEmail: SendAccountCreatedEmailUseCase,
    private readonly sendPasswordChangedEmail: SendPasswordChangedEmailUseCase,
    private readonly sendResetPasswordEmail: SendResetPasswordEmailUseCase,
    private readonly sendVmwareSyncReportEmail: SendVmwareSyncReportEmailUseCase,
  ) {}

  @OnEvent(EmailEventType.ACCOUNT_CREATED, { async: true })
  async handleAccountCreated(payload: AccountCreatedEvent) {
    try {
      this.logger.log(`Sending account created email to ${payload.email}`);
      await this.sendAccountCreatedEmail.execute(
        payload.email,
        payload.firstName,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send account created email to ${payload.email}`,
        error.stack,
      );
    }
  }

  @OnEvent(EmailEventType.PASSWORD_CHANGED, { async: true })
  async handlePasswordChanged(payload: PasswordChangedEvent) {
    try {
      this.logger.log(`Sending password changed email to ${payload.email}`);
      await this.sendPasswordChangedEmail.execute(
        payload.email,
        payload.firstName,
        payload.ipAddress,
        payload.userAgent,
        payload.location,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send password changed email to ${payload.email}`,
        error.stack,
      );
    }
  }

  @OnEvent(EmailEventType.PASSWORD_RESET, { async: true })
  async handlePasswordReset(payload: PasswordResetEvent) {
    try {
      this.logger.log(`Sending password reset email to ${payload.email}`);
      await this.sendResetPasswordEmail.execute(
        payload.email,
        payload.resetLink,
        payload.firstName,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${payload.email}`,
        error.stack,
      );
    }
  }

  @OnEvent(EmailEventType.VMWARE_SYNC_REPORT, { async: true })
  async handleVmwareSyncReport(payload: VmwareSyncReportEvent) {
    try {
      this.logger.log(
        `Sending VMware sync report to ${payload.adminEmails.length} admins`,
      );
      await this.sendVmwareSyncReportEmail.execute(
        payload.adminEmails,
        payload.date,
        payload.duration,
        payload.totalServers,
        payload.successfulServers,
        payload.failedServers,
        payload.vmsUpdated,
        payload.errors,
      );
    } catch (error) {
      this.logger.error(`Failed to send VMware sync report`, error.stack);
    }
  }
}
