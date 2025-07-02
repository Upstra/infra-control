import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { PermissionVmDto } from '../../dto/permission.vm.dto';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';

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

    const roleId = user.roles?.[0]?.id;
    if (!roleId) throw new UnauthorizedException('User has no role assigned');

    const permissions = await this.permissionVmRepo.findAllByField({
      field: 'roleId',
      value: roleId,
    });
    return PermissionVmDto.fromEntities(permissions);
  }
}
