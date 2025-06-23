import { FindOneByFieldOptions } from '@/modules/users/domain/interfaces/user.repository.interface';
import { Role } from '../entities/role.entity';

export interface RoleRepositoryInterface {
  findAll(): Promise<Role[]>;
  paginate(
    page: number,
    limit: number,
    relations?: string[],
  ): Promise<[Role[], number]>;

  findOneByField<T extends keyof Role>(
    options: FindOneByFieldOptions<Role, T>,
  ): Promise<Role | null>;
  createRole(name: string): Promise<Role>;
  updateRole(id: string, name: string): Promise<Role>;
  deleteRole(id: string): Promise<void>;
  save(role: Role): Promise<Role>;
}
