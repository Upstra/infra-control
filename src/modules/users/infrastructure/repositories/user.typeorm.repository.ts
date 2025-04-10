import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { DataSource, Repository } from 'typeorm';

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
    return await this.findOne({ where: { [field]: value } as any });
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
    await this.findOneByField('id', id);
    await this.delete(id);
  }
}
