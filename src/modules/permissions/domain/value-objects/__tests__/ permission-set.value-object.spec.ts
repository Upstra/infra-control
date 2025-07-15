import { DummyPermission } from '@/modules/permissions/__mocks__/permissions.mock';
import { PermissionSet } from '../ permission-set.value-object';
import { PermissionBit } from '../permission-bit.enum';

describe('PermissionSet', () => {
  it('should detect global access if any permission has no resourceId', () => {
    const perms = [new DummyPermission(PermissionBit.WRITE, 'srv-1')];
    const set = new PermissionSet(perms);
    expect(set.hasGlobalAccess()).toBe(true);
  });

  it('should not detect global access if all permissions have resourceIds', () => {
    const perms = [
      new DummyPermission(PermissionBit.READ, 'srv-1'),
      new DummyPermission(PermissionBit.WRITE, 'srv-2'),
    ];
    const set = new PermissionSet(perms);
    expect(set.hasGlobalAccess()).toBe(false);
  });

  it('should return all resourceIds (serverId or vmId)', () => {
    const perms = [new DummyPermission(PermissionBit.READ, 'srv-1')];
    const set = new PermissionSet(perms);
    expect(set.getAccessibleResourceIds()).toEqual(['srv-1']);
  });

  it('should filter by bitmask', () => {
    const perms = [
      new DummyPermission(PermissionBit.READ, 'srv-1'),
      new DummyPermission(PermissionBit.WRITE, 'srv-2'),
      new DummyPermission(PermissionBit.READ | PermissionBit.WRITE, 'srv-3'),
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

  it('should filter nothing if no permissions match bitmask', () => {
    const perms = [new DummyPermission(PermissionBit.WRITE, 'srv-1')];
    const set = new PermissionSet(perms);
    expect(set.filterByBit(PermissionBit.READ)['permissions']).toEqual([]);
  });
});
