import { Inject } from '@nestjs/common';
import {
  UserDeletionException,
  UserNotFoundException,
} from '../../domain/exceptions/user.exception';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';

export class DeleteUserUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
  ) {}

  async execute(id: string): Promise<void> {
    try {
      await this.repo.deleteUser(id);
    } catch (e) {
      if (e instanceof UserNotFoundException) {
        throw e;
      }
      throw new UserDeletionException();
    }
  }
}
