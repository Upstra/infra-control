import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';
import { PresenceService } from '@/modules/presence/application/services/presence.service';

@Injectable()
export class GetUsersByRoleUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
    private readonly presenceService: PresenceService,
  ) {}

  async execute(roleId: string): Promise<UserResponseDto[]> {
    let users = await this.repo.findAllByField({
      field: 'roleId',
      value: roleId,
      relations: ['roles'],
    });

    await Promise.all(
      users.map(async (user) => {
        user.active = await this.presenceService.isOnline(user.id);
      }),
    );

    return users.map((u) => new UserResponseDto(u));
  }
}
