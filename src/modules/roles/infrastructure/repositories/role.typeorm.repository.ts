import { Injectable } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { DataSource, Repository } from 'typeorm';
import { Role } from '../../domain/entities/role.entity';
import { RoleNotFoundException } from '../../domain/exceptions/role.exception';

@Injectable()
export class RoleTypeormRepository
  extends Repository<Role>
  implements RoleRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(Role, dataSource.createEntityManager());
  }

  async findByName(name: string): Promise<Role> {
    const role = await this.findOne({
      where: { name },
      relations: ['users', 'permissionServers', 'permissionVms'],
    });
    if (!role) {
      throw new RoleNotFoundException(name);
    }
    return role;
  }

  async findAll(): Promise<Role[]> {
    return await this.find({
      relations: ['users', 'permissionServers', 'permissionVms'],
    });
  }

  async findRoleById(id: string): Promise<Role> {
    const role = await this.findOne({
      where: { id },
      relations: ['users', 'permissionServers', 'permissionVms'],
    });
    if (!role) {
      throw new RoleNotFoundException(id);
    }
    return role;
  }

  async createRole(name: string): Promise<Role> {
    const role = this.create({
      name,
      users: [],
      permissionServers: [],
      permissionVms: [],
    });
    return await this.save(role);
  }

  async updateRole(id: string, name: string): Promise<Role> {
    const role = await this.findRoleById(id);
    role.name = name;
    await this.save(role);
    return role;
  }

  async deleteRole(id: string): Promise<void> {
    await this.findRoleById(id);
    await this.delete(id);
  }
}
