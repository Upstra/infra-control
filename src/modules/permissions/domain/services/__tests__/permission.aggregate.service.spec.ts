import { PermissionAggregateService } from '../permission.aggregate.service';
import {
  createMockPermissionServer,
  createMockPermissionVm,
} from '@/modules/permissions/__mocks__/permissions.mock';
import { PermissionBit } from '../../value-objects/permission-bit.enum';

describe('PermissionAggregateService', () => {
  it('aggregates server permissions by serverId', () => {
    const perms = [
      createMockPermissionServer({
        serverId: 'srv1',
        bitmask: PermissionBit.READ,
      }),
      createMockPermissionServer({
        serverId: 'srv1',
        bitmask: PermissionBit.WRITE,
      }),
      createMockPermissionServer({
        serverId: 'srv2',
        bitmask: PermissionBit.DELETE,
      }),
      createMockPermissionServer({
        serverId: null,
        bitmask: PermissionBit.RESTART,
      }),
      createMockPermissionServer({
        serverId: null,
        bitmask: PermissionBit.SHUTDOWN,
      }),
    ];
    const result = PermissionAggregateService.aggregateServers(perms);
    const srv1 = result.find((p) => p.serverId === 'srv1');
    const srv2 = result.find((p) => p.serverId === 'srv2');
    const global = result.find((p) => !p.serverId);
    expect(srv1?.bitmask).toBe(PermissionBit.READ | PermissionBit.WRITE);
    expect(srv2?.bitmask).toBe(PermissionBit.DELETE);
    expect(global?.bitmask).toBe(
      PermissionBit.RESTART | PermissionBit.SHUTDOWN,
    );
    expect(result).toHaveLength(3);
  });

  it('aggregates vm permissions by vmId', () => {
    const perms = [
      createMockPermissionVm({ vmId: 'vm1', bitmask: PermissionBit.READ }),
      createMockPermissionVm({ vmId: 'vm1', bitmask: PermissionBit.DELETE }),
      createMockPermissionVm({
        vmId: undefined,
        bitmask: PermissionBit.RESTART,
      }),
    ];
    const result = PermissionAggregateService.aggregateVms(perms);
    const vm1 = result.find((p) => p.vmId === 'vm1');
    const global = result.find((p) => !p.vmId);
    expect(vm1?.bitmask).toBe(PermissionBit.READ | PermissionBit.DELETE);
    expect(global?.bitmask).toBe(PermissionBit.RESTART);
    expect(result).toHaveLength(2);
  });
});
