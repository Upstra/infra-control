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
  async findUserById(id: string): Promise<User | null> {
    return this.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return await this.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.findOne({ where: { username } });
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
