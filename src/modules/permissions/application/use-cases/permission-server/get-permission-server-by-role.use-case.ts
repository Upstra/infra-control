import { Injectable } from '@nestjs/common';
import { PermissionServerRepository } from '../../../infrastructure/repositories/permission.server.repository';
import { PermissionServerDto } from '../../dto/permission.server.dto';
import { PermissionNotFoundException } from '../../../domain/exceptions/permission.exception';

@Injectable()
export class GetPermissionsServerByRoleUseCase {
  constructor(private readonly repository: PermissionServerRepository) {}

  async execute(roleId: string): Promise<PermissionServerDto[]> {
    try {
      const permissions = await this.repository.findAllByRole(roleId);
      return permissions.map((p) => new PermissionServerDto(p));
    } catch (error) {
      if (error instanceof PermissionNotFoundException) {
        throw error;
      }

      throw new PermissionNotFoundException(
        `Aucune permission trouvée pour le rôle ${roleId}`,
      );
    }
  }
}
