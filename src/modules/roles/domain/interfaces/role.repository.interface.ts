import { Role } from '../entities/role.entity';

export interface RoleRepositoryInterface {
  findAll(): Promise<Role[]>;
  findRoleById(id: number): Promise<Role | null>;
  createRole(
    name: string,
    permissionServerId: number,
    permissionVmId: number,
  ): Promise<Role>;
  updateRole(
    id: number,
    name: string,
    permissionServerId: number,
    permissionVmId: number,
  ): Promise<Role>;
  deleteRole(id: number): Promise<void>;
}
