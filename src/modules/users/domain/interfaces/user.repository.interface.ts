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
  count(includeDeleted?: boolean): Promise<number>;
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
  /**
   * Delete a user (performs soft delete with anonymization).
   * The user data is anonymized and marked as deleted.
   * 
   * @param id - The ID of the user to delete
   * @throws UserDeletionException on error
   */
  deleteUser(id: string): Promise<void>;

  /**
   * Soft delete a user by setting deletedAt timestamp.
   * TODO: This method will be used for GDPR compliance in the future.
   * For now, we use hard delete via deleteUser().
   *
   * @param id - The ID of the user to soft delete
   * @returns Updated user with deletedAt set
   */
  softDeleteUser(id: string): Promise<User>;

  /**
   * Count the number of admin users in the system.
   * @param includeDeleted - Whether to include soft-deleted users
   */
  countAdmins(includeDeleted?: boolean): Promise<number>;

  /**
   * Retrieve users with pagination support.
   *
   * @param page - page number starting at 1
   * @param limit - number of users per page
   * @param relations - optional relations to load
   * @param includeDeleted - Whether to include soft-deleted users
   * @returns tuple containing users array and total user count
   */
  paginate(
    page: number,
    limit: number,
    relations?: string[],
    includeDeleted?: boolean,
  ): Promise<[User[], number]>;

  /**
   * Find all users that have a specific role.
   *
   * @param roleId - The ID of the role to search for
   * @param includeDeleted - Whether to include soft-deleted users
   * @returns Array of users having the specified role
   */
  findUsersByRole(roleId: string, includeDeleted?: boolean): Promise<User[]>;

  /**
   * Find a user by ID with their roles loaded.
   *
   * @param userId - The ID of the user
   * @param includeDeleted - Whether to include soft-deleted users
   * @returns User with roles or null
   */
  findWithRoles(userId: string, includeDeleted?: boolean): Promise<User | null>;

  /**
   * Count the number of active admin users in the system.
   *
   * @returns Number of active admins
   */
  countActiveAdmins(): Promise<number>;

  /**
   * Find a user by ID.
   *
   * @param id - The ID of the user
   * @param includeDeleted - Whether to include soft-deleted users (default: false)
   * @returns User or null
   */
  findById(id: string, includeDeleted?: boolean): Promise<User | null>;

  /**
   * Find all users.
   *
   * @param relations - optional relations to load
   * @param includeDeleted - Whether to include soft-deleted users
   * @returns Array of users
   */
  findAll(relations?: string[], includeDeleted?: boolean): Promise<User[]>;

  /**
   * Get only the isActive status of a user.
   *
   * @param userId - The ID of the user
   * @returns Object with isActive status or null if user not found
   */
  getUserActiveStatus(userId: string): Promise<{ isActive: boolean } | null>;

  /**
   * Find all users with admin role.
   *
   * @returns Array of admin users
   */
  findAdminUsers(): Promise<User[]>;

  /**
   * Find multiple users by their IDs.
   *
   * @param ids - Array of user IDs
   * @returns Array of users found
   */
  findByIds(ids: string[]): Promise<User[]>;

  /**
   * Permanently delete a user from the database.
   * WARNING: This is a hard delete and cannot be undone.
   * Use only for GDPR compliance after the retention period.
   * 
   * @param id - The ID of the user to permanently delete
   * @throws UserDeletionException on database error
   */
  hardDeleteUser(id: string): Promise<void>;
}
export { FindOneByFieldOptions, FindAllByFieldOptions };
