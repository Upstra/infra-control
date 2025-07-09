import { Inject, Injectable } from '@nestjs/common';
import { PermissionVmDto } from '../../dto/permission.vm.dto';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';

/**
 * Fetches VM permission for a specific VM and role.
 *
 * Responsibilities:
 * - Validate the VM and role UUIDs.
 * - Retrieve the permission entry from the repository.
 *
 * @param vmId    VM UUID to retrieve permission for.
 * @param roleId  Role UUID to retrieve permission for.
 * @returns       Promise<PermissionVmDto> corresponding permission DTO.
 *
 * @throws {NotFoundException} if VM ID or role ID is invalid or missing.
 *
 * @example
 * const perm = await getPermissionVmByIdsUseCase.execute('vm1', 'role1');
 */

@Injectable()
export class GetPermissionVmByIdsUseCase {
  constructor(
    @Inject('PermissionVmRepositoryInterface')
    private readonly repository: PermissionVmRepositoryInterface,
  ) {}

  async execute(vmId: string, roleId: string): Promise<PermissionVmDto> {
    const permission = await this.repository.findPermissionByIds(vmId, roleId);
    return PermissionVmDto.fromEntity(permission);
  }
}
