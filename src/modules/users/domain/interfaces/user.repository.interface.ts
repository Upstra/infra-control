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
  ): Promise<User>;
  deleteUser(id: string): Promise<void>;

  /**
   * Count the number of admin users in the system.
   */
  countAdmins(): Promise<number>;

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

  /**
   * Find all users that have a specific role.
   *
   * @param roleId - The ID of the role to search for
   * @returns Array of users having the specified role
   */
  findUsersByRole(roleId: string): Promise<User[]>;

  /**
   * Find a user by ID with their roles loaded.
   *
   * @param userId - The ID of the user
   * @returns User with roles or null
   */
  findWithRoles(userId: string): Promise<User | null>;

  /**
   * Count the number of active admin users in the system.
   * 
   * @returns Number of active admins
   */
  countActiveAdmins(): Promise<number>;

  /**
   * Find a user by ID including soft-deleted users.
   *
   * @param id - The ID of the user
   * @returns User or null
   */
  findById(id: string): Promise<User | null>;
}
export { FindOneByFieldOptions, FindAllByFieldOptions };
