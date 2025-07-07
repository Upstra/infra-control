import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { PermissionCheckResponseDto } from '../dto/permission-check.response.dto';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { PermissionSet } from '@/modules/permissions/domain/value-objects/ permission-set.value-object';
import { PermissionResolver } from '@/modules/permissions/application/utils/permission-resolver.util';

/**
 * Checks if a user has a specific permission on a VM.
 *
 * Responsibilities:
 * - Verify the VM exists
 * - Check user's permissions for the specific VM
 * - Return whether the user has the requested permission
 *
 * @param vmId       UUID of the VM to check
 * @param userId     UUID of the user requesting the check
 * @param permission The permission bit to check
 * @returns          Promise<PermissionCheckResponseDto>
 *
 * @throws NotFoundException if VM does not exist
 */
@Injectable()
export class CheckVmPermissionUseCase {
  private readonly logger = new Logger(CheckVmPermissionUseCase.name);

  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepo: UserRepositoryInterface,
    @Inject('PermissionVmRepositoryInterface')
    private readonly permissionRepo: PermissionVmRepositoryInterface,
    @Inject('VmRepositoryInterface')
    private readonly vmRepo: VmRepositoryInterface,
  ) {}

  async execute(
    vmId: string,
    userId: string,
    permission: PermissionBit,
  ): Promise<PermissionCheckResponseDto> {
    const vm = await this.vmRepo.findOneByField({
      field: 'id',
      value: vmId,
    });

    if (!vm) {
      this.logger.debug(`VM ${vmId} not found`);
      throw new NotFoundException('VM not found');
    }

    const user = await this.userRepo.findOneByField({
      field: 'id',
      value: userId,
      relations: ['roles'],
    });

    let hasPermission = false;

    if (user && user.roles && user.roles.length > 0) {
      const roleIds = user.roles.map((r) => r.id);
      this.logger.debug(`User ${userId} has roleIds ${roleIds.join(',')}`);

      const permissions = await PermissionResolver.resolveVmPermissions(
        this.permissionRepo,
        roleIds,
      );

      const permissionSet = new PermissionSet(permissions);
      const filteredPermissions = permissionSet.filterByBit(permission);
      
      hasPermission = filteredPermissions.hasGlobalAccess() || 
                     filteredPermissions.getAccessibleResourceIds().includes(vmId);
    }

    this.logger.debug(
      `User ${userId} ${hasPermission ? 'has' : 'does not have'} ${permission} permission for VM ${vmId}`,
    );

    return {
      hasPermission,
      userId,
      resourceId: vmId,
      resourceType: 'vm',
      permission,
    };
  }
}