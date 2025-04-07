import { Role } from '../entities/role.entity';

export interface RoleRepositoryInterface {
  findAll(): Promise<Role[]>;
  findRoleById(id: string): Promise<Role | null>;
  createRole(
    name: string,
    permissionServerId: string,
    permissionVmId: string,
  ): Promise<Role>;
  updateRole(
    id: string,
    name: string,
    permissionServerId: string,
    permissionVmId: string,
  ): Promise<Role>;
  deleteRole(id: string): Promise<void>;
}
