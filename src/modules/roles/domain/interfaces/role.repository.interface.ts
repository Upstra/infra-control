import { Role } from '../entities/role.entity';

export interface RoleRepositoryInterface {
  findAll(): Promise<Role[]>;
  findRoleById(id: number): Promise<Role | null>;
  createRole(
    name: string,
    allowWriteServer: boolean,
    allowReadServer: boolean,
    allowWriteVM: boolean,
    allowReadVM: boolean,
  ): Promise<Role>;
  updateRole(
    id: number,
    name: string,
    allowWriteServer: boolean,
    allowReadServer: boolean,
    allowWriteVM: boolean,
    allowReadVM: boolean,
  ): Promise<Role>;
  deleteRole(id: number): Promise<void>;
}
