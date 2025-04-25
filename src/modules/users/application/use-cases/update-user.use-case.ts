import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserResponseDto } from '../dto/user.response.dto';
import { UserUpdateDto } from '../dto/user.update.dto';
import { UserUpdateException } from '../../domain/exceptions/user.exception';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
  ) {}

  async execute(id: string, dto: UserUpdateDto): Promise<UserResponseDto> {
    try {
      const user = await this.repo.updateUser(
        id,
        dto.username,
        dto.password,
        '',
        '',
        dto.email,
        dto.roleId,
      );
      return new UserResponseDto(user);
    } catch (e) {
      if (e instanceof UserUpdateException) {
        throw e;
      }
      throw new UserUpdateException();
    }
  }
}
