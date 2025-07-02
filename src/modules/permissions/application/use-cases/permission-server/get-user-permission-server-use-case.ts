import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PermissionServerDto } from '../../dto/permission.server.dto';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';
import { PermissionResolver } from '@/modules/permissions/application/utils/permission-resolver.util';

@Injectable()
export class GetUserServerPermissionsUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepo: UserRepositoryInterface,
    @Inject('PermissionServerRepositoryInterface')
    private readonly permissionServerRepo: PermissionServerRepositoryInterface,
  ) {}

  async execute(userId: string): Promise<PermissionServerDto[]> {
    const user = await this.userRepo.findOneByField({
      field: 'id',
      value: userId,
      relations: ['roles'],
    });

    const roleIds = user.roles?.map((r) => r.id) ?? [];
    if (!roleIds.length) {
      throw new UnauthorizedException('User has no role assigned');
    }

    const permissions = await PermissionResolver.resolveServerPermissions(
      this.permissionServerRepo,
      roleIds,
    );
    return PermissionServerDto.fromEntities(permissions);
  }
}
