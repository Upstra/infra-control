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

  async findUserById(id: string): Promise<User> {
    return await this.findOne({ where: { id } });
  }

  async createUser(
    username: string,
    password: string,
    email: string,
    roleId: string,
  ): Promise<User> {
    const user = this.create({
      username,
      password,
      email,
      roleId,
    });
    return await this.save(user);
  }

  async updateUser(
    id: string,
    username: string,
    password: string,
    email: string,
    roleId: string,
  ): Promise<User> {
    const user = await this.findUserById(id);
    if (!user) {
      throw new Error('User not found');
    }
    user.username = username;
    user.password = password;
    user.email = email;
    user.roleId = roleId;
    return await this.save(user);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.findUserById(id);
    if (!user) {
      throw new Error('User not found');
    }
    await this.delete(id);
  }
}
