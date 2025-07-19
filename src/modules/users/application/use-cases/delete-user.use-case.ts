import { Inject } from '@nestjs/common';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { CannotDeleteLastAdminException } from '../../domain/exceptions/user.exception';

/**
 * Performs a SOFT DELETE of a user account by its identifier.
 *
 * This use case performs a soft delete to preserve history and audit trails.
 * The user will be marked as deleted with a timestamp and deactivated,
 * but their data remains in the database for historical reference.
 *
 * Responsibilities:
 * - Validates the user exists.
 * - Checks if the user is the last admin (cannot delete last admin).
 * - Performs soft delete (sets deletedAt timestamp and isActive to false).
 * - Logs the deletion event in history.
 *
 * @param id  UUID of the user to delete.
 * @param userId  UUID of the user performing the deletion (for audit trail).
 * @returns   Promise<void> upon successful deletion.
 *
 * @throws UserNotFoundException if the user does not exist.
 * @throws CannotDeleteLastAdminException if attempting to delete the last admin.
 *
 * @example
 * await deleteUserUseCase.execute('user-uuid-123', 'admin-uuid');
 */

export class DeleteUserUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(id: string, userId?: string): Promise<void> {
    const user = await this.repo.findOneByField({
      field: 'id',
      value: id,
      relations: ['roles'],
    });

    if (
      user.roles?.some((r) => r.isAdmin) &&
      (await this.repo.countAdmins()) === 1
    ) {
      throw new CannotDeleteLastAdminException();
    }

    await this.repo.softDeleteUser(id);
    await this.logHistory?.execute('user', id, 'DELETE', userId);
  }
}
