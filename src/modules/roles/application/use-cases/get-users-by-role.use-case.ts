import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';

@Injectable()
export class GetUsersByRoleUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
  ) {}

  async execute(roleId: string): Promise<UserResponseDto[]> {
    const users = await this.repo.findAllByField({
      field: 'roleId',
      value: roleId,
      relations: ['role'],
    });
    return users.map((u) => new UserResponseDto(u));
  }
}
