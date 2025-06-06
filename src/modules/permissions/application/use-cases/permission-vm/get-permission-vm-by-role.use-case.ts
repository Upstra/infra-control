import { Inject, Injectable } from '@nestjs/common';
import { PermissionVmDto } from '../../dto/permission.vm.dto';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';

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
