import { Inject } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserResponseDto } from '../dto/user.response.dto';
import { UserNotFoundException } from '../../domain/exceptions/user.exception';

export class GetUserByIdUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
  ) {}

  async execute(id: string): Promise<UserResponseDto> {
    try {
      const user = await this.repo.findOneByField('id', id);
      return new UserResponseDto(user);
    } catch {
      throw new UserNotFoundException(id);
    }
  }
}
