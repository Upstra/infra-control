import { Permission } from '../entities/permission.entity';

export interface PermissionRepositoryInterface {
  findAll(): Promise<Permission[]>;
  findPermissionById(id: number): Promise<Permission | null>;
  createPermission(
    name: string,
    ip: string,
    login: string,
    password: string,
  ): Promise<Permission>;
  updatePermission(
    id: number,
    name: string,
    ip: string,
    login: string,
    password: string,
  ): Promise<Permission>;
  deletePermission(id: number): Promise<void>;
}
