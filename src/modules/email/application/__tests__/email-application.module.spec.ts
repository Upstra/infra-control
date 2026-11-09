import { EmailApplicationModule } from '../email-application.module';
import { SendAccountCreatedEmailUseCase } from '../use-cases/send-account-created-email.use-case';
import { SendResetPasswordEmailUseCase } from '../use-cases/send-reset-password-email.use-case';
import { SendPasswordChangedEmailUseCase } from '../use-cases/send-password-changed-email.use-case';
import { SendVmwareSyncReportEmailUseCase } from '../use-cases/send-vmware-sync-report-email.use-case';
import { SendUpsBatteryAlertEmailUseCase } from '../use-cases/send-ups-battery-alert-email.use-case';
import { SendMigrationCompletedEmailUseCase } from '../use-cases/send-migration-completed-email.use-case';
import { MAIL_SERVICE_TOKEN } from '../../domain/constants/injection-tokens';
import { ZohoMailAdapter } from '../../adapters/zoho-mail.adapter';

/**
 * The module imports UserModule (and through it most of the app, TypeORM
 * included): compiling it would need a database. Its wiring is checked from
 * the module metadata instead.
 */
describe('EmailApplicationModule', () => {
  const useCases = [
    SendAccountCreatedEmailUseCase,
    SendResetPasswordEmailUseCase,
    SendPasswordChangedEmailUseCase,
    SendVmwareSyncReportEmailUseCase,
    SendUpsBatteryAlertEmailUseCase,
    SendMigrationCompletedEmailUseCase,
  ];
  const providers = Reflect.getMetadata('providers', EmailApplicationModule);
  const exports = Reflect.getMetadata('exports', EmailApplicationModule);

  it('binds the mail service token to the Zoho adapter', () => {
    expect(providers).toContainEqual({
      provide: MAIL_SERVICE_TOKEN,
      useClass: ZohoMailAdapter,
    });
  });

  it.each(useCases.map((useCase) => [useCase.name, useCase]))(
    'provides and exports %s',
    (_, useCase) => {
      expect(providers).toContain(useCase);
      expect(exports).toContain(useCase);
    },
  );
});
