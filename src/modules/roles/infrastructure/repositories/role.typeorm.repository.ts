import { Injectable } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { DataSource, Repository } from 'typeorm';
import { Role } from '../../domain/entities/role.entity';

@Injectable()
export class RoleTypeormRepository
  extends Repository<Role>
  implements RoleRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(Role, dataSource.createEntityManager());
  }

  async findAll(): Promise<Role[]> {
    return await this.find({
      relations: ['users'],
    });
  }

  async findRoleById(id: string): Promise<Role> {
    return await this.findOne({
      where: { id },
      relations: ['users'],
    });
  }

  async createRole(
    name: string,
    permissionServerId: string,
    permissionVmId: string,
  ): Promise<Role> {
    const role = this.create({
      name,
      permissionServerId,
      permissionVmId,
    });
    return await this.save(role);
  }

  async updateRole(
    id: string,
    name: string,
    permissionServerId: string,
    permissionVmId: string,
  ): Promise<Role> {
    const role = await this.findRoleById(id);
    if (!role) {
      throw new Error('Role not found');
    }
    role.name = name;
    role.permissionServerId = permissionServerId;
    role.permissionVmId = permissionVmId;
    return await this.save(role);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.findRoleById(id);
    if (!role) {
      throw new Error('Role not found');
    }
    await this.delete(id);
  }
}
