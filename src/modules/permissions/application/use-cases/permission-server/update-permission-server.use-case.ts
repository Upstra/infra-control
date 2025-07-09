import { Inject, Injectable } from '@nestjs/common';
import {
  PermissionServerDto,
  UpdatePermissionServerDto,
} from '../../dto/permission.server.dto';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';

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
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(
    serverId: string,
    roleId: string,
    dto: UpdatePermissionServerDto,
    userId?: string,
  ): Promise<PermissionServerDto> {
    const oldPermission = await this.repository.findPermissionByIds(
      serverId,
      roleId,
    );
    const permission = await this.repository.updatePermission(
      serverId,
      roleId,
      dto.bitmask,
    );

    await this.logHistory?.executeStructured({
      entity: 'permission_server',
      entityId: `${serverId}_${roleId}`,
      action: 'UPDATE',
      userId: userId || 'system',
      oldValue: oldPermission
        ? {
            serverId: oldPermission.serverId,
            roleId: oldPermission.roleId,
            bitmask: oldPermission.bitmask,
          }
        : undefined,
      newValue: {
        serverId: permission.serverId,
        roleId: permission.roleId,
        bitmask: permission.bitmask,
      },
      metadata: {
        permissionType: 'server',
        bitmaskChanged: oldPermission
          ? oldPermission.bitmask !== permission.bitmask
          : true,
      },
    });

    return new PermissionServerDto(permission);
  }
}
