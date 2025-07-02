import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { PermissionVmDto } from '../../dto/permission.vm.dto';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';
import { PermissionResolver } from '@/modules/permissions/application/utils/permission-resolver.util';

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
