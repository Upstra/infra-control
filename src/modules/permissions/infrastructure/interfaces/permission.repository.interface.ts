import { Permission } from '../../domain/entities/permission.entity';

export interface PermissionRepositoryInterface {
  findAllByRole(roleId: string): Promise<Permission[]>;
  findPermissionByIds(machineId: string, roleId: string): Promise<Permission>;
  updatePermission(
    machineId: string,
    roleId: string,
    allowWrite: boolean,
    allowRead: boolean,
  ): Promise<Permission>;
  deletePermission(machineId: string, roleId: string): Promise<void>;
}
