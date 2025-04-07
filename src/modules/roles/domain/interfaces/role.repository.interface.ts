import { Role } from '../entities/role.entity';

export interface RoleRepositoryInterface {
  findAll(): Promise<Role[]>;
  findRoleById(id: string): Promise<Role>;
  createRole(name: string): Promise<Role>;
  updateRole(id: string, name: string): Promise<Role>;
  deleteRole(id: string): Promise<void>;
}
