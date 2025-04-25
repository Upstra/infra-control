// 📁 src/modules/users/application/use-cases/find-user-by-username.use-case.ts

import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { AuthNotFoundException } from '@/modules/auth/domain/exceptions/auth.exception';

@Injectable()
export class GetUserByUsernameUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepo: UserRepositoryInterface,
  ) {}

  async execute(username: string): Promise<User> {
    const user = await this.userRepo.findOneByField('username', username);
    if (!user) throw new AuthNotFoundException();
    return user;
  }
}
