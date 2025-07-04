import { Injectable, Logger } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import {
  FindOneByFieldOptions,
  FindAllByFieldOptions,
  UserRepositoryInterface,
} from '../../domain/interfaces/user.repository.interface';
import { DataSource, Repository, In } from 'typeorm';
import { InvalidQueryValueException } from '@/core/exceptions/repository.exception';
import {
  UserDeletionException,
  UserNotFoundException,
  UserRetrievalException,
} from '../../domain/exceptions/user.exception';
import { PrimitiveFields } from '@/core/types/primitive-fields.interface';

@Injectable()
export class UserTypeormRepository
  extends Repository<User>
  implements UserRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }
  findAll(relations?: string[]): Promise<User[]> {
    return this.find({
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
        ? { [field]: In(value as any) }
        : { [field]: value };
      return await this.find({ where: whereClause, relations });
    } catch (error) {
      if (disableThrow) return [];
      Logger.error('Error retrieving users by field:', error);
      throw new UserRetrievalException();
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
  ): Promise<[User[], number]> {
    return this.findAndCount({
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
        where: { [field]: value },
        relations,
      });
    } catch (error) {
      if (error.name === 'EntityNotFoundError') {
        if (disableThrow) {
          return null;
        }
        throw new UserNotFoundException(String(value));
      }
      Logger.error('Error retrieving user by field:', error);
      throw new UserRetrievalException();
    }
  }

  async count(): Promise<number> {
    return await super.count();
  }

  async countAdmins(): Promise<number> {
    return await this.createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('role.isAdmin = :admin', { admin: true })
      .getCount();
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
      throw new UserDeletionException();
    }
  }

  async findUsersByRole(roleId: string): Promise<User[]> {
    return await this.createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('role.id = :roleId', { roleId })
      .leftJoinAndSelect('user.roles', 'allRoles')
      .getMany();
  }
}
