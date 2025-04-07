import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { DataSource, Repository } from 'typeorm';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user.notfound.exception';

@Injectable()
export class UserTypeormRepository
  extends Repository<User>
  implements UserRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.findOne({ where: { id } });
    if (!user) {
      throw new UserNotFoundException(id);
    }
    return user;
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
    user.username = username ? username : user.username;
    user.password = password ? password : user.password;
    user.email = email ? email : user.email;
    user.roleId = roleId ? roleId : user.roleId;
    await this.save(user);
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await this.findUserById(id);
    await this.delete(id);
  }
}
