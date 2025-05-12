import { LoginUseCase } from './login.use-case';
import { RegisterUseCase } from './register.use-case';
import { Get2FAStatusUseCase } from './get-2fa-status.use-case';
import { Generate2FAUseCase } from './generate-2fa.use-case';
import { Verify2FAUseCase } from './verify-2fa.use-case';
import { Disable2FAUseCase } from './disable-2fa.use-case';
import { Verify2FARecoveryUseCase } from './verify-2fa-recovery.use-case';

export const AuthUseCases = [
  LoginUseCase,
  RegisterUseCase,
  Get2FAStatusUseCase,
  Generate2FAUseCase,
  Verify2FAUseCase,
  Verify2FARecoveryUseCase,
  Disable2FAUseCase,
];

export {
  LoginUseCase,
  RegisterUseCase,
  Get2FAStatusUseCase,
  Generate2FAUseCase,
  Verify2FAUseCase,
  Verify2FARecoveryUseCase,
  Disable2FAUseCase,
};
