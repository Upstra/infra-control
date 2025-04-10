import { User } from '../entities/user.entity';

export interface UserRepositoryInterface {
  updateFields(id: string, partialUser: Partial<User>): Promise<User>;
  count(): Promise<number>;
  save(user: User): Promise<User>;
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
  findOneByField<T extends keyof User>(
    field: T,
    value: User[T],
  ): Promise<User | null>;
}
