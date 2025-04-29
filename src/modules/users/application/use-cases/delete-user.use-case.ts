import { Inject } from '@nestjs/common';

import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';

export class DeleteUserUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
  ) {}

  async execute(id: string): Promise<void> {
    await this.repo.findOneByField('id', id);
    await this.repo.deleteUser(id);
  }
}
