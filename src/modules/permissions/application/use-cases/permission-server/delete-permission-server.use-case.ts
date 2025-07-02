import { Inject, Injectable } from '@nestjs/common';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';

/**
 * Revokes and deletes a server permission entry by its identifier.
 *
 * Responsibilities:
 * - Validates existence of the permission record.
 * - Removes it from persistence, ensuring cleanup of related constraints.
 *
 * @param id  The UUID of the permission record to delete.
 * @returns   Promise<void> upon successful deletion.
 *
 * @remarks
 * Use-cases should ensure that no dependent operations rely on this permission.
 *
 * @example
 * await deletePermissionServerUseCase.execute('perm-uuid-789');
 */

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
