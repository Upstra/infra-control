import { PermissionServerDto } from '@/modules/permissions/application/dto/permission.server.dto';
import { PermissionDomainServerService } from '../permission.domain.server.service';
import { createMockPermissionServer } from '@/modules/permissions/__mocks__/permissions.mock';

describe('PermissionDomainServerService', () => {
  const service = new PermissionDomainServerService();

  it('should create a full permission entity', () => {
    const entity = service.createFullPermissionEntity();
    expect(entity).toEqual(
      expect.objectContaining({
        allowRead: true,
        allowWrite: true,
      }),
    );
  });

  it('should create a read-only permission entity', () => {
    const entity = service.createReadOnlyPermissionEntity();
    expect(entity).toEqual(
      expect.objectContaining({
        allowRead: true,
        allowWrite: false,
      }),
    );
  });

  it('should map DTO to permission entity', () => {
    const dto: PermissionServerDto = {
      serverId: 'server-uuid',
      roleId: 'role-uuid',
      allowRead: true,
      allowWrite: false,
    };
    const expected = createMockPermissionServer({
      serverId: dto.serverId,
      roleId: dto.roleId,
      allowRead: dto.allowRead,
      allowWrite: dto.allowWrite,
    });
    const entity = service.createPermissionEntityFromDto(dto);
    expect(entity).toEqual(expected);
  });
});
