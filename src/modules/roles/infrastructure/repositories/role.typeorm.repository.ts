import { Injectable } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { DataSource, Repository } from 'typeorm';
import { Role } from '../../domain/entities/role.entity';
import {
  RoleNotFoundException,
  RoleRetrievalException,
} from '../../domain/exceptions/role.exception';
import { FindOneByFieldOptions } from '@/modules/users/domain/interfaces/user.repository.interface';
import { Logger } from '@nestjs/common';
import { InvalidQueryValueException } from '@/core/exceptions/repository.exception';
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

  async findOneByField<T extends keyof Role>({
    field,
    value,
    disableThrow = false,
    relations,
  }: FindOneByFieldOptions<Role, T>): Promise<Role | null> {
    if (value === undefined || value === null) {
      throw new InvalidQueryValueException(String(field), value);
    }
    try {
      return await this.findOneOrFail({
        where: { [field]: value } as any,
        relations,
      });
    } catch (error) {
      if (error.name === 'EntityNotFoundError') {
        if (disableThrow) {
          return null;
        }
        throw new RoleNotFoundException(String(value));
      }
      Logger.error('Error retrieving role by field:', error);
      throw new RoleRetrievalException();
    }
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
    const role = await this.findOneByField({
      field: 'id',
      value: id,
    });
    role.name = name;
    await this.save(role);
    return role;
  }

  async deleteRole(id: string): Promise<void> {
    await this.findOneByField({
      field: 'id',
      value: id,
    });
    await this.delete(id);
  }
}
