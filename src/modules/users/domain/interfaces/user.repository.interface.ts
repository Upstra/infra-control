import { FindOneByFieldOptions } from '@/core/utils/index';
import { User } from '../entities/user.entity';
import { GenericRepositoryInterface } from '@/core/types/generic-repository.interface';

export interface UserRepositoryInterface
  extends GenericRepositoryInterface<User> {
  findOneById(id: string): Promise<User | null>;
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
}
export { FindOneByFieldOptions };
