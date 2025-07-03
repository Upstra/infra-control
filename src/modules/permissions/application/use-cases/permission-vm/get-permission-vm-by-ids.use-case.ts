import { Inject, Injectable } from '@nestjs/common';
import { PermissionVmDto } from '../../dto/permission.vm.dto';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';

/**
 * Fetches VM permissions for a given list of VM IDs.
 *
 * Responsibilities:
 * - Validate the array of VM UUIDs.
 * - Delegate to PermissionDomainVmService to load each permission entry.
 *
 * @param vmIds  Array of VM UUIDs to retrieve permissions for.
 * @returns       Promise<PermissionVmDto[]> corresponding permission DTOs.
 *
 * @throws {NotFoundException} if any VM ID is invalid or missing.
 *
 * @example
 * const perms = await getPermissionVmByIdsUseCase.execute(['vm1','vm2']);
 */

@Injectable()
export class GetPermissionVmByIdsUseCase {
  constructor(
    @Inject('PermissionVmRepositoryInterface')
    private readonly repository: PermissionVmRepositoryInterface,
  ) {}

  async execute(dto: PermissionVmDto): Promise<PermissionVmDto> {
    const permission = await this.repository.findPermissionByIds(
      dto.vmId,
      dto.roleId,
    );
    return new PermissionVmDto(permission);
  }
}
