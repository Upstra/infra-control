import { PermissionServer } from '../entities/permission.server.entity';
import { PermissionVm } from '../entities/permission.vm.entity';

export class PermissionAggregateService {
  /**
   * Aggregate server permissions by their server ID.
   * This method combines permissions for the same server ID
   * by performing a bitwise OR operation on their bitmasks.
   * If a permission has no server ID, it is treated as a global permission.
   * The global permission is represented by a server ID of `undefined`.
   * @param perms - The array of server permissions to aggregate.
   * @returns The aggregated server permissions.
   */
  static aggregateServers(perms: PermissionServer[]): PermissionServer[] {
    const map = new Map<string | undefined, number>();
    for (const p of perms) {
      const key = p.serverId ?? '__global';
      map.set(key, (map.get(key) ?? 0) | p.bitmask);
    }
    const res: PermissionServer[] = [];
    for (const [key, bitmask] of map) {
      const perm = new PermissionServer();
      perm.serverId = key === '__global' ? undefined : key;
      perm.bitmask = bitmask;
      res.push(perm);
    }
    return res;
  }

  /**
   * Aggregate VM permissions by their VM ID.
   * This method combines permissions for the same VM ID
   * by performing a bitwise OR operation on their bitmasks.
   * If a permission has no VM ID, it is treated as a global permission.
   * The global permission is represented by a VM ID of `undefined`.
   * @param perms - The array of VM permissions to aggregate.
   * This method combines permissions for the same VM ID
   * @returns The aggregated VM permissions.
   */
  static aggregateVms(perms: PermissionVm[]): PermissionVm[] {
    const map = new Map<string | undefined, number>();
    for (const p of perms) {
      const key = p.vmId ?? '__global';
      map.set(key, (map.get(key) ?? 0) | p.bitmask);
    }
    const res: PermissionVm[] = [];
    for (const [key, bitmask] of map) {
      const perm = new PermissionVm();
      perm.vmId = key === '__global' ? undefined : key;
      perm.bitmask = bitmask;
      res.push(perm);
    }
    return res;
  }
}
