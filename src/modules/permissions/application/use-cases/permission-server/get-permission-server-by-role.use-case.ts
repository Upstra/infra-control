import { Inject, Injectable } from '@nestjs/common';
import { PermissionServerDto } from '../../dto/permission.server.dto';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';

/**
 * Retrieves server permissions associated with a specific role.
 *
 * Responsibilities:
 * - Fetches the role entity and its permission definitions.
 * - Returns all server IDs and operations allowed for that role.
 *
 * @param roleId  The UUID of the role to query.
 * @returns       Promise<PermissionServerDto[]> list of permissions granted to the role.
 *
 * @throws {NotFoundException} if the role does not exist.
 *
 * @example
 * const rolePerms = await getPermissionServerByRoleUseCase.execute('role-uuid-456');
 */

@Injectable()
export class GetPermissionsServerByRoleUseCase {
  constructor(
    @Inject('PermissionServerRepositoryInterface')
    private readonly repository: PermissionServerRepositoryInterface,
  ) {}

  async execute(roleId: string): Promise<PermissionServerDto[]> {
    const permissions = await this.repository.findAllByField({
      field: 'roleId',
      value: roleId,
    });
    return PermissionServerDto.fromEntities(permissions);
  }
}
