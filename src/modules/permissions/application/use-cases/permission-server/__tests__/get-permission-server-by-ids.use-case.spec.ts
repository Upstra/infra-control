import { GetPermissionServerByIdsUseCase } from '../get-permission-server-by-ids.use-case';
import { PermissionServerRepository } from '@/modules/permissions/infrastructure/repositories/permission.server.repository';
import { PermissionServer } from '@/modules/permissions/domain/entities/permission.server.entity';
import { PermissionNotFoundException } from '@/modules/permissions/domain/exceptions/permission.exception';
import { PermissionServerDto } from '@/modules/permissions/application/dto/permission.server.dto';

describe('GetPermissionServerByIdsUseCase', () => {
  let useCase: GetPermissionServerByIdsUseCase;
  let repository: jest.Mocked<PermissionServerRepository>;

  const mockPermission = (
    overrides?: Partial<PermissionServer>,
  ): PermissionServer => {
    const base: Partial<PermissionServer> = {
      roleId: 'role-1',
      serverId: 'server-1',
      allowRead: true,
      allowWrite: false,
      ...overrides,
    };
    return Object.setPrototypeOf(
      base,
      PermissionServer.prototype,
    ) as PermissionServer;
  };

  beforeEach(() => {
    repository = {
      findPermissionByIds: jest.fn(),
    } as any;

    useCase = new GetPermissionServerByIdsUseCase(repository);
  });

  it('should return a PermissionServerDto for given role and server ids', async () => {
    const permission = mockPermission();
    repository.findPermissionByIds.mockResolvedValue(permission);

    const result = await useCase.execute('server-1', 'role-1');

    expect(repository.findPermissionByIds).toHaveBeenCalledWith(
      'server-1',
      'role-1',
    );
    expect(result).toEqual(new PermissionServerDto(permission));
  });

  it('should throw if no permission is found', async () => {
    repository.findPermissionByIds.mockRejectedValue(
      new PermissionNotFoundException(),
    );

    await expect(
      useCase.execute('invalid-server', 'invalid-role'),
    ).rejects.toThrow(PermissionNotFoundException);
  });

  it('should map fields correctly from entity to dto', async () => {
    const permission = mockPermission({
      roleId: 'admin',
      serverId: 'srv-42',
      allowRead: true,
      allowWrite: true,
    });
    repository.findPermissionByIds.mockResolvedValue(permission);

    const result = await useCase.execute('srv-42', 'admin');

    expect(result).toEqual({
      roleId: 'admin',
      serverId: 'srv-42',
      allowRead: true,
      allowWrite: true,
    });
  });
});
