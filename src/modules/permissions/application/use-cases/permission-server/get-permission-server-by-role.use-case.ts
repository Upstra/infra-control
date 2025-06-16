import { Inject, Injectable } from '@nestjs/common';
import { PermissionServerDto } from '../../dto/permission.server.dto';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';

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
