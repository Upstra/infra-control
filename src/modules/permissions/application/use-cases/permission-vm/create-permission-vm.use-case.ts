import { Inject, Injectable } from '@nestjs/common';
import { PermissionVmDto } from '../../dto/permission.vm.dto';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';

@Injectable()
export class CreatePermissionVmUseCase {
  constructor(
    @Inject('PermissionVmRepositoryInterface')
    private readonly repository: PermissionVmRepositoryInterface,
  ) {}

  async execute(dto: PermissionVmDto): Promise<PermissionVmDto> {
    const permission = await this.repository.createPermission(
      dto.vmId,
      dto.roleId,
      dto.bitmask,
    );
    return new PermissionVmDto(permission);
  }
}
