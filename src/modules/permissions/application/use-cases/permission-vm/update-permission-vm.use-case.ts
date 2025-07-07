import { Inject, Injectable } from '@nestjs/common';
import { PermissionVmDto } from '../../dto/permission.vm.dto';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';

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
  ) {}

  async execute(vmId: string, roleId: string, dto: PermissionVmDto): Promise<PermissionVmDto> {
    const updated = await this.repository.updatePermission(vmId, roleId, dto.bitmask);
    return PermissionVmDto.fromEntity(updated);
  }
}
