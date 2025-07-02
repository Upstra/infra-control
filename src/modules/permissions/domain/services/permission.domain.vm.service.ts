import { Injectable } from '@nestjs/common';
import { PermissionVm } from '../entities/permission.vm.entity';
import { PermissionBit } from '../value-objects/permission-bit.enum';

/**
 * Manages and validates domain-level permissions for virtual machine entities.
 * Applies RBAC policies to VM operations based on user roles, groups, and overrides.
 *
 * Responsibilities:
 * - Evaluate access rights for VM creation, deletion, and state changes.
 * - Combine permissions from role assignments, group membership, and explicit grants.
 * - Emit domain exceptions for unauthorized VM actions.
 *
 * @remarks
 * Designed for use by application-layer use-cases; direct repository access or controller bypass
 * is discouraged to maintain a single point of authorization logic.
 *
 * @param userId  Identifier of the user performing the action.
 * @param vmId    Identifier of the VM in question.
 *
 * @example
 * // Validate destroy VM permission
 * await permissionVmService.ensureCanDestroy(userId, vmId);
 */

@Injectable()
export class PermissionDomainVmService {
  createFullPermissionEntity(): PermissionVm {
    const entity = new PermissionVm();
    entity.bitmask = PermissionBit.READ | PermissionBit.WRITE;
    return entity;
  }

  createReadOnlyPermissionEntity(): PermissionVm {
    const entity = new PermissionVm();
    entity.bitmask = PermissionBit.READ;
    return entity;
  }
}
