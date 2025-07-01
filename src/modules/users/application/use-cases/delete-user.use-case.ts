import { Inject } from '@nestjs/common';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { CannotDeleteLastAdminException } from '../../domain/exceptions/user.exception';

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
      relations: ['role'],
    });

    if (user.role.isAdmin && (await this.repo.countAdmins()) === 1) {
      throw new CannotDeleteLastAdminException();
    }

    await this.repo.deleteUser(id);
    await this.logHistory?.execute('user', id, 'DELETE', userId);
  }
}
