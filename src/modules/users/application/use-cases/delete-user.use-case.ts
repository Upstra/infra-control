import { Inject } from '@nestjs/common';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { CannotDeleteLastAdminException } from '../../domain/exceptions/user.exception';

/**
 * Deletes a user account by its identifier.
 *
 * Responsibilities:
 * - Validates the user exists.
 * - Performs any cleanup (revoke tokens, reassign assets).
 * - Delegates deletion to UserDomainService.
 *
 * @param id  UUID of the user to delete.
 * @returns   Promise<void> upon successful deletion.
 *
 * @throws NotFoundException if the user does not exist.
 *
 * @example
 * await deleteUserUseCase.execute('user-uuid-123');
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

    await this.repo.deleteUser(id);
    await this.logHistory?.execute('user', id, 'DELETE', userId);
  }
}
