import { Injectable } from '@nestjs/common';
import { PermissionServerRepository } from '../../../infrastructure/repositories/permission.server.repository';

@Injectable()
export class DeletePermissionServerUseCase {
  constructor(private readonly repository: PermissionServerRepository) {}

  async execute(serverId: string, roleId: string): Promise<void> {
    await this.repository.deletePermission(serverId, roleId);
  }
}
