import { GetUserVmPermissionsUseCase } from './get-user-permission-vm-use-case';
import { CreateFullPermissionVmUseCase } from './create-full-permission-vm.use-case';
import { CreatePermissionVmUseCase } from './create-permission-vm.use-case';
import { CreateBatchPermissionVmUseCase } from './create-batch-permission-vm.use-case';
import { CreateReadOnlyPermissionVmUseCase } from './create-readonly-permission-vm.use-case';
import { GetPermissionVmByIdsUseCase } from './get-permission-vm-by-ids.use-case';
import { GetPermissionsVmByRoleUseCase } from './get-permission-vm-by-role.use-case';
import { UpdatePermissionVmUseCase } from './update-permission-vm.use-case';
import { DeletePermissionVmUseCase } from './delete-permission-vm.use-case';

export const PermissionVmUseCases = [
  CreateFullPermissionVmUseCase,
  CreatePermissionVmUseCase,
  CreateBatchPermissionVmUseCase,
  CreateReadOnlyPermissionVmUseCase,
  GetUserVmPermissionsUseCase,
  GetPermissionVmByIdsUseCase,
  GetPermissionsVmByRoleUseCase,
  UpdatePermissionVmUseCase,
  DeletePermissionVmUseCase,
];

export {
  CreateFullPermissionVmUseCase,
  CreatePermissionVmUseCase,
  CreateBatchPermissionVmUseCase,
  CreateReadOnlyPermissionVmUseCase,
  GetUserVmPermissionsUseCase,
  GetPermissionVmByIdsUseCase,
  GetPermissionsVmByRoleUseCase,
  UpdatePermissionVmUseCase,
  DeletePermissionVmUseCase,
};
