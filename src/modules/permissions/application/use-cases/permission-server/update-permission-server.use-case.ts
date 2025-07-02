import { Inject, Injectable } from '@nestjs/common';
import { PermissionServerDto } from '../../dto/permission.server.dto';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';

/**
 * Updates an existing server permission entry with new actions or scope.
 *
 * Responsibilities:
 * - Fetches existing permission by its ID.
 * - Applies changes from UpdatePermissionServerDto (actions, expiry, etc.).
 * - Persists and returns the updated permission DTO.
 *
 * @param id   The UUID of the permission record to update.
 * @param dto  UpdatePermissionServerDto containing updated fields.
 * @returns    Promise<PermissionServerDto> of the modified record.
 *
 * @throws {NotFoundException} if no permission entry matches the given ID.
 *
 * @example
 * const updated = await updatePermissionServerUseCase.execute(permissionId, { actions: ['read','write'] });
 */

@Injectable()
export class UpdatePermissionServerUseCase {
  constructor(
    @Inject('PermissionServerRepositoryInterface')
    private readonly repository: PermissionServerRepositoryInterface,
  ) {}

  async execute(
    serverId: string,
    roleId: string,
    dto: PermissionServerDto,
  ): Promise<PermissionServerDto> {
    const permission = await this.repository.updatePermission(
      serverId,
      roleId,
      dto.bitmask,
    );
    return new PermissionServerDto(permission);
  }
}
