import { DeletePermissionServerUseCase } from '../delete-permission-server.use-case';
import { PermissionServerRepository } from '@/modules/permissions/infrastructure/repositories/permission.server.repository';
import { PermissionNotFoundException } from '@/modules/permissions/domain/exceptions/permission.exception';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';
import { createMockPermissionServer } from '@/modules/permissions/__mocks__/permissions.mock';

describe('DeletePermissionServerUseCase', () => {
  let useCase: DeletePermissionServerUseCase;
  let repository: jest.Mocked<PermissionServerRepository>;
  let logHistoryMock: jest.Mocked<LogHistoryUseCase>;

  beforeEach(() => {
    repository = {
      deletePermission: jest.fn(),
      findPermissionByIds: jest.fn(),
    } as any;

    logHistoryMock = {
      executeStructured: jest.fn(),
    } as any;

    useCase = new DeletePermissionServerUseCase(repository, logHistoryMock);
  });

  it('should call deletePermission with the correct ids', async () => {
    const mockPermission = createMockPermissionServer();
    repository.findPermissionByIds.mockResolvedValue(mockPermission);
    repository.deletePermission.mockResolvedValue(undefined);

    await useCase.execute('server-1', 'role-1', 'user-id');

    expect(repository.findPermissionByIds).toHaveBeenCalledWith(
      'server-1',
      'role-1',
    );
    expect(repository.deletePermission).toHaveBeenCalledWith(
      'server-1',
      'role-1',
    );
    expect(logHistoryMock.executeStructured).toHaveBeenCalledWith({
      entity: 'permission_server',
      entityId: 'server-1_role-1',
      action: 'DELETE',
      userId: 'user-id',
      oldValue: {
        serverId: mockPermission.serverId,
        roleId: mockPermission.roleId,
        bitmask: mockPermission.bitmask,
      },
      metadata: {
        permissionType: 'server',
      },
    });
  });

  it('should propagate error if deletion fails', async () => {
    const mockPermission = createMockPermissionServer();
    repository.findPermissionByIds.mockResolvedValue(mockPermission);
    repository.deletePermission.mockRejectedValue(
      new PermissionNotFoundException(
        'server',
        '37d9d586-e49a-49e7-b743-d5f251b5236e',
      ),
    );

    await expect(
      useCase.execute('invalid-server', 'invalid-role'),
    ).rejects.toThrow(PermissionNotFoundException);
  });

  it('should succeed silently if deletion is successful', async () => {
    const mockPermission = createMockPermissionServer();
    repository.findPermissionByIds.mockResolvedValue(mockPermission);
    repository.deletePermission.mockResolvedValue(undefined);

    await expect(
      useCase.execute('server-2', 'role-2'),
    ).resolves.toBeUndefined();
  });
});
