import { Inject, Injectable } from '@nestjs/common';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';

@Injectable()
export class DeletePermissionVmUseCase {
  constructor(
    @Inject('PermissionVmRepositoryInterface')
    private readonly permissionVmRepository: PermissionVmRepositoryInterface,
  ) {}

  async execute(vmId: string, roleId: string): Promise<void> {
    await this.permissionVmRepository.deletePermission(vmId, roleId);
  }
}