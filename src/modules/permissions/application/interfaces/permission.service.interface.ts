import { PermissionDtoInterface } from './permission.dto.interface';

export interface PermissionServiceInterface {
  getAllPermissions(): Promise<PermissionDtoInterface[]>;
  getPermissionById(id: string): Promise<PermissionDtoInterface>;
  createPermission(
    permissionDto: PermissionDtoInterface,
  ): Promise<PermissionDtoInterface>;
  updatePermission(
    id: string,
    permissionDto: PermissionDtoInterface,
  ): Promise<PermissionDtoInterface>;
  deletePermission(id: string): Promise<void>;
}
