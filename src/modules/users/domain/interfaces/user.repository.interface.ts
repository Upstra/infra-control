import { User } from '../entities/user.entity';

export interface UserRepositoryInterface {
  findUserById(id: string): Promise<User>;
  createUser(
    username: string,
    password: string,
    email: string,
    roleId: string,
  ): Promise<User>;
  updateUser(
    id: string,
    username: string,
    password: string,
    email: string,
    roleId: string,
  ): Promise<User>;
  deleteUser(id: string): Promise<void>;
}
