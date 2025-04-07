import { PermissionDtoInterface } from './permission.dto.interface';

export interface PermissionEndpointInterface {
  getPermissionsByRole(roleId: string): Promise<PermissionDtoInterface[]>;
  getPermissionByIds(
    machineId: string,
    roleId: string,
  ): Promise<PermissionDtoInterface>;
  createPermission(
    permissionDto: PermissionDtoInterface,
  ): Promise<PermissionDtoInterface>;
  updatePermission(
    machineId: string,
    roleId: string,
    permissionDto: PermissionDtoInterface,
  ): Promise<PermissionDtoInterface>;
  deletePermission(machineId: string, roleId: string): Promise<void>;
}
