import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';
import { PermissionAggregateService } from '@/modules/permissions/domain/services/permission.aggregate.service';
import { PermissionServer } from '@/modules/permissions/domain/entities/permission.server.entity';

export class PermissionResolver {
  static async resolveServerPermissions(
    repo: PermissionServerRepositoryInterface,
    roleIds: string[],
  ): Promise<PermissionServer[]> {
    const permsArrays = await Promise.all(
      roleIds.map((id) => repo.findAllByField({ field: 'roleId', value: id })),
    );
    return PermissionAggregateService.aggregateServers(permsArrays.flat());
  }
}
