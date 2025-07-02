import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { PermissionVmDto } from '../../dto/permission.vm.dto';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';

/**
 * Retrieves all VM permissions granted to a specific user.
 *
 * Responsibilities:
 * - Load user entity and its assigned roles.
 * - Aggregate permissions for each VM based on role and direct grants.
 *
 * @param userId  The UUID of the user whose VM permissions to fetch.
 * @returns       Promise<PermissionVmDto[]> array of per-VM permission DTOs.
 *
 * @remarks
 * Used by controllers or UI layers to display a user’s VM access rights;
 * does not modify state.
 *
 * @example
 * const perms = await getUserPermissionVmUseCase.execute('user-uuid-123');
 */

@Injectable()
export class GetUserVmPermissionsUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepo: UserRepositoryInterface,
    @Inject('PermissionServerRepositoryInterface')
    private readonly permissionVmRepo: PermissionVmRepositoryInterface,
  ) {}

  async execute(userId: string): Promise<PermissionVmDto[]> {
    const user = await this.userRepo.findOneByField({
      field: 'id',
      value: userId,
      relations: ['role'],
      disableThrow: true,
    });
    if (!user) throw new UnauthorizedException('User not found');

    const roleId = user.roleId;
    if (!roleId) throw new UnauthorizedException('User has no role assigned');

    const permissions = await this.permissionVmRepo.findAllByField({
      field: 'roleId',
      value: roleId,
    });
    return PermissionVmDto.fromEntities(permissions);
  }
}
