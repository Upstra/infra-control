import { Inject, Injectable } from '@nestjs/common';
import {
  PermissionVmDto,
  UpdatePermissionVmDto,
} from '../../dto/permission.vm.dto';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';

/**
 * Updates an existing VM permission entry with new bitmask.
 *
 * Responsibilities:
 * - Fetch existing permission by VM and role IDs.
 * - Apply changes from PermissionVmDto.
 * - Persist and return the updated permission DTO.
 *
 * @param vmId    The UUID of the VM.
 * @param roleId  The UUID of the role.
 * @param dto     PermissionVmDto containing updated bitmask.
 * @returns       Promise<PermissionVmDto> of the modified record.
 *
 * @throws {NotFoundException} if no permission entry matches the given IDs.
 *
 * @example
 * const updated = await updatePermissionVmUseCase.execute('vm1', 'role1', { bitmask: 15 });
 */

@Injectable()
export class UpdatePermissionVmUseCase {
  constructor(
    @Inject('PermissionVmRepositoryInterface')
    private readonly repository: PermissionVmRepositoryInterface,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(
    vmId: string,
    roleId: string,
    dto: UpdatePermissionVmDto,
    userId?: string,
  ): Promise<PermissionVmDto> {
    const oldPermission = await this.repository.findPermissionByIds(
      vmId,
      roleId,
    );
    const updated = await this.repository.updatePermission(
      vmId,
      roleId,
      dto.bitmask,
    );

    await this.logHistory?.executeStructured({
      entity: 'permission_vm',
      entityId: `${vmId}_${roleId}`,
      action: 'UPDATE',
      userId: userId || 'system',
      oldValue: oldPermission
        ? {
            vmId: oldPermission.vmId,
            roleId: oldPermission.roleId,
            bitmask: oldPermission.bitmask,
          }
        : undefined,
      newValue: {
        vmId: updated.vmId,
        roleId: updated.roleId,
        bitmask: updated.bitmask,
      },
      metadata: {
        permissionType: 'vm',
        bitmaskChanged: oldPermission
          ? oldPermission.bitmask !== updated.bitmask
          : true,
      },
    });

    return PermissionVmDto.fromEntity(updated);
  }
}
