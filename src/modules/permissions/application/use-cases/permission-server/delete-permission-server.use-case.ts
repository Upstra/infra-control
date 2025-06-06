import { Inject, Injectable } from '@nestjs/common';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';

@Injectable()
export class DeletePermissionServerUseCase {
  constructor(
    @Inject('PermissionServerRepositoryInterface')
    private readonly repository: PermissionServerRepositoryInterface,
  ) {}

  async execute(serverId: string, roleId: string): Promise<void> {
    await this.repository.deletePermission(serverId, roleId);
  }
}
