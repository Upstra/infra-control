import { Module, forwardRef } from '@nestjs/common';
import { SendAccountCreatedEmailUseCase } from './use-cases/send-account-created-email.use-case';
import { SendResetPasswordEmailUseCase } from './use-cases/send-reset-password-email.use-case';
import { SendPasswordChangedEmailUseCase } from './use-cases/send-password-changed-email.use-case';
import { SendVmwareSyncReportEmailUseCase } from './use-cases/send-vmware-sync-report-email.use-case';
import { SendUpsBatteryAlertEmailUseCase } from './use-cases/send-ups-battery-alert-email.use-case';
import { SendMigrationCompletedEmailUseCase } from './use-cases/send-migration-completed-email.use-case';
import { EmailInfrastructureModule } from '../infrastructure/email-infrastructure.module';
import { MAIL_SERVICE_TOKEN } from '../domain/constants/injection-tokens';
import { ZohoMailAdapter } from '../adapters/zoho-mail.adapter';
import { UserModule } from '@/modules/users/user.module';

@Module({
  imports: [EmailInfrastructureModule, forwardRef(() => UserModule)],
  providers: [
    {
      provide: MAIL_SERVICE_TOKEN,
      useClass: ZohoMailAdapter,
    },
    SendAccountCreatedEmailUseCase,
    SendResetPasswordEmailUseCase,
    SendPasswordChangedEmailUseCase,
    SendVmwareSyncReportEmailUseCase,
    SendUpsBatteryAlertEmailUseCase,
    SendMigrationCompletedEmailUseCase,
  ],
  exports: [
    SendAccountCreatedEmailUseCase,
    SendResetPasswordEmailUseCase,
    SendPasswordChangedEmailUseCase,
    SendVmwareSyncReportEmailUseCase,
    SendUpsBatteryAlertEmailUseCase,
    SendMigrationCompletedEmailUseCase,
  ],
})
export class EmailApplicationModule {}
