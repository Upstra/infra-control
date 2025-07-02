import { PermissionServer } from '../entities/permission.server.entity';
import { PermissionVm } from '../entities/permission.vm.entity';

export class PermissionAggregateService {
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
