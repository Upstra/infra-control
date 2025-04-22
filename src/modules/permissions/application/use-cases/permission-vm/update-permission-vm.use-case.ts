import { Injectable } from '@nestjs/common';
import { PermissionVmRepository } from '../../../infrastructure/repositories/permission.vm.repository';
import { PermissionVmDto } from '../../dto/permission.vm.dto';

@Injectable()
export class UpdatePermissionVmUseCase {
  constructor(private readonly repository: PermissionVmRepository) {}

  async execute(dto: PermissionVmDto): Promise<PermissionVmDto> {
    try {
      const updated = await this.repository.updatePermission(
        dto.vmId,
        dto.roleId,
        dto.allowWrite,
        dto.allowRead,
      );
      return new PermissionVmDto(updated);
    } catch (error) {
      throw new Error('Erreur lors de la mise à jour de la permission VM');
    }
  }
}
