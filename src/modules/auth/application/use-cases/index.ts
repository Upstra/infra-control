import { LoginUseCase } from './login.use-case';
import { RegisterUseCase } from './register.use-case';
import { Get2FAStatusUseCase } from './get-2fa-status.use-case';
import { Generate2FAUseCase } from './generate-2fa.use-case';
import { Verify2FAUseCase } from './verify-2fa.use-case';
import { Disable2FAUseCase } from './disable-2fa.use-case';

export const AuthUseCases = [
  LoginUseCase,
  RegisterUseCase,
  Get2FAStatusUseCase,
  Generate2FAUseCase,
  Verify2FAUseCase,
  Disable2FAUseCase,
];

export {
  LoginUseCase,
  RegisterUseCase,
  Get2FAStatusUseCase,
  Generate2FAUseCase,
  Verify2FAUseCase,
  Disable2FAUseCase,
};
