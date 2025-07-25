import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { PresenceService } from '@/modules/presence/application/services/presence.service';
import { UserWithPresenceDto } from '../dto/user-with-presence.dto';

@Injectable()
export class GetUsersByRoleUseCase {
  constructor(
    @Inject('RoleRepositoryInterface')
    private readonly roleRepo: RoleRepositoryInterface,
    private readonly presenceService: PresenceService,
  ) {}

  async execute(roleId: string): Promise<UserWithPresenceDto[]> {
    const role = await this.roleRepo.findOneByField({
      field: 'id',
      value: roleId,
      relations: ['users', 'users.roles'],
    });

    let users = (role?.users ?? []).filter((user) => !user.deletedAt);
    const usersWithPresence = await Promise.all(
      users.map(async (user) => {
        const active = await this.presenceService.isOnline(user.id);
        return { user, active };
      }),
    );

    return usersWithPresence.map(({ user, active }) => {
      const dto = new UserWithPresenceDto(user);
      dto.isOnline = active;
      return dto;
    });
  }
}
