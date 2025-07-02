import { Inject, Injectable } from '@nestjs/common';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { RoomResponseDto } from '../dto';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { ServerPermissionSet } from '@/modules/permissions/domain/value-objects/server-permission-set.value-object';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';

/**
 * Fetches details for a single room by its unique identifier.
 *
 * Responsibilities:
 * - Validates the provided room ID.
 * - Uses RoomDomainService to retrieve the entity.
 * - Converts the entity into RoomDto.
 *
 * @param id  UUID of the room to retrieve.
 * @returns   Promise<RoomDto> the corresponding room DTO.
 *
 * @throws NotFoundException if no room matches the given ID.
 *
 * @example
 * const room = await getRoomByIdUseCase.execute('room-uuid-123');
 */

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
      relations: ['role'],
    });

    if (!user?.roleId) {
      room.servers = [];
      return RoomResponseDto.from(room);
    }

    const perms = await this.permissionRepo.findAllByField({
      field: 'roleId',
      value: user.roleId,
    });

    const permSet = new ServerPermissionSet(perms);
    const readable = permSet.filterByBit(PermissionBit.READ);
    if (!readable.hasGlobalAccess()) {
      const ids = readable.getAccessibleResourceIds();
      room.servers = room.servers.filter((s) => ids.includes(s.id));
    }

    return RoomResponseDto.from(room);
  }
}
