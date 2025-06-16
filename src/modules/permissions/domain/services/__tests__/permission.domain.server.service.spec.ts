import { PermissionServerDto } from '@/modules/permissions/application/dto/permission.server.dto';
import { PermissionDomainServerService } from '../permission.domain.server.service';
import { createMockPermissionServer } from '@/modules/permissions/__mocks__/permissions.mock';
import { PermissionBit } from '../../value-objects/permission-bit.enum';

describe('PermissionDomainServerService', () => {
  const service = new PermissionDomainServerService();

  it('should create a full permission entity', () => {
    const entity = service.createFullPermissionEntity();
    expect(entity).toEqual(
      expect.objectContaining({
        bitmask: PermissionBit.READ | PermissionBit.WRITE,
      }),
    );
  });

  it('should create a read-only permission entity', () => {
    const entity = service.createReadOnlyPermissionEntity();
    expect(entity).toEqual(
      expect.objectContaining({
        bitmask: PermissionBit.READ,
      }),
    );
  });

  it('should map DTO to permission entity', () => {
    const dto: PermissionServerDto = {
      serverId: 'server-uuid',
      roleId: 'role-uuid',
      bitmask: PermissionBit.READ,
    };
    const expected = createMockPermissionServer({
      serverId: dto.serverId,
      roleId: dto.roleId,
      bitmask: dto.bitmask,
    });
    const entity = service.createPermissionEntityFromDto(dto);
    expect(entity).toEqual(expected);
  });
});
