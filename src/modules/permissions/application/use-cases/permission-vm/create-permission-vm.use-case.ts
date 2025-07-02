import { Inject, Injectable } from '@nestjs/common';
import { PermissionVmDto } from '../../dto/permission.vm.dto';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';

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
  ) {}

  async execute(dto: PermissionVmDto): Promise<PermissionVmDto> {
    const permission = await this.repository.createPermission(
      dto.vmId,
      dto.roleId,
      dto.bitmask,
    );
    return new PermissionVmDto(permission);
  }
}
