import { UpdatePermissionServerUseCase } from '../update-permission-server.use-case';
import { PermissionServerRepository } from '@/modules/permissions/infrastructure/repositories/permission.server.repository';
import { PermissionServer } from '@/modules/permissions/domain/entities/permission.server.entity';
import { PermissionServerDto } from '@/modules/permissions/application/dto/permission.server.dto';
import { PermissionNotFoundException } from '@/modules/permissions/domain/exceptions/permission.exception';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';

describe('UpdatePermissionServerUseCase', () => {
  let useCase: UpdatePermissionServerUseCase;
  let repository: jest.Mocked<PermissionServerRepository>;

  const mockPermission = (
    overrides?: Partial<PermissionServer>,
  ): PermissionServer => {
    const base: Partial<PermissionServer> = {
      roleId: 'role-1',
      serverId: 'server-1',
      bitmask: PermissionBit.READ,
      ...overrides,
    };
    return Object.setPrototypeOf(
      base,
      PermissionServer.prototype,
    ) as PermissionServer;
  };

  beforeEach(() => {
    repository = {
      updatePermission: jest.fn(),
    } as any;

    useCase = new UpdatePermissionServerUseCase(repository);
  });

  it('should update the permission and return the updated dto', async () => {
    const updatedPermission = mockPermission({
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
    });

    repository.updatePermission.mockResolvedValue(updatedPermission);

    const dto = new PermissionServerDto({
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
    });

    const result = await useCase.execute('server-1', 'role-1', dto);

    expect(repository.updatePermission).toHaveBeenCalledWith(
      'server-1',
      'role-1',
      dto.bitmask,
    );
    expect(result).toEqual(new PermissionServerDto(updatedPermission));
  });

  it('should throw if updatePermission fails', async () => {
    repository.updatePermission.mockRejectedValue(
      new PermissionNotFoundException(),
    );

    const dto = new PermissionServerDto({
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
    });

    await expect(
      useCase.execute('invalid-server', 'invalid-role', dto),
    ).rejects.toThrow(PermissionNotFoundException);
  });

  it('should correctly map updated fields to dto', async () => {
    const updatedPermission = mockPermission({
      roleId: 'r1',
      serverId: 's1',
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
    });

    repository.updatePermission.mockResolvedValue(updatedPermission);

    const dto = new PermissionServerDto({
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
    });

    const result = await useCase.execute('s1', 'r1', dto);

    expect(result).toEqual({
      roleId: 'r1',
      serverId: 's1',
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
    });
  });
});
