import { PermissionDomainVmService } from '../permission.domain.vm.service';
import { createMockPermissionVm } from '@/modules/permissions/__mocks__/permissions.mock';

describe('PermissionDomainVmService', () => {
  const service = new PermissionDomainVmService();

  it('should create a full permission entity', () => {
    const entity = service.createFullPermissionEntity();
    const expected = createMockPermissionVm({
      allowRead: true,
      allowWrite: true,
    });
    expect(entity).toEqual(expected);
  });

  it('should create a read-only permission entity', () => {
    const entity = service.createReadOnlyPermissionEntity();
    const expected = createMockPermissionVm({
      allowRead: true,
      allowWrite: false,
    });
    expect(entity).toEqual(expected);
  });
});
