// 📁 src/modules/users/application/use-cases/find-user-by-email.use-case.ts

import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class GetUserByEmailUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepo: UserRepositoryInterface,
  ) {}

  async execute(email: string): Promise<User> {
    const user = await this.userRepo.findOneByField({
      field: 'email',
      value: email,
    });
    return user;
  }
}
