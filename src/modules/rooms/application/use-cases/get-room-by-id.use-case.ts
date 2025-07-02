import { Inject, Injectable } from '@nestjs/common';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { RoomResponseDto } from '../dto';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';
import { PermissionResolver } from '@/modules/permissions/application/utils/permission-resolver.util';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { ServerPermissionSet } from '@/modules/permissions/domain/value-objects/server-permission-set.value-object';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';

@Injectable()
export class GetRoomByIdUseCase {
  constructor(
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
    @Inject('PermissionServerRepositoryInterface')
    private readonly permissionRepo: PermissionServerRepositoryInterface,
    @Inject('UserRepositoryInterface')
    private readonly userRepo: UserRepositoryInterface,
  ) {}

  async execute(id: string, userId?: string): Promise<RoomResponseDto> {
    const room = await this.roomRepository.findRoomById(id);
    if (!userId) {
      room.servers = [];
      return RoomResponseDto.from(room);
    }

    const user = await this.userRepo.findOneByField({
      field: 'id',
      value: userId,
      relations: ['roles'],
    });

    const roleIds = user?.roles?.map((r) => r.id) ?? [];
    if (!roleIds.length) {
      room.servers = [];
      return RoomResponseDto.from(room);
    }

    const perms = await PermissionResolver.resolveServerPermissions(
      this.permissionRepo,
      roleIds,
    );

    const permSet = new ServerPermissionSet(perms);
    const readable = permSet.filterByBit(PermissionBit.READ);
    if (!readable.hasGlobalAccess()) {
      const ids = readable.getAccessibleResourceIds();
      room.servers = room.servers.filter((s) => ids.includes(s.id));
    }

    return RoomResponseDto.from(room);
  }
}
