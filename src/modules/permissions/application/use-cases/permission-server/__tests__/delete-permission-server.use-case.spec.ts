import { DeletePermissionServerUseCase } from '../delete-permission-server.use-case';
import { PermissionServerRepository } from '@/modules/permissions/infrastructure/repositories/permission.server.repository';
import { PermissionNotFoundException } from '@/modules/permissions/domain/exceptions/permission.exception';

describe('DeletePermissionServerUseCase', () => {
  let useCase: DeletePermissionServerUseCase;
  let repository: jest.Mocked<PermissionServerRepository>;

  beforeEach(() => {
    repository = {
      deletePermission: jest.fn(),
    } as any;

    useCase = new DeletePermissionServerUseCase(repository);
  });

  it('should call deletePermission with the correct ids', async () => {
    await useCase.execute('server-1', 'role-1');

    expect(repository.deletePermission).toHaveBeenCalledWith(
      'server-1',
      'role-1',
    );
  });

  it('should propagate error if deletion fails', async () => {
    repository.deletePermission.mockRejectedValue(
      new PermissionNotFoundException('Permission not found'),
    );

    await expect(
      useCase.execute('invalid-server', 'invalid-role'),
    ).rejects.toThrow(PermissionNotFoundException);
  });

  it('should succeed silently if deletion is successful', async () => {
    repository.deletePermission.mockResolvedValue(undefined);

    await expect(
      useCase.execute('server-2', 'role-2'),
    ).resolves.toBeUndefined();
  });
});
