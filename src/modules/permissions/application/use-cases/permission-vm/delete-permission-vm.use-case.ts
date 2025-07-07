import { Inject, Injectable } from '@nestjs/common';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';

@Injectable()
export class DeletePermissionVmUseCase {
  constructor(
    @Inject('PermissionVmRepositoryInterface')
    private readonly permissionVmRepository: PermissionVmRepositoryInterface,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(vmId: string, roleId: string, userId?: string): Promise<void> {
    const permission = await this.permissionVmRepository.findPermissionByIds(
      vmId,
      roleId,
    );

    await this.permissionVmRepository.deletePermission(vmId, roleId);

    await this.logHistory?.executeStructured({
      entity: 'permission_vm',
      entityId: `${vmId}_${roleId}`,
      action: 'DELETE',
      userId: userId || 'system',
      oldValue: permission
        ? {
            vmId: permission.vmId,
            roleId: permission.roleId,
            bitmask: permission.bitmask,
          }
        : undefined,
      metadata: {
        permissionType: 'vm',
      },
    });
  }
}
