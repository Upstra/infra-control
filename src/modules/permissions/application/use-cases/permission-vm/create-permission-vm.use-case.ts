import { Injectable } from '@nestjs/common';
import { PermissionVmRepository } from '../../../infrastructure/repositories/permission.vm.repository';
import { PermissionVmDto } from '../../dto/permission.vm.dto';

@Injectable()
export class CreatePermissionVmUseCase {
  constructor(private readonly repository: PermissionVmRepository) {}

  async execute(dto: PermissionVmDto): Promise<PermissionVmDto> {
    const permission = await this.repository.createPermission(
      dto.vmId,
      dto.roleId,
      dto.allowWrite,
      dto.allowRead,
    );
    return new PermissionVmDto(permission);
  }
}
