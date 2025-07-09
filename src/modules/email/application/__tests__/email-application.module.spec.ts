import { Test, TestingModule } from '@nestjs/testing';
import { EmailApplicationModule } from '../email-application.module';
import { SendAccountCreatedEmailUseCase } from '../use-cases/send-account-created-email.use-case';
import { SendResetPasswordEmailUseCase } from '../use-cases/send-reset-password-email.use-case';
import { SendPasswordChangedEmailUseCase } from '../use-cases/send-password-changed-email.use-case';
import { MAIL_SERVICE_TOKEN } from '../../domain/constants/injection-tokens';
import { IMailService } from '../../domain/services/mail.service';

describe('EmailApplicationModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    const mockMailService: IMailService = {
      send: jest.fn(),
    };

    module = await Test.createTestingModule({
      imports: [EmailApplicationModule],
    })
      .overrideProvider(MAIL_SERVICE_TOKEN)
      .useValue(mockMailService)
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide SendAccountCreatedEmailUseCase', () => {
    const useCase = module.get<SendAccountCreatedEmailUseCase>(
      SendAccountCreatedEmailUseCase,
    );
    expect(useCase).toBeDefined();
    expect(useCase).toBeInstanceOf(SendAccountCreatedEmailUseCase);
  });

  it('should provide SendResetPasswordEmailUseCase', () => {
    const useCase = module.get<SendResetPasswordEmailUseCase>(
      SendResetPasswordEmailUseCase,
    );
    expect(useCase).toBeDefined();
    expect(useCase).toBeInstanceOf(SendResetPasswordEmailUseCase);
  });

  it('should provide SendPasswordChangedEmailUseCase', () => {
    const useCase = module.get<SendPasswordChangedEmailUseCase>(
      SendPasswordChangedEmailUseCase,
    );
    expect(useCase).toBeDefined();
    expect(useCase).toBeInstanceOf(SendPasswordChangedEmailUseCase);
  });

  it('should export all use cases', () => {
    const exports = Reflect.getMetadata('exports', EmailApplicationModule);
    expect(exports).toContain(SendAccountCreatedEmailUseCase);
    expect(exports).toContain(SendResetPasswordEmailUseCase);
    expect(exports).toContain(SendPasswordChangedEmailUseCase);
  });
});
