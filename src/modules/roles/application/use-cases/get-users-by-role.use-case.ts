import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';
import { PresenceService } from '@/modules/presence/application/services/presence.service';

@Injectable()
export class GetUsersByRoleUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
    @Inject('RoleRepositoryInterface')
    private readonly roleRepo: RoleRepositoryInterface,
    private readonly presenceService: PresenceService,
  ) {}

  async execute(roleId: string): Promise<UserResponseDto[]> {
    const role = await this.roleRepo.findOneByField({
      field: 'id',
      value: roleId,
      relations: ['users', 'users.roles'],
    });

    let users = role?.users ?? [];

    const usersWithPresence = await Promise.all(
      users.map(async (user) => {
        const active = await this.presenceService.isOnline(user.id);
        return { user, active };
      }),
    );

    return usersWithPresence.map(({ user, active }) => {
      const dto = new UserResponseDto(user);
      (dto as any).active = active;
      return dto;
    });
  }
}
