import { Inject, Injectable } from '@nestjs/common';
import { PermissionVmDto } from '../../dto/permission.vm.dto';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';

/**
 * Retrieves VM permissions associated with a specific role.
 *
 * Responsibilities:
 * - Fetch the role entity and its VM permission definitions.
 * - Return all VM IDs and allowed operations for that role.
 *
 * @param roleId  The UUID of the role to query.
 * @returns       Promise<PermissionVmDto[]> list of permissions granted to the role.
 *
 * @throws {NotFoundException} if the role does not exist.
 *
 * @example
 * const rolePerms = await getPermissionVmByRoleUseCase.execute('role-uuid-456');
 */

@Injectable()
export class GetPermissionsVmByRoleUseCase {
  constructor(
    @Inject('PermissionVmRepositoryInterface')
    private readonly repository: PermissionVmRepositoryInterface,
  ) {}

  async execute(roleId: string): Promise<PermissionVmDto[]> {
    const permissions = await this.repository.findAllByField({
      field: 'roleId',
      value: roleId,
    });
    return PermissionVmDto.fromEntities(permissions);
  }
}
