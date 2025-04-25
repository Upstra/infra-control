import { GetUserByIdUseCase } from './get-user-by-id.use-case';
import { GetMeUseCase } from './get-me.use-case';
import { UpdateUserUseCase } from './update-user.use-case';
import { DeleteUserUseCase } from './delete-user.use-case';
import { RegisterUserUseCase } from './register-user.use-case';
import { GetUserByEmailUseCase } from './get-user-by-email.use-case';
import { GetUserByUsernameUseCase } from './get-user-by-username.use-case';
import { UpdateUserFieldsUseCase } from './update-user-fields.use-case';
import { GetUserCountUseCase } from './get-user-count.use-case';

export const UserUseCase = [
  GetUserByIdUseCase,
  GetUserByEmailUseCase,
  GetUserByUsernameUseCase,
  GetMeUseCase,
  GetUserCountUseCase,
  UpdateUserUseCase,
  UpdateUserFieldsUseCase,
  DeleteUserUseCase,
  RegisterUserUseCase,
];

export {
  GetUserByIdUseCase,
  GetUserByEmailUseCase,
  GetUserByUsernameUseCase,
  GetMeUseCase,
  GetUserCountUseCase,
  UpdateUserUseCase,
  UpdateUserFieldsUseCase,
  DeleteUserUseCase,
  RegisterUserUseCase,
};
