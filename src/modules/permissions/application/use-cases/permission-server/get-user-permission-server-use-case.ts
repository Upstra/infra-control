import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PermissionServerDto } from '../../dto/permission.server.dto';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';

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
      relations: ['role'],
    });

    const roleId = user.roleId;
    if (!roleId) throw new UnauthorizedException('User has no role assigned');

    const permissions = await this.permissionServerRepo.findAllByField({
      field: 'roleId',
      value: roleId,
    });
    return PermissionServerDto.fromEntities(permissions);
  }
}
