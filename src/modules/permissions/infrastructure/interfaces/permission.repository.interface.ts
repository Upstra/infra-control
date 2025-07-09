import { GenericRepositoryInterface } from '@/core/types/generic-repository.interface';
import { Permission } from '../../domain/entities/permission.entity';
import { FindOneByFieldOptions } from '@/core/utils/index';

export interface PermissionRepositoryInterface<T extends Permission>
  extends GenericRepositoryInterface<T> {
  findAllByField<K extends keyof T>(
    options: FindOneByFieldOptions<T, K>,
  ): Promise<T[]>;
  findPermissionByIds(machineId: string, roleId: string): Promise<T>;
  updatePermission(
    machineId: string,
    roleId: string,
    bitmask: number,
  ): Promise<T>;
  deletePermission(machineId: string, roleId: string): Promise<void>;
  deleteById(id: string): Promise<void>;
  deleteByRoleId(roleId: string): Promise<void>;
  createPermission(
    machineId: string,
    roleId: string,
    bitmask: number,
  ): Promise<T>;
}
