import { Module } from '@nestjs/common';
import { SendAccountCreatedEmailUseCase } from './use-cases/send-account-created-email.use-case';
import { SendResetPasswordEmailUseCase } from './use-cases/send-reset-password-email.use-case';
import { SendPasswordChangedEmailUseCase } from './use-cases/send-password-changed-email.use-case';
import { EmailInfrastructureModule } from '../infrastructures/email-infrastructure.module';
import { MAIL_SERVICE_TOKEN } from '../domain/constants/injection-tokens';
import { ZohoMailAdapter } from '../adapters/zoho-mail.adapter';

@Module({
  imports: [EmailInfrastructureModule],
  providers: [
    {
      provide: MAIL_SERVICE_TOKEN,
      useClass: ZohoMailAdapter,
    },
    SendAccountCreatedEmailUseCase,
    SendResetPasswordEmailUseCase,
    SendPasswordChangedEmailUseCase,
  ],
  exports: [
    SendAccountCreatedEmailUseCase,
    SendResetPasswordEmailUseCase,
    SendPasswordChangedEmailUseCase,
  ],
})
export class EmailApplicationModule {}
