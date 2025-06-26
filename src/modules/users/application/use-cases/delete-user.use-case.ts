import { Inject } from '@nestjs/common';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';

export class DeleteUserUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(id: string): Promise<void> {
    await this.repo.findOneByField({
      field: 'id',
      value: id,
    });
    await this.repo.deleteUser(id);
    await this.logHistory?.execute('user', id, 'DELETE');
  }
}
