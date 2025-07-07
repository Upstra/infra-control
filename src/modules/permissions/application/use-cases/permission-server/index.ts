import { CreateFullPermissionServerUseCase } from './create-full-permission-server.use-case';
import { CreatePermissionServerUseCase } from './create-permission-server.use-case';
import { CreateBatchPermissionServerUseCase } from './create-batch-permission-server.use-case';
import { CreateReadOnlyPermissionServerUseCase } from './create-readonly-permission-server.use-case';
import { DeletePermissionServerUseCase } from './delete-permission-server.use-case';
import { GetPermissionServerByIdsUseCase } from './get-permission-server-by-ids.use-case';
import { UpdatePermissionServerUseCase } from './update-permission-server.use-case';
import { GetPermissionsServerByRoleUseCase } from './get-permission-server-by-role.use-case';
import { GetUserServerPermissionsUseCase } from './get-user-permission-server-use-case';

export const PermissionServerUseCases = [
  CreateFullPermissionServerUseCase,
  CreatePermissionServerUseCase,
  CreateBatchPermissionServerUseCase,
  CreateReadOnlyPermissionServerUseCase,
  DeletePermissionServerUseCase,
  GetUserServerPermissionsUseCase,
  GetPermissionServerByIdsUseCase,
  GetPermissionsServerByRoleUseCase,
  UpdatePermissionServerUseCase,
];

export {
  CreateFullPermissionServerUseCase,
  CreatePermissionServerUseCase,
  CreateBatchPermissionServerUseCase,
  CreateReadOnlyPermissionServerUseCase,
  DeletePermissionServerUseCase,
  GetUserServerPermissionsUseCase,
  GetPermissionsServerByRoleUseCase,
  GetPermissionServerByIdsUseCase,
  UpdatePermissionServerUseCase,
};
