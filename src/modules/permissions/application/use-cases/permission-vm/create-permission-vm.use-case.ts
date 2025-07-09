import { Inject, Injectable } from '@nestjs/common';
import { PermissionVmDto } from '../../dto/permission.vm.dto';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';

/**
 * Grants specific permissions on a VM to a user or role.
 *
 * Responsibilities:
 * - Validate target VM and grantee (user or role).
 * - Persist a new permission entry specifying allowed operations.
 *
 * @param dto  CreatePermissionVmDto containing vmId, granteeId, and actions.
 * @returns    Promise<PermissionVmDto> the newly created permission record.
 *
 * @throws {ValidationException} if DTO fields are missing or invalid.
 *
 * @example
 * const perm = await createPermissionVmUseCase.execute({ vmId, granteeId, actions: ['start','stop'] });
 */

@Injectable()
export class CreatePermissionVmUseCase {
  constructor(
    @Inject('PermissionVmRepositoryInterface')
    private readonly repository: PermissionVmRepositoryInterface,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(
    dto: PermissionVmDto,
    userId?: string,
  ): Promise<PermissionVmDto> {
    const permission = await this.repository.createPermission(
      dto.vmId,
      dto.roleId,
      dto.bitmask,
    );

    await this.logHistory?.executeStructured({
      entity: 'permission_vm',
      entityId: `${permission.vmId}_${permission.roleId}`,
      action: 'CREATE_PERMISSION_VM',
      userId: userId || 'system',
      newValue: {
        vmId: permission.vmId,
        roleId: permission.roleId,
        bitmask: permission.bitmask,
      },
      metadata: {
        permissionType: 'vm',
      },
    });

    return PermissionVmDto.fromEntity(permission);
  }
}
