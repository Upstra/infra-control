import { GenericRepositoryInterface } from '@/core/types/generic-repository.interface';
import { Permission } from '../../domain/entities/permission.entity';

export interface PermissionRepositoryInterface<T extends Permission>
  extends GenericRepositoryInterface<T> {
  findAllByRole(roleId: string): Promise<T[]>;
  findPermissionByIds(machineId: string, roleId: string): Promise<T>;
  updatePermission(
    machineId: string,
    roleId: string,
    bitmask: number,
  ): Promise<T>;
  deletePermission(machineId: string, roleId: string): Promise<void>;
  createPermission(
    machineId: string,
    roleId: string,
    bitmask: number,
  ): Promise<T>;
}
