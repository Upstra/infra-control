import { PermissionDomainVmService } from '../permission.domain.vm.service';
import { createMockPermissionVm } from '@/modules/permissions/__mocks__/permissions.mock';
import { PermissionBit } from '../../value-objects/permission-bit.enum';

describe('PermissionDomainVmService', () => {
  const service = new PermissionDomainVmService();

  it('should create a full permission entity', () => {
    const entity = service.createFullPermissionEntity();
    const expected = createMockPermissionVm({
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
      vmId: undefined,
      roleId: undefined,
    });
    expect(entity).toEqual(expected);
  });

  it('should create a read-only permission entity', () => {
    const entity = service.createReadOnlyPermissionEntity();
    const expected = createMockPermissionVm({
      bitmask: PermissionBit.READ,
      vmId: undefined,
      roleId: undefined,
    });
    expect(entity).toEqual(expected);
  });
});
