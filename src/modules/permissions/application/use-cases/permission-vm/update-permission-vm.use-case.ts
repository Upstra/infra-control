import { Inject, Injectable } from '@nestjs/common';
import { PermissionVmRepository } from '../../../infrastructure/repositories/permission.vm.repository';
import { PermissionVmDto } from '../../dto/permission.vm.dto';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';

@Injectable()
export class UpdatePermissionVmUseCase {
  constructor(
    @Inject('PermissionVmRepositoryInterface')
    private readonly repository: PermissionVmRepositoryInterface,
  ) {}

  async execute(dto: PermissionVmDto): Promise<PermissionVmDto> {
    const updated = await this.repository.updatePermission(
      dto.vmId,
      dto.roleId,
      dto.bitmask,
    );
    return new PermissionVmDto(updated);
  }
}
