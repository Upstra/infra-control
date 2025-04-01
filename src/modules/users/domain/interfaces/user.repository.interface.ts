import { User } from '../entities/user.entity';

export interface UserRepositoryInterface {
  findUserById(id: number): Promise<User | null>;
  createUser(
    username: string,
    password: string,
    email: string,
    roleId: number,
  ): Promise<User>;
  updateUser(
    id: number,
    username: string,
    password: string,
    email: string,
    roleId: number,
  ): Promise<User>;
  deleteUser(id: number): Promise<void>;
}
