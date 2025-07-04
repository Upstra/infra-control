import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { PermissionVmDto } from '../../dto/permission.vm.dto';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';
import { PermissionResolver } from '@/modules/permissions/application/utils/permission-resolver.util';

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
      relations: ['roles'],
      disableThrow: true,
    });
    if (!user) throw new UnauthorizedException('User not found');

    const roleIds = user.roles?.map((r) => r.id) ?? [];
    if (!roleIds.length) {
      throw new UnauthorizedException('User has no role assigned');
    }

    const permissions = await PermissionResolver.resolveVmPermissions(
      this.permissionVmRepo,
      roleIds,
    );
    return PermissionVmDto.fromEntities(permissions);
  }
}
