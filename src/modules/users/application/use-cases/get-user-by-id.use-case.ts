import { Inject } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserResponseDto } from '../dto/user.response.dto';

export class GetUserByIdUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
  ) {}

  async execute(id: string): Promise<UserResponseDto> {
    const user = await this.repo.findOneByField({
      field: 'id',
      value: id,
    });
    return new UserResponseDto(user);
  }
}
