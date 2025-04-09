import { User } from '../entities/user.entity';

export interface UserRepositoryInterface {
  save(user: User): Promise<User>;
  findUserById(id: string): Promise<User>;
  updateUser(
    id: string,
    username: string,
    password: string,
    firstName: string,
    lastName: string,
    email: string,
    roleId: string,
  ): Promise<User>;
  deleteUser(id: string): Promise<void>;

  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}
