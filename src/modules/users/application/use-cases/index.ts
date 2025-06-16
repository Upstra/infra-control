import { GetUserByIdUseCase } from './get-user-by-id.use-case';
import { GetMeUseCase } from './get-me.use-case';
import { UpdateUserUseCase } from './update-user.use-case';
import { DeleteUserUseCase } from './delete-user.use-case';
import { RegisterUserUseCase } from './register-user.use-case';
import { GetUserByEmailUseCase } from './get-user-by-email.use-case';
import { GetUserByUsernameUseCase } from './get-user-by-username.use-case';
import { UpdateUserFieldsUseCase } from './update-user-fields.use-case';
import { GetUserCountUseCase } from './get-user-count.use-case';
import { ResetPasswordUseCase } from './reset-password.use-case';
import { GetUserWithRoleUseCase } from './get-user-with-role.use-case';

export const UserUseCase = [
  GetUserByIdUseCase,
  GetUserByEmailUseCase,
  GetUserByUsernameUseCase,
  GetUserWithRoleUseCase,
  GetMeUseCase,
  GetUserCountUseCase,
  UpdateUserUseCase,
  UpdateUserFieldsUseCase,
  DeleteUserUseCase,
  RegisterUserUseCase,
  ResetPasswordUseCase,
];

export {
  GetUserByIdUseCase,
  GetUserByEmailUseCase,
  GetUserByUsernameUseCase,
  GetUserWithRoleUseCase,
  GetMeUseCase,
  GetUserCountUseCase,
  UpdateUserUseCase,
  UpdateUserFieldsUseCase,
  DeleteUserUseCase,
  RegisterUserUseCase,
  ResetPasswordUseCase,
};
