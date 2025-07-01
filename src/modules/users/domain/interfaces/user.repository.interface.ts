import {
  FindOneByFieldOptions,
  FindAllByFieldOptions,
} from '@/core/utils/index';
import { PrimitiveFields } from '@/core/types/primitive-fields.interface';
import { User } from '../entities/user.entity';
import { GenericRepositoryInterface } from '@/core/types/generic-repository.interface';

export interface UserRepositoryInterface
  extends GenericRepositoryInterface<User> {
  findOneById(id: string): Promise<User | null>;
  updateFields(id: string, partialUser: Partial<User>): Promise<User>;
  count(): Promise<number>;
  save(user: User): Promise<User>;
  findAllByField<T extends PrimitiveFields<User>>(
    options: FindAllByFieldOptions<User, T>,
  ): Promise<User[]>;
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

  /**
   * Retrieve users with pagination support.
   *
   * @param page - page number starting at 1
   * @param limit - number of users per page
   * @param relations - optional relations to load
   * @returns tuple containing users array and total user count
   */
  paginate(
    page: number,
    limit: number,
    relations?: string[],
  ): Promise<[User[], number]>;
}
export { FindOneByFieldOptions, FindAllByFieldOptions };
