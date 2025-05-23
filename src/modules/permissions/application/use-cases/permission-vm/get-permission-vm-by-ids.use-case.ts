import { Injectable } from '@nestjs/common';
import { PermissionVmRepository } from '../../../infrastructure/repositories/permission.vm.repository';
import { PermissionVmDto } from '../../dto/permission.vm.dto';

@Injectable()
export class GetPermissionVmByIdsUseCase {
  constructor(private readonly repository: PermissionVmRepository) {}

  async execute(dto: PermissionVmDto): Promise<PermissionVmDto> {
    const permission = await this.repository.findPermissionByIds(
      dto.vmId,
      dto.roleId,
    );
    return new PermissionVmDto(permission);
  }
}
