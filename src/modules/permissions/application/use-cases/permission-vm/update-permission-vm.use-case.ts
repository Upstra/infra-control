import { Inject, Injectable } from '@nestjs/common';
import { PermissionVmDto } from '../../dto/permission.vm.dto';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';

/**
 * Updates an existing VM permission entry with new actions or scope.
 *
 * Responsibilities:
 * - Fetch existing permission by its ID.
 * - Apply changes from UpdatePermissionVmDto (actions, expiry, etc.).
 * - Persist and return the updated permission DTO.
 *
 * @param id   The UUID of the permission record to update.
 * @param dto  UpdatePermissionVmDto containing updated fields.
 * @returns    Promise<PermissionVmDto> of the modified record.
 *
 * @throws {NotFoundException} if no permission entry matches the given ID.
 *
 * @example
 * const updated = await updatePermissionVmUseCase.execute(permissionId, { actions: ['start','reboot'] });
 */

@Injectable()
export class UpdatePermissionVmUseCase {
  constructor(
    @Inject('PermissionVmRepositoryInterface')
    private readonly repository: PermissionVmRepositoryInterface,
  ) {}

  async execute(dto: PermissionVmDto): Promise<PermissionVmDto> {
    const updated = await this.repository.updatePermission(
      dto.vmId,
      dto.roleId,
      dto.bitmask,
    );
    return new PermissionVmDto(updated);
  }
}
