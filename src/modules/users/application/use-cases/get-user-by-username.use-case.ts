import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class GetUserByUsernameUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepo: UserRepositoryInterface,
  ) {}

  async execute(username: string): Promise<User> {
    const user = await this.userRepo.findOneByField({
      field: 'username',
      value: username,
    });
    return user;
  }
}
