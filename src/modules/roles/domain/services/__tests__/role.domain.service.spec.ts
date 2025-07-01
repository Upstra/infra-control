import { RoleDomainService } from '../role.domain.service';
import {
  createMockPermissionServer,
  createMockPermissionVm,
} from '@/modules/permissions/__mocks__/permissions.mock';
import { RoleCreationDto } from '@/modules/roles/application/dto/role.creation.dto';
import { AdminRoleCreationDto } from '@/modules/roles/application/dto/role.creation.dto';
import { RoleUpdateDto } from '@/modules/roles/application/dto/role.update.dto';
import { Role } from '../../entities/role.entity';

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

  it('should convert dto to role entity', () => {
    const dto: RoleCreationDto = { name: 'USER' };
    const role = service.toRoleEntity(dto);
    expect(role).toBeInstanceOf(Role);
    expect(role.name).toBe('USER');
  });

  it('should convert admin dto to role entity with flags', () => {
    const dto: AdminRoleCreationDto = Object.assign(new AdminRoleCreationDto(), {
      name: 'ADMIN',
      isAdmin: true,
      canCreateServer: true,
    });
    const role = service.toRoleEntity(dto);
    expect(role.isAdmin).toBe(true);
    expect(role.canCreateServer).toBe(true);
  });

  it('should update a role entity', () => {
    const role = new Role();
    role.name = 'OLD';
    role.isAdmin = false;
    const dto: RoleUpdateDto = { name: 'NEW', isAdmin: true, canCreateServer: true };
    const updated = service.updateRoleEntity(role, dto);
    expect(updated.name).toBe('NEW');
    expect(updated.isAdmin).toBe(true);
    expect(updated.canCreateServer).toBe(true);
  });
});
