import { CreateFullPermissionServerUseCase } from './create-full-permission-server.use-case';
import { CreatePermissionServerUseCase } from './create-permission-server.use-case';
import { CreateReadOnlyPermissionServerUseCase } from './create-readonly-permission-server.use-case';
import { DeletePermissionServerUseCase } from './delete-permission-server.use-case';
import { GetPermissionServerByIdsUseCase } from './get-permission-server-by-ids.use-case';
import { UpdatePermissionServerUseCase } from './update-permission-server.use-case';
import { GetPermissionsServerByRoleUseCase } from './get-permission-server-by-role.use-case';

export const PermissionServerUseCases = [
  CreateFullPermissionServerUseCase,
  CreatePermissionServerUseCase,
  CreateReadOnlyPermissionServerUseCase,
  DeletePermissionServerUseCase,
  GetPermissionServerByIdsUseCase,
  GetPermissionsServerByRoleUseCase,
  UpdatePermissionServerUseCase,
];

export {
  CreateFullPermissionServerUseCase,
  CreatePermissionServerUseCase,
  CreateReadOnlyPermissionServerUseCase,
  DeletePermissionServerUseCase,
  GetPermissionsServerByRoleUseCase,
  GetPermissionServerByIdsUseCase,
  UpdatePermissionServerUseCase,
};
