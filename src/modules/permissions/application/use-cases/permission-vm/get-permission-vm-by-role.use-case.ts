import { Injectable } from '@nestjs/common';
import { PermissionVmRepository } from '../../../infrastructure/repositories/permission.vm.repository';
import { PermissionVmDto } from '../../dto/permission.vm.dto';

@Injectable()
export class GetPermissionsVmByRoleUseCase {
  constructor(private readonly repository: PermissionVmRepository) {}

  async execute(roleId: string): Promise<PermissionVmDto[]> {
    try {
      const permissions = await this.repository.findAllByRole(roleId);
      return permissions.map((p) => new PermissionVmDto(p));
    } catch (error) {
      throw new Error(
        'Erreur lors de la récupération des permissions VM par rôle',
      );
    }
  }
}
