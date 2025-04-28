import { Injectable, Logger } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
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

  async findOneByField<T extends keyof User>(
    field: T,
    value: User[T],
  ): Promise<User | null> {
    if (value === undefined || value === null) {
      throw new InvalidQueryValueException(String(field), value);
    }
    try {
      return await this.findOneOrFail({ where: { [field]: value } as any });
    } catch (error) {
      if (error.name === 'EntityNotFoundError') {
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
    return await this.findOneByField('id', id);
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
