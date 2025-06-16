import { GetPermissionsServerByRoleUseCase } from '../get-permission-server-by-role.use-case';
import { PermissionServerRepository } from '@/modules/permissions/infrastructure/repositories/permission.server.repository';
import { PermissionServer } from '@/modules/permissions/domain/entities/permission.server.entity';
import { PermissionServerDto } from '@/modules/permissions/application/dto/permission.server.dto';
import { PermissionNotFoundException } from '@/modules/permissions/domain/exceptions/permission.exception';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';

describe('GetPermissionsServerByRoleUseCase', () => {
  let useCase: GetPermissionsServerByRoleUseCase;
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
      findAllByField: jest.fn(),
    } as any;

    useCase = new GetPermissionsServerByRoleUseCase(repository);
  });

  it('should return an array of PermissionServerDto', async () => {
    const entities = [
      mockPermission({ serverId: 'srv-1' }),
      mockPermission({
        serverId: 'srv-2',
        bitmask: PermissionBit.READ | PermissionBit.WRITE,
      }),
    ];

    repository.findAllByField.mockResolvedValue(entities);

    const result = await useCase.execute('role-1');

    expect(repository.findAllByField).toHaveBeenCalledWith({
      field: 'roleId',
      value: 'role-1',
    });
    expect(result).toEqual(entities.map((p) => new PermissionServerDto(p)));
  });

  it('should return an empty array if no permissions are found', async () => {
    repository.findAllByField.mockResolvedValue([]);

    const result = await useCase.execute('role-empty');

    expect(result).toEqual([]);
  });

  it('should throw if repository throws', async () => {
    repository.findAllByField.mockRejectedValue(
      new PermissionNotFoundException(),
    );

    await expect(useCase.execute('invalid-role')).rejects.toThrow(
      PermissionNotFoundException,
    );
  });
});
