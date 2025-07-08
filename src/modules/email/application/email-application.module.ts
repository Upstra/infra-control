import { Module } from '@nestjs/common';
import { SendAccountCreatedEmailUseCase } from './use-cases/send-account-created-email.use-case';
import { SendResetPasswordEmailUseCase } from './use-cases/send-reset-password-email.use-case';
import { SendPasswordChangedEmailUseCase } from './use-cases/send-password-changed-email.use-case';

@Module({
  providers: [
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
