import { Injectable, Logger } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import {
  FindOneByFieldOptions,
  FindAllByFieldOptions,
  UserRepositoryInterface,
} from '../../domain/interfaces/user.repository.interface';
import { DataSource, Repository, In, IsNull } from 'typeorm';
import { InvalidQueryValueException } from '@/core/exceptions/repository.exception';
import { UserExceptions } from '../../domain/exceptions/user.exception';
import { PrimitiveFields } from '@/core/types/primitive-fields.interface';

@Injectable()
export class UserTypeormRepository
  extends Repository<User>
  implements UserRepositoryInterface
{
  constructor(dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }
  findAll(relations?: string[], includeDeleted = false): Promise<User[]> {
    const where = includeDeleted ? {} : { deletedAt: IsNull() };
    return this.find({
      where,
      relations: relations || ['role'],
    });
  }

  async findAllByField<T extends PrimitiveFields<User>>({
    field,
    value,
    disableThrow = false,
    relations = [],
  }: FindAllByFieldOptions<User, T>): Promise<User[]> {
    if (
      value === undefined ||
      value === null ||
      (Array.isArray(value) && value.length === 0)
    ) {
      if (disableThrow) return [];
      throw new InvalidQueryValueException(String(field), value);
    }

    try {
      const whereClause = Array.isArray(value)
        ? { [field]: In(value as any), deletedAt: IsNull() }
        : { [field]: value, deletedAt: IsNull() };
      return await this.find({ where: whereClause, relations });
    } catch (error) {
      if (disableThrow) return [];
      Logger.error('Error retrieving users by field:', error);
      throw UserExceptions.retrievalFailed();
    }
  }

  /**
   * Paginate users using TypeORM's find and count.
   *
   * @param page - current page starting from 1
   * @param limit - number of users per page
   * @param relations - optional relations to load
   */
  async paginate(
    page: number,
    limit: number,
    relations: string[] = ['roles'],
    includeDeleted = false,
  ): Promise<[User[], number]> {
    const where = includeDeleted ? {} : { deletedAt: IsNull() };
    return this.findAndCount({
      where,
      relations,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async findOneByField<K extends keyof User>({
    field,
    value,
    disableThrow = false,
    relations = [],
  }: FindOneByFieldOptions<User, K>): Promise<User | null> {
    if (value === undefined || value === null) {
      throw new InvalidQueryValueException(String(field), value);
    }
    try {
      return await this.findOneOrFail({
        where: { [field]: value, deletedAt: IsNull() } as any,
        relations,
      });
    } catch (error) {
      if (error.name === 'EntityNotFoundError') {
        if (disableThrow) {
          return null;
        }
        throw UserExceptions.notFound(String(value));
      }
      Logger.error('Error retrieving user by field:', error);
      throw UserExceptions.retrievalFailed();
    }
  }

  async countUsers(includeDeleted = false): Promise<number> {
    const query = this.createQueryBuilder('user');

    if (!includeDeleted) {
      query.where('user.deletedAt IS NULL');
    }

    return await query.getCount();
  }

  async count(): Promise<number> {
    return await this.countUsers(false);
  }

  async countAdmins(includeDeleted = false): Promise<number> {
    const query = this.createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('role.isAdmin = :admin', { admin: true });

    if (!includeDeleted) {
      query.andWhere('user.deletedAt IS NULL');
    }

    return await query.getCount();
  }

  async updateUser(
    id: string,
    username: string,
    password: string,
    email: string,
  ): Promise<User> {
    const partial: Partial<User> = {
      username,
      password,
      email,
    };

    return this.updateFields(id, partial);
  }

  async updateFields(id: string, partialUser: Partial<User>): Promise<User> {
    await super.update(id, partialUser);
    return await this.findOneByField({
      field: 'id',
      value: id,
    });
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await this.delete(id);
    } catch (error) {
      Logger.error('Error deleting user:', error);
      throw UserExceptions.deletionFailed();
    }
  }

  async findUsersByRole(
    roleId: string,
    includeDeleted = false,
  ): Promise<User[]> {
    const query = this.createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('role.id = :roleId', { roleId })
      .leftJoinAndSelect('user.roles', 'allRoles');

    if (!includeDeleted) {
      query.andWhere('user.deletedAt IS NULL');
    }

    return await query.getMany();
  }

  async findWithRoles(
    userId: string,
    includeDeleted = false,
  ): Promise<User | null> {
    const where = includeDeleted
      ? { id: userId }
      : ({ id: userId, deletedAt: IsNull() } as any);
    return await this.findOne({
      where,
      relations: ['roles'],
    });
  }

  async countActiveAdmins(): Promise<number> {
    return await this.createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('role.name IN (:...names)', { names: ['Admin', 'admin'] })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .andWhere('user.deletedAt IS NULL')
      .getCount();
  }

  async findById(id: string, includeDeleted = false): Promise<User | null> {
    const where = includeDeleted
      ? { id }
      : ({ id, deletedAt: IsNull() } as any);
    return await this.findOne({
      where,
    });
  }

  // Override findOneById to exclude soft-deleted users by default
  async findOneById(id: string): Promise<User | null> {
    return await this.findOne({
      where: { id, deletedAt: IsNull() } as any,
    });
  }
}
