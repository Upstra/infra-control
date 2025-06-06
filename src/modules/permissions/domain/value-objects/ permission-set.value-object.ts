import { Permission } from '../entities/permission.entity';
import { PermissionBit } from './permission-bit.enum';

interface ResourcePermission extends Permission {
  resourceId?: string | null;
}

export class PermissionSet<T extends ResourcePermission> {
  constructor(private readonly permissions: T[]) {}

  hasGlobalAccess(): boolean {
    return this.permissions.some((p) => !this.getResourceId(p));
  }

  getAccessibleResourceIds(): string[] {
    return this.permissions
      .map((p) => this.getResourceId(p))
      .filter((id): id is string => id !== null && id !== undefined);
  }

  filterByBit(bit: PermissionBit): PermissionSet<T> {
    return new PermissionSet(
      this.permissions.filter((p) => (p.bitmask & bit) === bit),
    );
  }

  private getResourceId(permission: T): string | null | undefined {
    if (
      'serverId' in permission &&
      permission.serverId !== undefined &&
      permission.serverId !== null
    ) {
      return permission.serverId as string;
    }
    if (
      'vmId' in permission &&
      permission.vmId !== undefined &&
      permission.vmId !== null
    ) {
      return permission.vmId as string;
    }
    return null;
  }
}
