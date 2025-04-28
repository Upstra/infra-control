import { Injectable } from '@nestjs/common';
import { PermissionServerRepository } from '../../../infrastructure/repositories/permission.server.repository';
import { PermissionServerDto } from '../../dto/permission.server.dto';

@Injectable()
export class GetPermissionsServerByRoleUseCase {
  constructor(private readonly repository: PermissionServerRepository) {}

  async execute(roleId: string): Promise<PermissionServerDto[]> {
    const permissions = await this.repository.findAllByRole(roleId);
    return permissions.map((p) => new PermissionServerDto(p));
  }
}
