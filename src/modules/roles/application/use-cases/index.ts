import { CreateRoleUseCase } from './create-role.use-case';
import { DeleteRoleUseCase } from './delete-role.use-case';
import { EnsureDefaultRoleUseCase } from './ensure-default-role.use-case';
import { GetAllRolesUseCase } from './get-all-roles.use-case';
import { GetRoleByIdUseCase } from './get-role-by-id.use-case';
import { GetRoleListUseCase } from './get-role-list.use-case';
import { UpdateRoleUseCase } from './update-role.use-case';
import { GetUsersByRoleUseCase } from './get-users-by-role.use-case';
import { UpdateUserRoleUseCase } from './update-user-role.use-case';

export const RoleUseCases = [
  CreateRoleUseCase,
  GetAllRolesUseCase,
  GetRoleByIdUseCase,
  GetRoleListUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase,
  EnsureDefaultRoleUseCase,
  GetUsersByRoleUseCase,
  UpdateUserRoleUseCase,
];

export {
  CreateRoleUseCase,
  GetAllRolesUseCase,
  GetRoleByIdUseCase,
  GetRoleListUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase,
  EnsureDefaultRoleUseCase,
  GetUsersByRoleUseCase,
  UpdateUserRoleUseCase,
};
