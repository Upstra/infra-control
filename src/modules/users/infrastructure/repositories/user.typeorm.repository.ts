import { Injectable, Logger } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import {
  FindOneByFieldOptions,
  UserRepositoryInterface,
} from '../../domain/interfaces/user.repository.interface';
import { DataSource, Repository } from 'typeorm';
import { InvalidQueryValueException } from '@/core/exceptions/repository.exception';
import {
  UserDeletionException,
  UserNotFoundException,
  UserRetrievalException,
} from '../../domain/exceptions/user.exception';

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
    relations: string[] = ['role'],
  ): Promise<[User[], number]> {
    return this.findAndCount({
      relations,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async findOneByField<T extends keyof User>({
    field,
    value,
    disableThrow = false,
    relations = [],
  }: FindOneByFieldOptions<User, T>): Promise<User | null> {
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

  async updateUser(
    id: string,
    username: string,
    password: string,
    email: string,
    roleId: string,
  ): Promise<User> {
    const partial: Partial<User> = {
      username,
      password,
      email,
      roleId,
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
}
