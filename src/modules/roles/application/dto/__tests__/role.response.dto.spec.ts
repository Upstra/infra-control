import { RoleResponseDto } from '../role.response.dto';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';

describe('RoleResponseDto', () => {
  it('should map role to dto correctly', () => {
    const role = createMockRole();
    const dto = new RoleResponseDto(role);
    expect(dto.id).toBe(role.id);
    expect(dto.name).toBe(role.name);
    expect(Array.isArray(dto.permissionServers)).toBe(true);
    expect(Array.isArray(dto.permissionVms)).toBe(true);
    expect(dto.permissionServers.length).toBe(role.permissionServers.length);
    expect(dto.permissionVms.length).toBe(role.permissionVms.length);
    expect(dto.canCreateServer).toBe(role.canCreateServer);
    expect(dto.isAdmin).toBe(role.isAdmin);
  });

  it('should work with empty permissions', () => {
    const role = createMockRole({ permissionServers: [], permissionVms: [] });
    const dto = new RoleResponseDto(role);
    expect(dto.permissionServers).toEqual([]);
    expect(dto.permissionVms).toEqual([]);
    expect(dto.canCreateServer).toBe(role.canCreateServer);
    expect(dto.isAdmin).toBe(role.isAdmin);
  });
});
