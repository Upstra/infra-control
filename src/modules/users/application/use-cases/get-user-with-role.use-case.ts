import { Inject, Injectable } from '@nestjs/common';
import { User } from '@/modules/users/domain/entities/user.entity';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';

@Injectable()
export class GetUserWithRoleUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async execute(userId: string): Promise<User | null> {
    return this.userRepository.findOneByField({
      field: 'id',
      value: userId,
      relations: ['role'],
    });
  }
}
