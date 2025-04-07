import { Permission } from '../entities/permission.entity';

export interface PermissionRepositoryInterface {
  findAll(): Promise<Permission[]>;
  findPermissionById(id: string): Promise<Permission | null>;
  createPermission(
    name: string,
    ip: string,
    login: string,
    password: string,
  ): Promise<Permission>;
  updatePermission(
    id: string,
    name: string,
    ip: string,
    login: string,
    password: string,
  ): Promise<Permission>;
  deletePermission(id: string): Promise<void>;
}
