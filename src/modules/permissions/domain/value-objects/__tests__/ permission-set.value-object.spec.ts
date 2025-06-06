import { DummyPermission } from '@/modules/permissions/__mocks__/permissions.mock';
import { PermissionSet } from '../ permission-set.value-object';
import { PermissionBit } from '../permission-bit.enum';

describe('PermissionSet', () => {
  it('should detect global access if any permission has no resourceId', () => {
    const perms = [
      new DummyPermission(PermissionBit.READ, { serverId: null }),
      new DummyPermission(PermissionBit.WRITE, { serverId: 'srv-1' }),
    ];
    const set = new PermissionSet(perms);
    expect(set.hasGlobalAccess()).toBe(true);
  });

  it('should not detect global access if all permissions have resourceIds', () => {
    const perms = [
      new DummyPermission(PermissionBit.READ, { serverId: 'srv-1' }),
      new DummyPermission(PermissionBit.WRITE, { serverId: 'srv-2' }),
    ];
    const set = new PermissionSet(perms);
    expect(set.hasGlobalAccess()).toBe(false);
  });

  it('should return all resourceIds (serverId or vmId)', () => {
    const perms = [
      new DummyPermission(PermissionBit.READ, { serverId: 'srv-1' }),
      new DummyPermission(PermissionBit.READ, { vmId: 'vm-2' }),
      new DummyPermission(PermissionBit.READ, { serverId: null }),
      new DummyPermission(PermissionBit.READ),
    ];
    const set = new PermissionSet(perms);
    expect(set.getAccessibleResourceIds()).toEqual(['srv-1', 'vm-2']);
  });

  it('should filter by bitmask', () => {
    const perms = [
      new DummyPermission(PermissionBit.READ, { serverId: 'srv-1' }),
      new DummyPermission(PermissionBit.WRITE, { serverId: 'srv-2' }),
      new DummyPermission(PermissionBit.READ | PermissionBit.WRITE, {
        serverId: 'srv-3',
      }),
    ];
    const set = new PermissionSet(perms);

    expect(set.filterByBit(PermissionBit.READ)['permissions']).toEqual([
      perms[0],
      perms[2],
    ]);
    expect(set.filterByBit(PermissionBit.WRITE)['permissions']).toEqual([
      perms[1],
      perms[2],
    ]);
  });

  it('should handle empty permissions', () => {
    const set = new PermissionSet([]);
    expect(set.hasGlobalAccess()).toBe(false);
    expect(set.getAccessibleResourceIds()).toEqual([]);
    expect(set.filterByBit(PermissionBit.READ)['permissions']).toEqual([]);
  });

  it('should support permissions with only vmId', () => {
    const perms = [
      new DummyPermission(PermissionBit.READ, { vmId: 'vm-1' }),
      new DummyPermission(PermissionBit.READ, { vmId: null }),
    ];
    const set = new PermissionSet(perms);
    expect(set.hasGlobalAccess()).toBe(true);
    expect(set.getAccessibleResourceIds()).toEqual(['vm-1']);
  });

  it('should filter nothing if no permissions match bitmask', () => {
    const perms = [
      new DummyPermission(PermissionBit.WRITE, { serverId: 'srv-1' }),
    ];
    const set = new PermissionSet(perms);
    expect(set.filterByBit(PermissionBit.READ)['permissions']).toEqual([]);
  });
});
