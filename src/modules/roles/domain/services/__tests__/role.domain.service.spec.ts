import { RoleDomainService } from '../role.domain.service';
import {
  createMockPermissionServer,
  createMockPermissionVm,
} from '@/modules/permissions/__mocks__/permissions.mock';

describe('RoleDomainService', () => {
  let service: RoleDomainService;

  beforeEach(() => {
    service = new RoleDomainService();
  });

  it('should create an admin role entity', () => {
    const permServer = createMockPermissionServer();
    const permVm = createMockPermissionVm();
    const role = service.createAdminRoleEntity(permServer, permVm);
    expect(role.name).toBe('ADMIN');
    expect(role.permissionServers).toContain(permServer);
    expect(role.permissionVms).toContain(permVm);
  });

  it('should create a guest role entity', () => {
    const permServer = createMockPermissionServer();
    const permVm = createMockPermissionVm();
    const role = service.createGuestRole(permServer, permVm);
    expect(role.name).toBe('GUEST');
    expect(role.permissionServers).toContain(permServer);
    expect(role.permissionVms).toContain(permVm);
  });
});
